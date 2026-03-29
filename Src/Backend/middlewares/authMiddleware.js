const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
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

module.exports = {
  authenticateToken,
  authorizeRoles,
};
