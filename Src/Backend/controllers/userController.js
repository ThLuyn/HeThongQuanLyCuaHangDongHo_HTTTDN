const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { success, fail } = require("../utils/response");

const BCRYPT_SALT_ROUNDS = 12;

function normalizeAccountStatus(value) {
  const status = Number(value);
  return status === 0 ? 0 : 1;
}

async function getUsers(req, res, next) {
  try {
    const rows = await User.listAccounts();

    const users = rows.map((row) => ({
      mnv: Number(row.MNV),
      username: row.TDN,
      fullName: row.HOTEN,
      mnq: Number(row.MNQ),
      roleName: row.TENNHOMQUYEN,
      status: Number(row.TRANGTHAI) === 1 ? 1 : 0,
      startDate: row.NGAYVAOLAM || null,
    }));

    return success(res, users, "Users loaded");
  } catch (error) {
    return next(error);
  }
}

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
          mnq: Number(row.MNQ),
          name: row.TEN,
        })),
        availableEmployees: employees.map((row) => ({
          mnv: Number(row.MNV),
          fullName: row.HOTEN,
        })),
      },
      "User meta loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const mnv = Number(req.body?.mnv);
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const mnq = Number(req.body?.mnq);
    const status = normalizeAccountStatus(req.body?.status);

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

    const existedUser = await User.findByUsername(username);
    if (existedUser) {
      return fail(res, "Username already exists", 400);
    }

    const availableEmployees = await User.listEmployeesWithoutAccount();
    const canCreate = availableEmployees.some(
      (item) => Number(item.MNV) === mnv,
    );
    if (!canCreate) {
      return fail(res, "Employee not found or already has account", 400);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await User.createAccount({
      mnv,
      username,
      passwordHash,
      mnq,
      status,
    });

    return success(res, null, "User created", 201);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Username already exists", 400);
    }
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const mnv = Number(req.params.id);
    const mnq = req.body?.mnq != null ? Number(req.body.mnq) : null;
    const status =
      req.body?.status != null ? normalizeAccountStatus(req.body.status) : null;
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

    const allUsers = await User.listAccounts();
    const current = allUsers.find((row) => Number(row.MNV) === mnv);
    if (!current) {
      return fail(res, "User not found", 404);
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

async function deleteUser(req, res, next) {
  try {
    const mnv = Number(req.params.id);
    const currentMnv = Number(req.user?.mnv || 0);

    if (!Number.isInteger(mnv) || mnv <= 0) {
      return fail(res, "Invalid user id", 400);
    }

    if (mnv === currentMnv) {
      return fail(res, "Cannot delete current login account", 400);
    }

    const allUsers = await User.listAccounts();
    const current = allUsers.find((row) => Number(row.MNV) === mnv);
    if (!current) {
      return fail(res, "User not found", 404);
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
