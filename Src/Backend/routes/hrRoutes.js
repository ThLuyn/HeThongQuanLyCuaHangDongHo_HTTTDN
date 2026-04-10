const express = require("express");
const hrController = require("../controllers/hrController");
const {
  authenticateToken,
  authorizeRoles,
  authorizeRolesOrPermissions,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/employees",
  authorizeRoles("admin", "manager", "hr"),
  hrController.getEmployees,
);
router.post(
  "/employees",
  authorizeRoles("admin", "manager", "hr"),
  hrController.createEmployee,
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
router.get(
  "/my-leave-requests",
  authorizeRolesOrPermissions(
    ["admin", "manager", "hr", "staff"],
    [{ mcn: "donxinngh", actions: ["view", "create"] }],
  ),
  hrController.getMyLeaveRequests,
);
router.post(
  "/my-leave-requests",
  authorizeRolesOrPermissions(
    ["admin", "manager", "hr", "staff"],
    [{ mcn: "donxinngh", actions: ["create", "view"] }],
  ),
  hrController.uploadLeaveEvidenceMiddleware,
  hrController.createMyLeaveRequest,
);
router.patch(
  "/leave-requests/:id",
  authorizeRoles("admin", "manager", "hr"),
  hrController.approveLeave,
);
router.get(
  "/salary/me",
  authorizeRolesOrPermissions(
    ["admin", "manager", "hr", "staff"],
    [{ mcn: "bangluong", actions: ["view"] }],
  ),
  hrController.calculateMySalary,
);

router.get(
  "/salary",
  authorizeRoles("admin", "hr"),
  hrController.calculateSalary,
);
router.get(
  "/attendance/today",
  authorizeRoles("admin", "manager"),
  hrController.getTodayAttendance,
);
router.post(
  "/attendance/today",
  authorizeRoles("admin", "manager"),
  hrController.saveTodayAttendance,
);
router.get(
  "/attendance/me",
  authorizeRolesOrPermissions(
    ["admin", "manager", "staff"],
    [{ mcn: "chamcong", actions: ["view", "create"] }],
  ),
  hrController.getMyAttendanceStatus,
);
router.post(
  "/attendance/check-in",
  authorizeRolesOrPermissions(
    ["admin", "manager", "staff"],
    [{ mcn: "chamcong", actions: ["create", "update", "view"] }],
  ),
  hrController.checkInAttendance,
);
router.post(
  "/attendance/check-out",
  authorizeRolesOrPermissions(
    ["admin", "manager", "staff"],
    [{ mcn: "chamcong", actions: ["create", "update", "view"] }],
  ),
  hrController.checkOutAttendance,
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

router.get(
  "/holidays",
  authorizeRoles("admin", "hr"),
  hrController.getHolidays,
);

router.post(
  "/holidays",
  authorizeRoles("admin", "hr"),
  hrController.createHoliday,
);

router.put(
  "/holidays/:id",
  authorizeRoles("admin", "hr"),
  hrController.updateHoliday,
);

router.delete(
  "/holidays/:id",
  authorizeRoles("admin", "hr"),
  hrController.deleteHoliday,
);

module.exports = router;
