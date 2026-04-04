const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const inventoryController = require("../controllers/inventoryController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", authenticateToken, authController.me);
router.patch("/auth/me", authenticateToken, authController.updateMe);
router.patch(
  "/auth/change-password",
  authenticateToken,
  authController.changePassword,
);

router.get(
  "/dashboard/overview",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  dashboardController.getOverview,
);

router.get(
  "/dashboard/notifications",
  authenticateToken,
  authorizeRoles("admin", "manager", "hr"),
  dashboardController.getHeaderNotifications,
);

router.get(
  "/inventory/products",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getProducts,
);

router.post(
  "/inventory/products",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.createProduct,
);

router.post(
  "/inventory/products/upload-image",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.uploadProductImageMiddleware,
  inventoryController.uploadProductImage,
);

router.put(
  "/inventory/products/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.updateProduct,
);

router.delete(
  "/inventory/products/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.deleteProduct,
);

router.get(
  "/inventory/import-receipts",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getImportReceipts,
);

router.get(
  "/inventory/import-receipts/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getImportReceiptDetail,
);

router.patch(
  "/inventory/import-receipts/:id/decision",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.decideImportReceipt,
);

router.post(
  "/inventory/import-receipts",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.createImportReceipt,
);

router.get(
  "/inventory/suppliers",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getSuppliers,
);

router.post(
  "/inventory/suppliers",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.createSupplier,
);

router.put(
  "/inventory/suppliers/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.updateSupplier,
);

router.delete(
  "/inventory/suppliers/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.deleteSupplier,
);

router.get(
  "/inventory/display-locations",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getDisplayLocations,
);

router.post(
  "/inventory/display-locations",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.createDisplayLocation,
);

router.put(
  "/inventory/display-locations/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.updateDisplayLocation,
);

router.delete(
  "/inventory/display-locations/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.deleteDisplayLocation,
);

router.get(
  "/inventory/report",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getInventoryReport,
);

module.exports = router;
