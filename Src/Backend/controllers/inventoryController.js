const { withTransaction } = require("../config/db");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
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

async function createProduct(req, res, next) {
  try {
    const { name, mncc, importPrice, sellPrice } = req.body;
    if (!name || !mncc) {
      return fail(res, "name and mncc are required", 400);
    }

    if (Number(importPrice) < 0 || Number(sellPrice) < 0) {
      return fail(res, "prices must be non-negative", 400);
    }

    const productId = await Product.createProduct(req.body);
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

    const supplierId = await Supplier.createSupplier(req.body);
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

    await Supplier.updateSupplier(req.params.id, req.body);
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
  createProduct,
  updateProduct,
  deleteProduct,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getInventoryReport,
};
