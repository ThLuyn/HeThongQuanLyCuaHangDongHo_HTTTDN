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
  "/employees/:id",
  authorizeRoles("admin", "manager", "hr"),
  hrController.getEmployeeDetail,
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
router.patch(
  "/employees/:id/resign",
  authorizeRoles("admin", "manager", "hr"),
  hrController.resignEmployee,
);

router.get(
  "/positions",
  authorizeRoles("admin", "manager", "hr"),
  hrController.getPositions,
);

router.get(
  "/positions/history",
  authorizeRoles("admin", "manager", "hr"),
  hrController.getPositionWorkHistory,
);

router.post(
  "/positions",
  authorizeRoles("admin", "manager", "hr"),
  hrController.createPosition,
);

router.put(
  "/positions/:id",
  authorizeRoles("admin", "manager", "hr"),
  hrController.updatePosition,
);

router.post(
  "/positions/transfer",
  authorizeRoles("admin", "manager", "hr"),
  hrController.transferEmployeePosition,
);

module.exports = router;
