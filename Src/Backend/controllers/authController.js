const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { success, fail } = require("../utils/response");

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

    const isPasswordValid =
      (await bcrypt.compare(password, user.MK).catch(() => false)) ||
      String(password) === String(user.MK);

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
      },
      "Profile loaded",
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  me,
};
