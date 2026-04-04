const { withTransaction } = require("../config/db");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { formatCurrencyVND } = require("../utils/formatters");
const { success, fail } = require("../utils/response");

function getMonthDateRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const toIso = (date) => date.toISOString().slice(0, 10);
  return { startDate: toIso(startDate), endDate: toIso(endDate) };
}

async function createExportReceipt(req, res, next) {
  try {
    const { mnv, mkh, items } = req.body;

    if (!mkh || !Array.isArray(items) || items.length === 0) {
      return fail(res, "mkh and items are required", 400);
    }

    const normalizedItems = items.map((item) => ({
      msp: Number(item.msp),
      sl: Number(item.sl),
      tienXuat: Number(item.tienXuat),
      mkm: item.mkm || null,
    }));

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.sl * item.tienXuat,
      0,
    );

    const exportReceiptId = await withTransaction((connection) =>
      Order.createExportReceipt(connection, {
        mnv: Number(mnv || req.user?.mnv || 0),
        mkh: Number(mkh),
        total,
        items: normalizedItems,
      }),
    );

    return success(
      res,
      {
        exportReceiptId,
        total,
      },
      "Export receipt created",
      201,
    );
  } catch (error) {
    return next(error);
  }
}

async function getExportReceipts(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 50;
    const receipts = await Order.listExportReceipts(limit);
    return success(res, receipts, "Export receipts loaded");
  } catch (error) {
    return next(error);
  }
}

async function getExportReceiptDetail(req, res, next) {
  try {
    const receiptId = Number(req.params.id);
    const detail = await Order.getExportReceiptDetail(receiptId);
    if (!detail) {
      return fail(res, "Export receipt not found", 404);
    }
    return success(res, detail, "Export receipt detail loaded");
  } catch (error) {
    return next(error);
  }
}

async function cancelExportReceipt(req, res, next) {
  try {
    const receiptId = Number(req.params.id);
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    await withTransaction((connection) =>
      Order.cancelExportReceipt(connection, receiptId, reason || null),
    );

    return success(res, null, "Export receipt canceled");
  } catch (error) {
    return next(error);
  }
}

async function getCustomers(req, res, next) {
  try {
    const customers = await Order.listCustomers();
    return success(res, customers, "Customers loaded");
  } catch (error) {
    return next(error);
  }
}

async function getSaleProducts(req, res, next) {
  try {
    const products = await Product.listAll();
    const saleProducts = products
      .filter((product) => Number(product.TT) === 1)
      .map((product) => ({
        MSP: Number(product.MSP),
        TEN: product.TEN,
        GIABAN: Number(product.GIABAN || 0),
        SOLUONG: Number(product.SOLUONG || 0),
        TT: Number(product.TT || 0),
      }));

    return success(res, saleProducts, "Sale products loaded");
  } catch (error) {
    return next(error);
  }
}

async function getProfitReport(req, res, next) {
  try {
    const range = getMonthDateRange();
    const startDate = req.query.startDate || range.startDate;
    const endDate = req.query.endDate || range.endDate;

    const summary = await Order.getProfitByDateRange(startDate, endDate);

    return success(
      res,
      {
        startDate,
        endDate,
        ...summary,
        formatted: {
          doanhThu: formatCurrencyVND(summary.doanhThu),
          giaVon: formatCurrencyVND(summary.giaVon),
          loiNhuan: formatCurrencyVND(summary.loiNhuan),
        },
      },
      "Profit report loaded",
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createExportReceipt,
  getExportReceipts,
  getExportReceiptDetail,
  cancelExportReceipt,
  getCustomers,
  getSaleProducts,
  getProfitReport,
};
