const { withTransaction } = require("../config/db");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const DisplayLocation = require("../models/DisplayLocation");
const Order = require("../models/Order");
const { success, fail } = require("../utils/response");

async function getProducts(req, res, next) {
  try {
    const products = await Product.listAll();
    return success(res, products, "Product list loaded");
  } catch (error) {
    return next(error);
  }
}

async function createImportReceipt(req, res, next) {
  try {
    const { mnv, mncc, items } = req.body;
    const receiptOwner = Number(mnv || req.user?.mnv || 0);
    const supplierId = Number(mncc);

    if (
      !receiptOwner ||
      !supplierId ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return fail(res, "mnv, mncc and items are required", 400);
    }

    if (!Number.isInteger(receiptOwner) || !Number.isInteger(supplierId)) {
      return fail(res, "mnv and mncc must be valid integers", 400);
    }

    const normalizedItems = items.map((item) => ({
      msp: Number(item.msp),
      sl: Number(item.sl),
      tienNhap: Number(item.tienNhap),
      hinhThuc: Number(item.hinhThuc || 0),
    }));

    const hasInvalidItem = normalizedItems.some(
      (item) =>
        !Number.isInteger(item.msp) ||
        item.msp <= 0 ||
        !Number.isInteger(item.sl) ||
        item.sl <= 0 ||
        !Number.isFinite(item.tienNhap) ||
        item.tienNhap <= 0 ||
        !Number.isInteger(item.hinhThuc),
    );

    if (hasInvalidItem) {
      return fail(
        res,
        "Each item must include valid msp, sl and tienNhap",
        400,
      );
    }

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.sl * item.tienNhap,
      0,
    );

    if (!Number.isFinite(total) || total <= 0) {
      return fail(res, "Invalid total amount", 400);
    }

    const importReceiptId = await withTransaction((connection) =>
      Order.createImportReceipt(connection, {
        mnv: receiptOwner,
        mncc: supplierId,
        total,
        items: normalizedItems,
      }),
    );

    return success(
      res,
      {
        importReceiptId,
        total,
      },
      "Import receipt created",
      201,
    );
  } catch (error) {
    return next(error);
  }
}

async function getImportReceipts(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 20;
    const receipts = await Order.listImportReceipts(limit);
    return success(res, receipts, "Import receipts loaded");
  } catch (error) {
    return next(error);
  }
}

async function getImportReceiptDetail(req, res, next) {
  try {
    const receiptId = Number(req.params.id);
    if (!Number.isInteger(receiptId) || receiptId <= 0) {
      return fail(res, "Import receipt id is invalid", 400);
    }

    const detail = await Order.getImportReceiptDetail(receiptId);
    if (!detail) {
      return fail(res, "Import receipt not found", 404);
    }

    return success(res, detail, "Import receipt detail loaded");
  } catch (error) {
    return next(error);
  }
}

async function decideImportReceipt(req, res, next) {
  try {
    const receiptId = Number(req.params.id);
    const action = String(req.body?.action || "")
      .trim()
      .toLowerCase();
    const reason = String(req.body?.reason || "").trim();

    if (!Number.isInteger(receiptId) || receiptId <= 0) {
      return fail(res, "Import receipt id is invalid", 400);
    }

    if (!["approve", "reject"].includes(action)) {
      return fail(res, "action must be approve or reject", 400);
    }

    await withTransaction((connection) =>
      Order.decideImportReceipt(connection, receiptId, action, reason),
    );

    return success(res, null, "Import receipt status updated");
  } catch (error) {
    if (error?.statusCode === 404) {
      return fail(res, error.message, 404);
    }
    if (error?.statusCode === 400) {
      return fail(res, error.message, 400);
    }
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, mncc, importPrice, sellPrice } = req.body;
    const initialStock = Number(req.body.stock || 0);
    const normalizedImportPrice = Number(importPrice || 0);
    const creatorId = Number(req.user?.mnv || req.body?.mnv || 0);

    if (!name || !mncc) {
      return fail(res, "name and mncc are required", 400);
    }

    if (
      normalizedImportPrice < 0 ||
      Number(sellPrice) < 0 ||
      initialStock < 0
    ) {
      return fail(res, "prices must be non-negative", 400);
    }

    if (initialStock > 0 && normalizedImportPrice <= 0) {
      return fail(
        res,
        "importPrice must be greater than 0 when stock is greater than 0",
        400,
      );
    }

    if (initialStock > 0 && (!Number.isInteger(creatorId) || creatorId <= 0)) {
      return fail(res, "creator mnv is required for initial stock import", 400);
    }

    const productId = await withTransaction(async (connection) => {
      const createdProductId = await Product.createProduct(
        {
          ...req.body,
          importPrice: initialStock > 0 ? 0 : normalizedImportPrice,
          stock: initialStock > 0 ? 0 : initialStock,
        },
        connection,
      );

      if (initialStock > 0) {
        await Order.createImportReceipt(connection, {
          mnv: creatorId,
          mncc: Number(mncc),
          total: initialStock * normalizedImportPrice,
          items: [
            {
              msp: createdProductId,
              sl: initialStock,
              tienNhap: normalizedImportPrice,
              hinhThuc: 0,
            },
          ],
        });
      }

      return createdProductId;
    });

    return success(res, { productId }, "Product created", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, mncc } = req.body;
    if (!name || !mncc) {
      return fail(res, "name and mncc are required", 400);
    }

    await Product.updateProduct(id, req.body);
    return success(res, null, "Product updated");
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    await Product.softDeleteProduct(id);
    return success(res, null, "Product removed");
  } catch (error) {
    return next(error);
  }
}

