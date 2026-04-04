const express = require("express");
const salesController = require("../controllers/salesController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/customers",
  authorizeRoles("admin", "manager", "staff"),
  salesController.getCustomers,
);
router.get(
  "/export-receipts",
  authorizeRoles("admin", "manager", "staff"),
  salesController.getExportReceipts,
);
router.get(
  "/products",
  authorizeRoles("admin", "manager", "staff"),
  salesController.getSaleProducts,
);

router.post(
  "/export-receipts",
  authorizeRoles("admin", "manager", "staff"),
  salesController.createExportReceipt,
);
router.get(
  "/export-receipts/:id",
  authorizeRoles("admin", "manager", "staff"),
  salesController.getExportReceiptDetail,
);
router.patch(
  "/export-receipts/:id/cancel",
  authorizeRoles("admin", "manager", "staff"),
  salesController.cancelExportReceipt,
);
router.get(
  "/profit-report",
  authorizeRoles("admin", "manager"),
  salesController.getProfitReport,
);

module.exports = router;
