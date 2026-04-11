const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const inventoryController = require("../controllers/inventoryController");
const permissionController = require("../controllers/permissionController");
const userController = require("../controllers/userController");
const {
  authenticateToken,
  authorizeRoles,
  authorizeRolesOrPermissions,
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
  dashboardController.getOverview,
);

router.get(
  "/dashboard/notifications",
  authenticateToken,
  authorizeRoles("admin", "manager", "hr", "staff"),
  dashboardController.getHeaderNotifications,
);

router.get(
  "/users",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  userController.getUsers,
);

router.get(
  "/permissions/groups",
  authenticateToken,
  authorizeRoles("admin"),
  permissionController.getPermissionGroups,
);

router.get(
  "/permissions/meta",
  authenticateToken,
  authorizeRoles("admin"),
  permissionController.getPermissionMeta,
);

router.get(
  "/permissions/groups/:id",
  authenticateToken,
  authorizeRoles("admin"),
  permissionController.getPermissionGroupDetail,
);

router.post(
  "/permissions/groups",
  authenticateToken,
  authorizeRoles("admin"),
  permissionController.createPermissionGroup,
);

router.put(
  "/permissions/groups/:id",
  authenticateToken,
  authorizeRoles("admin"),
  permissionController.updatePermissionGroup,
);

router.delete(
  "/permissions/groups/:id",
  authenticateToken,
  authorizeRoles("admin"),
  permissionController.deletePermissionGroup,
);

router.get(
  "/users/meta",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  userController.getUserMeta,
);

router.post(
  "/users",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  userController.createUser,
);

router.put(
  "/users/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  userController.updateUser,
);

router.delete(
  "/users/:id",
  authenticateToken,
  authorizeRoles("admin", "manager"),
  userController.deleteUser,
);

router.get(
  "/inventory/products",
  authenticateToken,
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [
      { mcn: "sanpham", actions: ["view"] },
      { mcn: "phieunhap", actions: ["view"] },
    ],
  ),
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
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [{ mcn: "phieunhap", actions: ["view"] }],
  ),
  inventoryController.getImportReceipts,
);

router.get(
  "/inventory/import-receipts/:id",
  authenticateToken,
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [{ mcn: "phieunhap", actions: ["view"] }],
  ),
  inventoryController.getImportReceiptDetail,
);

router.patch(
  "/inventory/import-receipts/:id/decision",
  authenticateToken,
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [{ mcn: "phieunhap", actions: ["update"] }],
  ),
  inventoryController.decideImportReceipt,
);

router.post(
  "/inventory/import-receipts",
  authenticateToken,
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [{ mcn: "phieunhap", actions: ["create"] }],
  ),
  inventoryController.createImportReceipt,
);

router.get(
  "/inventory/suppliers",
  authenticateToken,
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [
      { mcn: "nhacungcap", actions: ["view"] },
      { mcn: "sanpham", actions: ["view"] },
      { mcn: "phieunhap", actions: ["view"] },
    ],
  ),
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
  authorizeRolesOrPermissions(
    ["admin", "manager"],
    [{ mcn: "sanpham", actions: ["view"] }],
  ),
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
