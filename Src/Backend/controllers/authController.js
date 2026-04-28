const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { success, fail } = require("../utils/response");

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;
const BCRYPT_SALT_ROUNDS = 12;

async function verifyPasswordAndMigrateIfNeeded(user, plainPassword) {
  const storedPassword = String(user?.MK || "");
  const isStoredAsHash = BCRYPT_HASH_PATTERN.test(storedPassword);

  if (isStoredAsHash) {
    return bcrypt.compare(plainPassword, storedPassword).catch(() => false);
  }

  const isPasswordValid = String(plainPassword) === storedPassword;
  if (!isPasswordValid) return false;

  // Migrate mật khẩu plaintext cũ sang bcrypt
  const nextHashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
  await User.updatePasswordById(user.MNV, nextHashedPassword).catch(() => null);
  return true;
}

/**
 * Chỉ dùng MNQ để xác định role — KHÔNG suy từ tên nhóm hay BOPHAN.
 * Điều này đảm bảo nhóm quyền ABC (dù nhân viên thuộc bộ phận nào)
 * đều được xử lý bằng permissions[] thực tế từ CTQUYEN.
 *
 * MNQ = 1  → "admin"  (toàn quyền, không cần check permissions[])
 * MNQ khác → "staff"  (luôn dùng hasPermission() ở frontend)
 */
function normalizeRole(mnq) {
  return Number(mnq) === 1 ? "admin" : "staff";
}

async function getUserPermissionsByGroup(mnq) {
  const rows = await User.listPermissionsByGroup(mnq);
  return rows.map((row) => ({
    mcn:      String(row.MCN      || "").toLowerCase(),
    hanhDong: String(row.HANHDONG || "").toLowerCase(),
  }));
}