async function getSuppliers(req, res, next) {
  try {
    const suppliers = await Supplier.listAll();
    return success(res, suppliers, "Suppliers loaded");
  } catch (error) {
    return next(error);
  }
}

async function createSupplier(req, res, next) {
  try {
    if (!req.body.name) {
      return fail(res, "name is required", 400);
    }

    const payload = {
      ...req.body,
      brands: Array.isArray(req.body.brands) ? req.body.brands : [],
    };

    const supplierId = await withTransaction((connection) =>
      Supplier.createSupplier(payload, connection),
    );
    return success(res, { supplierId }, "Supplier created", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateSupplier(req, res, next) {
  try {
    if (!req.body.name) {
      return fail(res, "name is required", 400);
    }

    const payload = {
      ...req.body,
      brands: Array.isArray(req.body.brands) ? req.body.brands : [],
    };

    await withTransaction((connection) =>
      Supplier.updateSupplier(req.params.id, payload, connection),
    );
    return success(res, null, "Supplier updated");
  } catch (error) {
    return next(error);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    await Supplier.softDeleteSupplier(req.params.id);
    return success(res, null, "Supplier removed");
  } catch (error) {
    return next(error);
  }
}

async function getDisplayLocations(req, res, next) {
  try {
    const locations = await DisplayLocation.listAll();
    return success(res, locations, "Display locations loaded");
  } catch (error) {
    return next(error);
  }
}

async function createDisplayLocation(req, res, next) {
  try {
    if (!req.body.name) {
      return fail(res, "name is required", 400);
    }

    const locationId = await DisplayLocation.createDisplayLocation(req.body);
    return success(res, { locationId }, "Display location created", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateDisplayLocation(req, res, next) {
  try {
    if (!req.body.name) {
      return fail(res, "name is required", 400);
    }

    await DisplayLocation.updateDisplayLocation(req.params.id, req.body);
    return success(res, null, "Display location updated");
  } catch (error) {
    return next(error);
  }
}

async function deleteDisplayLocation(req, res, next) {
  try {
    const locationId = Number(req.params.id);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      return fail(res, "Mã vị trí trưng bày không hợp lệ", 400);
    }

    const activeProductCount =
      await DisplayLocation.countActiveProductsByLocation(locationId);

    if (activeProductCount > 0) {
      return fail(
        res,
        "Không thể xóa vị trí trưng bày vì vẫn còn sản phẩm đang hoạt động tại vị trí này",
        409,
      );
    }

    await withTransaction(async (connection) => {
      await DisplayLocation.clearInactiveProductsLocation(
        connection,
        locationId,
      );
      await DisplayLocation.deleteDisplayLocationWithConnection(
        connection,
        locationId,
      );
    });

    return success(res, null, "Xóa vị trí trưng bày thành công");
  } catch (error) {
    return next(error);
  }
}

async function getInventoryReport(req, res, next) {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : null;

    const report = await Product.getInventoryReport(month, year);
    return success(res, report, "Inventory report loaded");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProducts,
  createImportReceipt,
  getImportReceipts,
  getImportReceiptDetail,
  decideImportReceipt,
  createProduct,
  updateProduct,
  deleteProduct,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getDisplayLocations,
  createDisplayLocation,
  updateDisplayLocation,
  deleteDisplayLocation,
  getInventoryReport,
};
