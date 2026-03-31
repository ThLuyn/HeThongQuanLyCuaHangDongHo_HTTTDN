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
  if (!isPasswordValid) {
    return false;
  }

  // Migrate old plaintext passwords to bcrypt hash after successful verification.
  const nextHashedPassword = await bcrypt.hash(
    plainPassword,
    BCRYPT_SALT_ROUNDS,
  );
  await User.updatePasswordById(user.MNV, nextHashedPassword).catch(() => null);
  return true;
}

function normalizeRole(roleName, groupId) {
  const value = String(roleName || "").toLowerCase();
  const mnq = Number(groupId);

  if (mnq === 1) {
    return "admin";
  }

  if (
    value.includes("admin") ||
    value.includes("quản trị") ||
    value.includes("quan tri")
  ) {
    return "admin";
  }

  if (
    value.includes("manager") ||
    value.includes("quản lý") ||
    value.includes("quan ly")
  ) {
    return "manager";
  }

  if (
    value.includes("hr") ||
    value.includes("nhân sự") ||
    value.includes("nhan su")
  ) {
    return "hr";
  }

  return "staff";
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return fail(res, "username and password are required", 400);
    }

    const user = await User.findByUsername(username);
    if (!user || Number(user.TRANGTHAI) !== 1) {
      return fail(res, "Invalid credentials", 401);
    }

    const isPasswordValid = await verifyPasswordAndMigrateIfNeeded(
      user,
      password,
    );

    if (!isPasswordValid) {
      return fail(res, "Invalid credentials", 401);
    }

    const role = normalizeRole(user.TENNHOMQUYEN, user.MNQ);

    const accessToken = jwt.sign(
      {
        mnv: user.MNV,
        username: user.TDN,
        mnq: user.MNQ,
        role,
      },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    return success(
      res,
      {
        accessToken,
        user: {
          mnv: user.MNV,
          username: user.TDN,
          fullName: user.HOTEN,
          hinhAnh: user.HINHANH || null,
          role,
          groupName: user.TENNHOMQUYEN,
        },
      },
      "Login successful",
    );
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const username = String(req.user?.username || "").trim();
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

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
      return fail(
        res,
        "New password must be different from current password",
        400,
      );
    }

    const user = await User.findByUsername(username);
    if (!user || Number(user.TRANGTHAI) !== 1) {
      return fail(res, "User not found or inactive", 404);
    }

    const isCurrentPasswordValid = await verifyPasswordAndMigrateIfNeeded(
      user,
      currentPassword,
    );
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

async function me(req, res, next) {
  try {
    const profile = await User.findById(req.user?.mnv);

    if (!profile) {
      return fail(res, "User not found", 404);
    }

    return success(
      res,
      {
        mnv: profile.MNV,
        username: profile.TDN,
        fullName: profile.HOTEN,
        mnq: profile.MNQ,
        role: normalizeRole(profile.TENNHOMQUYEN, profile.MNQ),
        groupName: profile.TENNHOMQUYEN,
        ngaySinh: profile.NGAYSINH,
        gioiTinh: Number(profile.GIOITINH),
        soDienThoai: profile.SDT,
        email: profile.EMAIL,
        trangThai: Number(profile.TT),
        queQuan: profile.QUEQUAN || null,
        diaChi: profile.DIACHI || null,
        hinhAnh: profile.HINHANH || null,
        chucVu: profile.TENCHUCVU || null,
        ngayVaoLam: profile.NGAYVAOLAM || null,
        cccd: profile.CCCD || null,
        boPhan: profile.BOPHAN || null,
        trangThaiLamViec: Number(profile.TT ?? 1),
        luongCoBan: Number(profile.LUONGCOBAN || 0),
        soTaiKhoanNganHang: profile.SOTAIKHOANNGANHANG || null,
        tenNganHang: profile.TENNGANHANG || null,
        maSoThueCaNhan: profile.CCCD || null,
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

    const fullName = String(req.body.fullName ?? currentProfile.HOTEN).trim();
    const gender = Number(req.body.gioiTinh ?? currentProfile.GIOITINH);
    const birthDate = String(
      req.body.ngaySinh ?? currentProfile.NGAYSINH ?? "",
    ).trim();
    const phone = String(req.body.soDienThoai ?? currentProfile.SDT).trim();
    const email = String(req.body.email ?? currentProfile.EMAIL).trim();
    const status = Number(req.body.trangThai ?? currentProfile.TT);
    const queQuan = String(
      req.body.queQuan ?? currentProfile.QUEQUAN ?? "",
    ).trim();
    const diaChi = String(
      req.body.diaChi ?? currentProfile.DIACHI ?? "",
    ).trim();
    const hinhAnh = String(
      req.body.hinhAnh ?? currentProfile.HINHANH ?? "",
    ).trim();
    const ngayVaoLam = String(
      req.body.ngayVaoLam ?? currentProfile.NGAYVAOLAM ?? "",
    ).trim();
    const cccd = String(req.body.cccd ?? currentProfile.CCCD ?? "").trim();
    const boPhan = String(
      req.body.boPhan ?? currentProfile.BOPHAN ?? "",
    ).trim();
    const trangThaiLamViec = Number(
      req.body.trangThaiLamViec ?? currentProfile.TT ?? 1,
    );
    const soTaiKhoanNganHang = String(
      req.body.soTaiKhoanNganHang ?? currentProfile.SOTAIKHOANNGANHANG ?? "",
    ).trim();
    const tenNganHang = String(
      req.body.tenNganHang ?? currentProfile.TENNGANHANG ?? "",
    ).trim();

    if (!fullName) {
      return fail(res, "fullName is required", 400);
    }

    if (![0, 1].includes(gender)) {
      return fail(res, "gioiTinh must be 0 or 1", 400);
    }

    if (!birthDate) {
      return fail(res, "ngaySinh is required", 400);
    }

    if (!phone) {
      return fail(res, "soDienThoai is required", 400);
    }

    if (!email || !email.includes("@")) {
      return fail(res, "A valid email is required", 400);
    }

    if (![0, 1].includes(status)) {
      return fail(res, "trangThai must be 0 or 1", 400);
    }

    if (![0, 1, 2].includes(trangThaiLamViec)) {
      return fail(res, "trangThaiLamViec must be 0, 1 or 2", 400);
    }

    await User.updateProfileById(currentMnv, {
      fullName,
      gioiTinh: gender,
      ngaySinh: birthDate,
      soDienThoai: phone,
      email,
      trangThai: status,
      queQuan,
      diaChi,
      hinhAnh,
      ngayVaoLam,
      cccd,
      boPhan,
      trangThaiLamViec,
      soTaiKhoanNganHang,
      tenNganHang,
    });

    return success(res, null, "Profile updated");
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Email already exists", 400);
    }

    return next(error);
  }
}

module.exports = {
  login,
  me,
  updateMe,
  changePassword,
};
