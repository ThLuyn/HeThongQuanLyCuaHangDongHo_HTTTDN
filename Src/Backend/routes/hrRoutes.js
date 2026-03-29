const express = require("express");
const hrController = require("../controllers/hrController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/employees",
  authorizeRoles("admin", "manager", "hr"),
  hrController.getEmployees,
);
router.get(
  "/leave-requests",
  authorizeRoles("admin", "manager", "hr"),
  hrController.getLeaveRequests,
);
router.patch(
  "/leave-requests/:id",
  authorizeRoles("admin", "manager", "hr"),
  hrController.approveLeave,
);
router.get(
  "/salary",
  authorizeRoles("admin", "manager", "hr"),
  hrController.calculateSalary,
);

module.exports = router;