// ─────────────────────────────────────────────
//  POST /auth/login
// ─────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return fail(res, "username and password are required", 400);
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return fail(res, "ACCOUNT_NOT_FOUND", 401);
    }
    if (Number(user.TRANGTHAI) !== 1) {
      return fail(res, "ACCOUNT_LOCKED", 401);
    }

    const isPasswordValid = await verifyPasswordAndMigrateIfNeeded(user, password);
    if (!isPasswordValid) {
      return fail(res, "INVALID_PASSWORD", 401);
    }

    // role chỉ phụ thuộc MNQ — không phụ thuộc tên nhóm hay bộ phận
    const role        = normalizeRole(user.MNQ);
    const permissions = await getUserPermissionsByGroup(user.MNQ);

    const accessToken = jwt.sign(
      { mnv: user.MNV, username: user.TDN, mnq: user.MNQ, role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    // Tạo refreshToken (dài hạn hơn, lưu trong httpOnly cookie)
    const refreshToken = jwt.sign(
      { mnv: user.MNV, username: user.TDN, mnq: user.MNQ },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-refresh-secret",
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
    );

    // Set httpOnly cookie — JS không đọc được, tránh XSS
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return success(
      res,
      {
        accessToken,
        user: {
          mnv:        user.MNV,
          username:   user.TDN,
          fullName:   user.HOTEN,
          hinhAnh:    user.HINHANH || null,
          role,                          // "admin" | "staff"
          mnq:        user.MNQ,
          groupName:  user.TENNHOMQUYEN,
          department: user.BOPHAN,
          permissions,                   // ← quyền thực tế từ CTQUYEN
        },
      },
      "Login successful",
    );
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  POST /auth/change-password
// ─────────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const username        = String(req.user?.username || "").trim();
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword     = String(req.body?.newPassword || "");

    if (!username) {
      return fail(res, "Invalid user", 401);
    }
    if (!currentPassword || !newPassword) {
      return fail(res, "currentPassword and newPassword are required", 400);
    }
    if (newPassword.length < 6) {
      return fail(res, "New password must be at least 6 characters", 400);
    }
    if (currentPassword === newPassword) {
      return fail(res, "New password must be different from current password", 400);
    }

    const user = await User.findByUsername(username);
    if (!user || Number(user.TRANGTHAI) !== 1) {
      return fail(res, "User not found or inactive", 404);
    }

    const isCurrentPasswordValid = await verifyPasswordAndMigrateIfNeeded(user, currentPassword);
    if (!isCurrentPasswordValid) {
      return fail(res, "Current password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await User.updatePasswordById(user.MNV, hashedPassword);

    return success(res, null, "Password updated successfully");
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  GET /auth/me
// ─────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const profile = await User.findById(req.user?.mnv);

    if (!profile) {
      if (process.env.NODE_ENV !== "production") {
        // Dev fallback
        const mock = {
          MNV: Number(req.user?.mnv || 1),
          TDN: String(req.user?.username || "dev"),
          HOTEN: "Dev User",
          MNQ: Number(req.user?.mnq || 1),
          TENNHOMQUYEN: "Admin",
          BOPHAN: "Development",
          HINHANH: null,
          GIOITINH: 1,
          NGAYSINH: null,
          SDT: null,
          EMAIL: null,
          TT: 1,
          CCCD: null,
          NGAYVAOLAM: null,
          TENCHUCVU: null,
          LUONGCOBAN: 0,
        };

        const permissions = await getUserPermissionsByGroup(mock.MNQ).catch(() => []);

        return success(
          res,
          {
            mnv:        mock.MNV,
            username:   mock.TDN,
            fullName:   mock.HOTEN,
            mnq:        mock.MNQ,
            role:       normalizeRole(mock.MNQ),
            groupName:  mock.TENNHOMQUYEN,
            department: mock.BOPHAN,
            permissions,
            ngaySinh:   mock.NGAYSINH,
            gioiTinh:   Number(mock.GIOITINH),
            soDienThoai: mock.SDT,
            email:      mock.EMAIL,
            trangThai:  Number(mock.TT),
            queQuan:    null,
            diaChi:     null,
            hinhAnh:    mock.HINHANH,
            chucVu:     mock.TENCHUCVU,
            ngayVaoLam: mock.NGAYVAOLAM,
            cccd:       mock.CCCD,
            boPhan:     mock.BOPHAN,
            trangThaiLamViec: Number(mock.TT ?? 1),
            luongCoBan: Number(mock.LUONGCOBAN || 0),
            soTaiKhoanNganHang: null,
            tenNganHang: null,
            maSoThueCaNhan: null,
            khauTruBaoHiem: {
              bhxhRate: 0.08, bhytRate: 0.015, bhtnRate: 0.01,
              bhxhAmount: 0,  bhytAmount: 0,   bhtnAmount: 0,
            },
          },
          "Profile loaded (dev fallback)",
        );
      }
      return fail(res, "User not found", 404);
    }

    const permissions = await getUserPermissionsByGroup(profile.MNQ);

    return success(
      res,
      {
        mnv:        profile.MNV,
        username:   profile.TDN,
        fullName:   profile.HOTEN,
        mnq:        profile.MNQ,
        role:       normalizeRole(profile.MNQ),
        groupName:  profile.TENNHOMQUYEN,
        department: profile.BOPHAN,
        permissions,
        ngaySinh:   profile.NGAYSINH,
        gioiTinh:   Number(profile.GIOITINH),
        soDienThoai: profile.SDT,
        email:      profile.EMAIL,
        trangThai:  Number(profile.TT),
        queQuan:    profile.QUEQUAN     || null,
        diaChi:     profile.DIACHI      || null,
        hinhAnh:    profile.HINHANH     || null,
        chucVu:     profile.TENCHUCVU   || null,
        ngayVaoLam: profile.NGAYVAOLAM  || null,
        cccd:       profile.CCCD        || null,
        boPhan:     profile.BOPHAN      || null,
        trangThaiLamViec: Number(profile.TT ?? 1),
        luongCoBan: Number(profile.LUONGCOBAN || 0),
        soTaiKhoanNganHang: profile.SOTAIKHOANNGANHANG || null,
        tenNganHang:        profile.TENNGANHANG        || null,
        maSoThueCaNhan:     profile.CCCD               || null,
        khauTruBaoHiem: {
          bhxhRate: 0.08,
          bhytRate: 0.015,
          bhtnRate: 0.01,
          bhxhAmount: Number(profile.LUONGCOBAN || 0) * 0.08,
          bhytAmount: Number(profile.LUONGCOBAN || 0) * 0.015,
          bhtnAmount: Number(profile.LUONGCOBAN || 0) * 0.01,
        },
      },
      "Profile loaded",
    );
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  PUT /auth/me
// ─────────────────────────────────────────────
async function updateMe(req, res, next) {
  try {
    const currentMnv = Number(req.user?.mnv || 0);
    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const currentProfile = await User.findById(currentMnv);
    if (!currentProfile) {
      return fail(res, "User not found", 404);
    }

    const fullName   = String(req.body.fullName   ?? currentProfile.HOTEN).trim();
    const gender     = Number(req.body.gioiTinh   ?? currentProfile.GIOITINH);
    const birthDate  = String(req.body.ngaySinh   ?? currentProfile.NGAYSINH ?? "").trim();
    const phone      = String(req.body.soDienThoai ?? currentProfile.SDT).trim();
    const email      = String(req.body.email       ?? currentProfile.EMAIL).trim();
    const status     = Number(req.body.trangThai   ?? currentProfile.TT);
    const queQuan    = String(req.body.queQuan     ?? currentProfile.QUEQUAN ?? "").trim();
    const diaChi     = String(req.body.diaChi      ?? currentProfile.DIACHI  ?? "").trim();
    const hinhAnh    = String(req.body.hinhAnh     ?? currentProfile.HINHANH ?? "").trim();
    const ngayVaoLam = String(req.body.ngayVaoLam  ?? currentProfile.NGAYVAOLAM ?? "").trim();
    const cccd       = String(req.body.cccd        ?? currentProfile.CCCD ?? "").trim();
    const boPhan     = String(req.body.boPhan      ?? currentProfile.BOPHAN ?? "").trim();
    const trangThaiLamViec      = Number(req.body.trangThaiLamViec      ?? currentProfile.TT ?? 1);
    const soTaiKhoanNganHang    = String(req.body.soTaiKhoanNganHang    ?? currentProfile.SOTAIKHOANNGANHANG ?? "").trim();
    const tenNganHang           = String(req.body.tenNganHang           ?? currentProfile.TENNGANHANG ?? "").trim();

    if (!fullName)                  return fail(res, "fullName is required", 400);
    if (![0, 1].includes(gender))   return fail(res, "gioiTinh must be 0 or 1", 400);
    if (!birthDate)                 return fail(res, "ngaySinh is required", 400);
    if (!phone)                     return fail(res, "soDienThoai is required", 400);
    if (!email || !email.includes("@")) return fail(res, "A valid email is required", 400);
    if (![0, 1].includes(status))   return fail(res, "trangThai must be 0 or 1", 400);
    if (![0, 1, 2].includes(trangThaiLamViec)) return fail(res, "trangThaiLamViec must be 0, 1 or 2", 400);

    await User.updateProfileById(currentMnv, {
      fullName, gioiTinh: gender, ngaySinh: birthDate,
      soDienThoai: phone, email, trangThai: status,
      queQuan, diaChi, hinhAnh, ngayVaoLam, cccd, boPhan,
      trangThaiLamViec, soTaiKhoanNganHang, tenNganHang,
    });

    return success(res, null, "Profile updated");
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Email already exists", 400);
    }
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  POST /auth/refresh
// ─────────────────────────────────────────────
/**
 * Dùng refreshToken trong httpOnly cookie để cấp accessToken mới.
 * Nếu refreshToken hợp lệ → trả accessToken mới + xoay refreshToken mới (rotation).
 * Nếu không hợp lệ / hết hạn → 401.
 */
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return fail(res, "No refresh token", 401);
    }

    let payload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-refresh-secret",
      );
    } catch {
      res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
      return fail(res, "Invalid or expired refresh token", 401);
    }

    // Kiểm tra user còn active không
    const user = await User.findById(payload.mnv);
    if (!user || Number(user.TRANGTHAI) !== 1) {
      res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
      return fail(res, "User not found or inactive", 401);
    }

    const role = normalizeRole(user.MNQ);

    // Cấp accessToken mới
    const newAccessToken = jwt.sign(
      { mnv: user.MNV, username: user.TDN, mnq: user.MNQ, role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    // Xoay refreshToken mới (refresh token rotation — bảo mật hơn)
    const newRefreshToken = jwt.sign(
      { mnv: user.MNV, username: user.TDN, mnq: user.MNQ },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev-refresh-secret",
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return success(res, { accessToken: newAccessToken }, "Token refreshed");
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────
//  POST /auth/logout
// ─────────────────────────────────────────────
/**
 * Xoá httpOnly cookie refreshToken phía server.
 * Frontend tự xoá accessToken khỏi memory.
 */
async function logout(req, res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return success(res, null, "Logged out successfully");
}

module.exports = { login, me, updateMe, changePassword, refresh, logout };
