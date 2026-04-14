const jwt = require("jsonwebtoken");
const User = require("../models/User");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    // Development convenience: when not in production, allow a default
    // dev user so the frontend can load pages without a real token.
    // This is intentionally permissive and MUST NOT be used in production.
    if (process.env.NODE_ENV !== "production") {
      console.warn("Dev mode: no access token provided, using dev user");
      req.user = { mnv: 1, username: "dev", mnq: 1, role: "admin" };
      return next();
    }

    return res
      .status(401)
      .json({ success: false, message: "Missing access token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = decoded;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

function authorizeRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((role) =>
    String(role).toLowerCase(),
  );

  return (req, res, next) => {
    const currentRole = String(req.user?.role || "").toLowerCase();

    if (!normalizedAllowed.includes(currentRole)) {
      return res
        .status(403)
        .json({ success: false, message: "You do not have permission" });
    }

    return next();
  };
}

function normalizePermissionRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    mcn: String(row?.MCN || "").toLowerCase(),
    hanhDong: String(row?.HANHDONG || "").toLowerCase(),
  }));
}

function hasAnyPermission(grants, requiredPermissions) {
  const required = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [];
  if (required.length === 0) {
    return true;
  }

  return required.some((item) => {
    const mcn = String(item?.mcn || "").toLowerCase();
    const actions = Array.isArray(item?.actions) ? item.actions : [];

    if (!mcn || actions.length === 0) {
      return false;
    }

    const normalizedActions = actions.map((action) =>
      String(action || "").toLowerCase(),
    );

    return normalizedActions.some((action) =>
      grants.some((grant) => grant.mcn === mcn && grant.hanhDong === action),
    );
  });
}

function authorizeRolesOrPermissions(
  allowedRoles = [],
  requiredPermissions = [],
) {
  const normalizedAllowedRoles = (
    Array.isArray(allowedRoles) ? allowedRoles : []
  ).map((role) => String(role || "").toLowerCase());

  return async (req, res, next) => {
    try {
      const currentRole = String(req.user?.role || "").toLowerCase();

      if (normalizedAllowedRoles.includes(currentRole)) {
        return next();
      }

      const groupId = Number(req.user?.mnq || 0);
      if (!groupId) {
        return res
          .status(403)
          .json({ success: false, message: "You do not have permission" });
      }

      const permissionRows = await User.listPermissionsByGroup(groupId);
      const grants = normalizePermissionRows(permissionRows);

      if (!hasAnyPermission(grants, requiredPermissions)) {
        return res
          .status(403)
          .json({ success: false, message: "You do not have permission" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeRolesOrPermissions,
};
