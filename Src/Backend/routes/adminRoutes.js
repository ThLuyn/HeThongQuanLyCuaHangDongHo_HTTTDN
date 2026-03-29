const express = require("express");
const authController = require("../controllers/authController");
const inventoryController = require("../controllers/inventoryController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/auth/login", authController.login);
router.get("/auth/me", authenticateToken, authController.me);

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
  "/inventory/report",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  inventoryController.getInventoryReport,
);

module.exports = router;
