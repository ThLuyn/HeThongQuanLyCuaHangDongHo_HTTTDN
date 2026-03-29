const express = require("express");
const salesController = require("../controllers/salesController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/export-receipts",
  authorizeRoles("admin", "manager", "staff"),
  salesController.createExportReceipt,
);
router.get(
  "/profit-report",
  authorizeRoles("admin", "manager"),
  salesController.getProfitReport,
);

module.exports = router;
