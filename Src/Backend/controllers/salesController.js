const { withTransaction } = require("../config/db");
const Order = require("../models/Order");
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
  getProfitReport,
};
