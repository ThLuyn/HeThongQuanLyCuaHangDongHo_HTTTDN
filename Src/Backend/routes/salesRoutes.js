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
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.getCustomers,
);
router.get(
  "/export-receipts",
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.getExportReceipts,
);
router.get(
  "/products",
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.getSaleProducts,
);

router.post(
  "/export-receipts",
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.createExportReceipt,
);
router.get(
  "/export-receipts/:id",
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.getExportReceiptDetail,
);
router.patch(
  "/export-receipts/:id/cancel",
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.cancelExportReceipt,
);
router.get(
  "/profit-report",
  authorizeRoles("admin", "manager"),
  salesController.getProfitReport,
);
router.get(
  "/reports",
  authorizeRoles("admin", "manager", "staff", "sales"),
  salesController.getSalesReport,
);

module.exports = router;