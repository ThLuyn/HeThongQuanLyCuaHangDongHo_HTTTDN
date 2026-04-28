const bcrypt = require("bcryptjs");
const User   = require("../models/User");
const { success, fail } = require("../utils/response");

const BCRYPT_SALT_ROUNDS = 12;

// MNQ=1 là nhóm quản lý cửa hàng (toàn quyền) — không được xóa/khóa tài khoản cuối cùng
const ADMIN_MNQ = 1;

// ─────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────
function normalizeAccountStatus(value) {
  return Number(value) === 0 ? 0 : 1;
}

// ─────────────────────────────────────────────
//  GET /users  — Danh sách tài khoản
// ─────────────────────────────────────────────
async function getUsers(req, res, next) {
  try {
    const rows = await User.listAccounts();

    const users = rows.map((row) => ({
      mnv:      Number(row.MNV),
      username: row.TDN,
      fullName: row.HOTEN,
      mnq:      Number(row.MNQ),
      roleName: row.TENNHOMQUYEN,
      status:   Number(row.TRANGTHAI) === 1 ? 1 : 0,
      startDate: row.NGAYVAOLAM || null,
    }));

    return success(res, users, "Users loaded");
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  GET /users/meta  — Dữ liệu phụ (roles + nhân viên chưa có TK)
// ─────────────────────────────────────────────
async function getUserMeta(req, res, next) {
  try {
    const [roles, employees] = await Promise.all([
      User.listRoleGroups(),
      User.listEmployeesWithoutAccount(),
    ]);

    return success(
      res,
      {
        roles: roles.map((row) => ({
          mnq:  Number(row.MNQ),
          name: row.TEN,
        })),
        availableEmployees: employees.map((row) => ({
          mnv:      Number(row.MNV),
          fullName: row.HOTEN,
        })),
      },
      "User meta loaded",
    );
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  POST /users  — Tạo tài khoản mới
// ─────────────────────────────────────────────
async function createUser(req, res, next) {
  try {
    const mnv      = Number(req.body?.mnv);
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const mnq      = Number(req.body?.mnq);
    const status   = normalizeAccountStatus(req.body?.status);

    // Validate đầu vào
    if (!Number.isInteger(mnv) || mnv <= 0) {
      return fail(res, "mnv is required", 400);
    }
    if (!username) {
      return fail(res, "username is required", 400);
    }
    if (password.length < 6) {
      return fail(res, "password must be at least 6 characters", 400);
    }
    if (!Number.isInteger(mnq) || mnq <= 0) {
      return fail(res, "mnq is required", 400);
    }

    // Kiểm tra username đã tồn tại chưa
    const existedUser = await User.findByUsername(username);
    if (existedUser) {
      return fail(res, "Username already exists", 400);
    }

    // Kiểm tra nhân viên hợp lệ (tồn tại + đang làm + chưa có tài khoản)
    // — dùng query riêng thay vì load toàn bộ danh sách
    const canCreate = await User.canEmployeeCreateAccount(mnv);
    if (!canCreate) {
      return fail(res, "Employee not found or already has account", 400);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await User.createAccount({ mnv, username, passwordHash, mnq, status });

    return success(res, null, "User created", 201);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Username already exists", 400);
    }
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  PUT /users/:id  — Cập nhật tài khoản
// ─────────────────────────────────────────────
async function updateUser(req, res, next) {
  try {
    const mnv         = Number(req.params.id);
    const currentMnv  = Number(req.user?.mnv || 0);
    const mnq         = req.body?.mnq  != null ? Number(req.body.mnq)  : null;
    const status      = req.body?.status != null ? normalizeAccountStatus(req.body.status) : null;
    const newPassword = String(req.body?.newPassword || "").trim();

    if (!Number.isInteger(mnv) || mnv <= 0) {
      return fail(res, "Invalid user id", 400);
    }
    if (mnq != null && (!Number.isInteger(mnq) || mnq <= 0)) {
      return fail(res, "Invalid mnq", 400);
    }
    if (newPassword && newPassword.length < 6) {
      return fail(res, "newPassword must be at least 6 characters", 400);
    }

    // Kiểm tra tài khoản tồn tại — dùng findById thay vì load toàn bộ danh sách
    const current = await User.findById(mnv);
    if (!current) {
      return fail(res, "User not found", 404);
    }

    // Bảo vệ: không được tự khóa tài khoản đang đăng nhập
    if (status === 0 && mnv === currentMnv) {
      return fail(res, "Cannot lock your own account", 400);
    }

    // Bảo vệ: không được khóa hoặc hạ quyền tài khoản admin cuối cùng
    const isAdminAccount = Number(current.MNQ) === ADMIN_MNQ;
    if (isAdminAccount) {
      const isBeingLocked     = status === 0;
      const isBeingDowngraded = mnq != null && mnq !== ADMIN_MNQ;

      if (isBeingLocked || isBeingDowngraded) {
        const activeAdminCount = await User.countActiveAccountsByMnq(ADMIN_MNQ);
        if (activeAdminCount <= 1) {
          return fail(
            res,
            "Cannot lock or change role of the last admin account",
            400,
          );
        }
      }
    }

    const payload = {
      mnq,
      status,
      passwordHash: newPassword
        ? await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)
        : null,
    };

    await User.updateAccountByEmployeeId(mnv, payload);
    return success(res, null, "User updated");
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  DELETE /users/:id  — Xóa tài khoản
// ─────────────────────────────────────────────
async function deleteUser(req, res, next) {
  try {
    const mnv        = Number(req.params.id);
    const currentMnv = Number(req.user?.mnv || 0);

    if (!Number.isInteger(mnv) || mnv <= 0) {
      return fail(res, "Invalid user id", 400);
    }

    // Không thể tự xóa tài khoản đang đăng nhập
    if (mnv === currentMnv) {
      return fail(res, "Cannot delete your own account", 400);
    }

    // Kiểm tra tài khoản tồn tại — dùng findById thay vì load toàn bộ danh sách
    const current = await User.findById(mnv);
    if (!current) {
      return fail(res, "User not found", 404);
    }

    // Bảo vệ: không được xóa tài khoản admin cuối cùng
    if (Number(current.MNQ) === ADMIN_MNQ) {
      const activeAdminCount = await User.countActiveAccountsByMnq(ADMIN_MNQ);
      if (activeAdminCount <= 1) {
        return fail(res, "Cannot delete the last admin account", 400);
      }
    }

    await User.deleteAccountByEmployeeId(mnv);
    return success(res, null, "User deleted");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUserMeta,
  createUser,
  updateUser,
  deleteUser,
};