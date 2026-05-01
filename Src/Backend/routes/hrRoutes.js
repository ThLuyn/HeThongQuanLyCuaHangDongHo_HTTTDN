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
  authorizeRolesOrPermissions([], []),
  hrController.getEmployees,
);
router.post(
  "/employees",
  authorizeRolesOrPermissions([], []),
  hrController.createEmployee,
);
router.get(
  "/employees/:id",
  authorizeRolesOrPermissions([], []),
  hrController.getEmployeeDetail,
);

router.put(
  "/employees/:id",
  authorizeRolesOrPermissions([], []),
  hrController.updateEmployee,
);

router.get(
  "/leave-requests",
  authorizeRolesOrPermissions([], []),
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
  authorizeRolesOrPermissions([], []),
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
  "/violations",
  authorizeRolesOrPermissions(
    ["admin", "manager", "hr", "staff"],
    [{ mcn: "vipham", actions: ["view"] }],
  ),
  hrController.getViolationPenalties,
);

router.get(
  "/salary",
  authorizeRolesOrPermissions([], [{ mcn: "bangluong", actions: ["view"] }]),
  hrController.calculateSalary,
);
router.get(
  "/salary/latest-period",
  authorizeRolesOrPermissions([], [{ mcn: "bangluong", actions: ["view"] }]),
  hrController.getLatestPayrollPeriod,
);
router.get(
  "/attendance/today",
  authorizeRolesOrPermissions([], []),
  hrController.getTodayAttendance,
);
router.post(
  "/attendance/today",
  authorizeRolesOrPermissions([], []),
  hrController.saveTodayAttendance,
);
router.get(
  "/attendance/shifts",
  authorizeRolesOrPermissions([], []),
  hrController.getShiftAssignments,
);
router.post(
  "/attendance/shifts",
  authorizeRolesOrPermissions([], []),
  hrController.saveShiftAssignments,
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
  authorizeRolesOrPermissions([], []),
  hrController.resignEmployee,
);

router.get(
  "/positions",
  authorizeRolesOrPermissions([], []),
  hrController.getPositions,
);

router.get(
  "/positions/history",
  authorizeRolesOrPermissions([], []),
  hrController.getPositionWorkHistory,
);

router.post(
  "/positions",
  authorizeRolesOrPermissions([], []),
  hrController.createPosition,
);

router.put(
  "/positions/:id",
  authorizeRolesOrPermissions([], []),
  hrController.updatePosition,
);

router.post(
  "/salary/:mbl/finalize",
  authorizeRolesOrPermissions([], [{ mcn: "bangluong", actions: ["update"] }]),
  hrController.finalizeSalary,
);

router.put(
  "/salary/:mbl",
  authorizeRolesOrPermissions([], [{ mcn: "bangluong", actions: ["update"] }]),
  hrController.updateSalary,
);

router.post(
  "/positions/transfer",
  authorizeRolesOrPermissions([], []),
  hrController.transferEmployeePosition,
);

router.get(
  "/holidays",
  authorizeRolesOrPermissions([], []),
  hrController.getHolidays,
);

router.post(
  "/holidays",
  authorizeRolesOrPermissions([], []),
  hrController.createHoliday,
);

router.put(
  "/holidays/:id",
  authorizeRolesOrPermissions([], []),
  hrController.updateHoliday,
);

router.delete(
  "/holidays/:id",
  authorizeRolesOrPermissions([], []),
  hrController.deleteHoliday,
);

module.exports = router;
