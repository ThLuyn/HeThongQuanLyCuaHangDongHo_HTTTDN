const { query } = require("../config/db");

async function createImportReceipt(connection, payload) {
  const headerMnv = Number(payload.mnv);
  const headerMncc = Number(payload.mncc);
  const headerTotal = Number(payload.total);

  // Pending receipts (TT=2) must not change stock.
  // Snapshot current stock for all involved products and restore right after detail insert.
  const productIds = Array.from(
    new Set(
      payload.items
        .map((item) => Number(item.msp))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
  const stockBeforeMap = new Map();
  for (const msp of productIds) {
    const [stockRows] = await connection.execute(
      `
        SELECT SOLUONG
        FROM SANPHAM
        WHERE MSP = ?
        LIMIT 1
        FOR UPDATE
      `,
      [msp],
    );
    stockBeforeMap.set(msp, Number(stockRows?.[0]?.SOLUONG || 0));
  }

  const [headerResult] = await connection.execute(
    `
      INSERT INTO PHIEUNHAP (MNV, MNCC, TIEN, TT)
      VALUES (?, ?, ?, 2)
    `,
    [headerMnv, headerMncc, headerTotal],
  );

  const receiptId = headerResult.insertId;

  for (const item of payload.items) {
    const msp = Number(item.msp);
    const sl = Number(item.sl);
    const tienNhap = Number(item.tienNhap);
    const hinhThuc = Number(item.hinhThuc || 0);

    await connection.execute(
      `
        INSERT INTO CTPHIEUNHAP (MPN, MSP, SL, TIENNHAP, HINHTHUC)
        VALUES (?, ?, ?, ?, ?)
      `,
      [receiptId, msp, sl, tienNhap, hinhThuc],
    );
  }

  for (const [msp, originalStock] of stockBeforeMap.entries()) {
    await connection.execute(
      `
        UPDATE SANPHAM
        SET SOLUONG = ?
        WHERE MSP = ?
      `,
      [originalStock, msp],
    );
  }

  return receiptId;
}

async function getImportReceiptDetail(receiptId) {
  const parsedId = Number(receiptId);

  const headers = await query(
    `
      SELECT
        pn.MPN,
        pn.MNV,
        nv.HOTEN AS TENNHANVIEN,
        pn.MNCC,
        ncc.TEN AS TENNHACUNGCAP,
        pn.TIEN,
        pn.TG,
        pn.TT,
        pn.LYDOHUY,
        COUNT(ct.MSP) AS SO_DONG_SANPHAM,
        COALESCE(SUM(ct.SL), 0) AS TONG_SO_LUONG
      FROM PHIEUNHAP pn
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = pn.MNCC
      INNER JOIN NHANVIEN nv ON nv.MNV = pn.MNV
      LEFT JOIN CTPHIEUNHAP ct ON ct.MPN = pn.MPN
      WHERE pn.MPN = ?
      GROUP BY pn.MPN, pn.MNV, nv.HOTEN, pn.MNCC, ncc.TEN, pn.TIEN, pn.TG, pn.TT, pn.LYDOHUY
      LIMIT 1
    `,
    [parsedId],
  );

  if (!headers[0]) {
    return null;
  }

  const items = await query(
    `
      SELECT
        ct.MSP,
        sp.TEN AS TENSP,
        ct.SL,
        ct.TIENNHAP,
        ct.HINHTHUC,
        (ct.SL * ct.TIENNHAP) AS THANHTIEN
      FROM CTPHIEUNHAP ct
      INNER JOIN SANPHAM sp ON sp.MSP = ct.MSP
      WHERE ct.MPN = ?
      ORDER BY ct.MSP ASC
    `,
    [parsedId],
  );

  return {
    ...headers[0],
    ITEMS: items,
  };
}

async function decideImportReceipt(connection, receiptId, action, reason) {
  const parsedId = Number(receiptId);
  const normalizedAction = String(action || "")
    .trim()
    .toLowerCase();

  const [rows] = await connection.execute(
    `
      SELECT MPN, TT
      FROM PHIEUNHAP
      WHERE MPN = ?
      LIMIT 1
      FOR UPDATE
    `,
    [parsedId],
  );

  const receipt = rows[0];
  if (!receipt) {
    const error = new Error("Import receipt not found");
    error.statusCode = 404;
    throw error;
  }

  if (Number(receipt.TT) !== 2) {
    const error = new Error(
      "Only pending receipts can be approved or rejected",
    );
    error.statusCode = 400;
    throw error;
  }

  if (normalizedAction === "approve") {
    const [items] = await connection.execute(
      `
        SELECT MSP, SL, TIENNHAP
        FROM CTPHIEUNHAP
        WHERE MPN = ?
      `,
      [parsedId],
    );

    for (const item of items) {
      await connection.execute(
        `
          UPDATE SANPHAM
          SET SOLUONG = SOLUONG + ?,
              GIANHAP = ?
          WHERE MSP = ?
        `,
        [Number(item.SL), Number(item.TIENNHAP || 0), Number(item.MSP)],
      );
    }

    await connection.execute(
      `
        UPDATE PHIEUNHAP
        SET TT = 1, LYDOHUY = NULL
        WHERE MPN = ?
      `,
      [parsedId],
    );

    return;
  }

  if (normalizedAction === "reject") {
    await connection.execute(
      `
        UPDATE PHIEUNHAP
        SET TT = 0, LYDOHUY = ?
        WHERE MPN = ?
      `,
      [reason || null, parsedId],
    );
    return;
  }

  const error = new Error("action must be approve or reject");
  error.statusCode = 400;
  throw error;
}

async function createExportReceipt(connection, payload) {
  const [headerResult] = await connection.execute(
    `
      INSERT INTO PHIEUXUAT (MNV, MKH, TIEN, TT)
      VALUES (?, ?, ?, 1)
    `,
    [payload.mnv, payload.mkh, payload.total],
  );

  const receiptId = headerResult.insertId;

  for (const item of payload.items) {
    const [stockRows] = await connection.execute(
      "SELECT SOLUONG FROM SANPHAM WHERE MSP = ? FOR UPDATE",
      [item.msp],
    );

    const currentStock = Number(stockRows[0]?.SOLUONG || 0);
    if (currentStock < item.sl) {
      const error = new Error(`Insufficient stock for product ${item.msp}`);
      error.statusCode = 400;
      throw error;
    }

    await connection.execute(
      `
        INSERT INTO CTPHIEUXUAT (MPX, MSP, MKM, SL, TIENXUAT)
        VALUES (?, ?, ?, ?, ?)
      `,
      [receiptId, item.msp, item.mkm || null, item.sl, item.tienXuat],
    );
  }

  return receiptId;
}

async function listExportReceipts(limit = 50) {
  const parsedLimit = Number(limit);
  const safeLimit = Number.isInteger(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 500)
    : 50;

  return query(
    `
      SELECT
        px.MPX,
        px.MNV,
        nv.HOTEN AS TENNHANVIEN,
        px.MKH,
        COALESCE(kh.HOTEN, 'Khách lẻ') AS TENKHACHHANG,
        px.TIEN,
        px.TG,
        px.TT,
        px.LYDOHUY,
        COUNT(ctx.MSP) AS SO_DONG_SANPHAM,
        COALESCE(SUM(ctx.SL), 0) AS TONG_SO_LUONG
      FROM PHIEUXUAT px
      LEFT JOIN NHANVIEN nv ON nv.MNV = px.MNV
      LEFT JOIN KHACHHANG kh ON kh.MKH = px.MKH
      LEFT JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      GROUP BY px.MPX, px.MNV, nv.HOTEN, px.MKH, kh.HOTEN, px.TIEN, px.TG, px.TT, px.LYDOHUY
      ORDER BY px.MPX DESC
      LIMIT ${safeLimit}
    `,
  );
}

async function getExportReceiptDetail(receiptId) {
  const parsedId = Number(receiptId);

  const headers = await query(
    `
      SELECT
        px.MPX,
        px.MNV,
        nv.HOTEN AS TENNHANVIEN,
        px.MKH,
        COALESCE(kh.HOTEN, 'Khách lẻ') AS TENKHACHHANG,
        px.TIEN,
        px.TG,
        px.TT,
        px.LYDOHUY,
        COUNT(ctx.MSP) AS SO_DONG_SANPHAM,
        COALESCE(SUM(ctx.SL), 0) AS TONG_SO_LUONG
      FROM PHIEUXUAT px
      LEFT JOIN NHANVIEN nv ON nv.MNV = px.MNV
      LEFT JOIN KHACHHANG kh ON kh.MKH = px.MKH
      LEFT JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      WHERE px.MPX = ?
      GROUP BY px.MPX, px.MNV, nv.HOTEN, px.MKH, kh.HOTEN, px.TIEN, px.TG, px.TT, px.LYDOHUY
      LIMIT 1
    `,
    [parsedId],
  );

  if (!headers[0]) {
    return null;
  }

  const items = await query(
    `
      SELECT
        ctx.MSP,
        sp.TEN AS TENSP,
        ctx.SL,
        ctx.TIENXUAT,
        (ctx.SL * ctx.TIENXUAT) AS THANHTIEN
      FROM CTPHIEUXUAT ctx
      INNER JOIN SANPHAM sp ON sp.MSP = ctx.MSP
      WHERE ctx.MPX = ?
      ORDER BY ctx.MSP ASC
    `,
    [parsedId],
  );

  return {
    ...headers[0],
    ITEMS: items,
  };
}

async function cancelExportReceipt(connection, receiptId, reason) {
  const parsedId = Number(receiptId);

  const [rows] = await connection.execute(
    `
      SELECT MPX, TT
      FROM PHIEUXUAT
      WHERE MPX = ?
      LIMIT 1
      FOR UPDATE
    `,
    [parsedId],
  );

  const receipt = rows[0];
  if (!receipt) {
    const error = new Error("Export receipt not found");
    error.statusCode = 404;
    throw error;
  }

  if (Number(receipt.TT) === 0) {
    const error = new Error("Export receipt is already canceled");
    error.statusCode = 400;
    throw error;
  }

  if (Number(receipt.TT) !== 1) {
    const error = new Error("Only sold export receipts can be canceled");
    error.statusCode = 400;
    throw error;
  }

  const [items] = await connection.execute(
    `
      SELECT MSP, SL
      FROM CTPHIEUXUAT
      WHERE MPX = ?
    `,
    [parsedId],
  );

  for (const item of items) {
    await connection.execute(
      `
        UPDATE SANPHAM
        SET SOLUONG = SOLUONG + ?
        WHERE MSP = ?
      `,
      [Number(item.SL || 0), Number(item.MSP)],
    );
  }

  await connection.execute(
    `
      UPDATE PHIEUXUAT
      SET TT = 0, LYDOHUY = ?
      WHERE MPX = ?
    `,
    [reason || null, parsedId],
  );
}

async function listCustomers() {
  return query(
    `
      SELECT
        MKH,
        HOTEN,
        SDT,
        EMAIL,
        TT
      FROM KHACHHANG
      WHERE TT = 1
      ORDER BY HOTEN ASC
    `,
  );
}

async function listImportReceipts(limit = 20) {
  const parsedLimit = Number(limit);
  const safeLimit = Number.isInteger(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 500)
    : 20;

  return query(
    `
      SELECT
        pn.MPN,
        pn.MNV,
        nv.HOTEN AS TENNHANVIEN,
        pn.MNCC,
        ncc.TEN AS TENNHACUNGCAP,
        pn.TIEN,
        pn.TG,
        pn.TT,
        pn.LYDOHUY,
        COUNT(ct.MSP) AS SO_DONG_SANPHAM,
        COALESCE(SUM(ct.SL), 0) AS TONG_SO_LUONG
      FROM PHIEUNHAP pn
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = pn.MNCC
      INNER JOIN NHANVIEN nv ON nv.MNV = pn.MNV
      LEFT JOIN CTPHIEUNHAP ct ON ct.MPN = pn.MPN
      GROUP BY pn.MPN, pn.MNV, nv.HOTEN, pn.MNCC, ncc.TEN, pn.TIEN, pn.TG, pn.TT, pn.LYDOHUY
      ORDER BY MPN DESC
      LIMIT ${safeLimit}
    `,
  );
}

async function getProfitByDateRange(startDate, endDate) {
  const rows = await query(
    `
      SELECT
        COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU,
        COALESCE(SUM(ctx.SL * sp.GIANHAP), 0) AS GIANVON
      FROM PHIEUXUAT px
      INNER JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      INNER JOIN SANPHAM sp ON sp.MSP = ctx.MSP
      WHERE px.TT = 1 AND DATE(px.TG) BETWEEN ? AND ?
    `,
    [startDate, endDate],
  );

  const doanhThu = Number(rows[0]?.DOANHTHU || 0);
  const giaVon = Number(rows[0]?.GIANVON || 0);

  return {
    doanhThu,
    giaVon,
    loiNhuan: doanhThu - giaVon,
  };
}

async function getSalesReportByDateRange(startDate, endDate) {
  const summaryRows = await query(
    `
      SELECT
        COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU,
        COALESCE(SUM(ctx.SL * sp.GIANHAP), 0) AS GIANVON,
        COALESCE(SUM(ctx.SL), 0) AS TONGSOLUONG
      FROM PHIEUXUAT px
      INNER JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      INNER JOIN SANPHAM sp ON sp.MSP = ctx.MSP
      WHERE px.TT = 1 AND DATE(px.TG) BETWEEN ? AND ?
    `,
    [startDate, endDate],
  );

  const dailyRows = await query(
    `
      SELECT
        DATE(px.TG) AS NGAY,
        COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU
      FROM PHIEUXUAT px
      INNER JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      WHERE px.TT = 1 AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY DATE(px.TG)
      ORDER BY DATE(px.TG) ASC
    `,
    [startDate, endDate],
  );

  const categoryRows = await query(
    `
      SELECT
        COALESCE(NULLIF(TRIM(sp.THUONGHIEU), ''), 'Khác') AS DANHMUC,
        COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU
      FROM PHIEUXUAT px
      INNER JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      INNER JOIN SANPHAM sp ON sp.MSP = ctx.MSP
      WHERE px.TT = 1 AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY COALESCE(NULLIF(TRIM(sp.THUONGHIEU), ''), 'Khác')
      ORDER BY DOANHTHU DESC
    `,
    [startDate, endDate],
  );

  const monthlyRows = await query(
    `
      SELECT
        MONTH(px.TG) AS THANG,
        COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU,
        COALESCE(SUM(ctx.SL), 0) AS DATHANG
      FROM PHIEUXUAT px
      INNER JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      WHERE px.TT = 1 AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY MONTH(px.TG)
      ORDER BY MONTH(px.TG) ASC
    `,
    [startDate, endDate],
  );

  const productRows = await query(
    `
      SELECT
        sp.MSP,
        sp.TEN AS TENSANPHAM,
        COALESCE(NULLIF(TRIM(sp.THUONGHIEU), ''), 'Khác') AS DANHMUC,
        COALESCE(SUM(ctx.SL), 0) AS SOLUONG,
        COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU,
        COALESCE(SUM(ctx.SL * sp.GIANHAP), 0) AS GIANVON
      FROM PHIEUXUAT px
      INNER JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
      INNER JOIN SANPHAM sp ON sp.MSP = ctx.MSP
      WHERE px.TT = 1 AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY sp.MSP, sp.TEN, COALESCE(NULLIF(TRIM(sp.THUONGHIEU), ''), 'Khác')
      ORDER BY SOLUONG DESC, DOANHTHU DESC
    `,
    [startDate, endDate],
  );

  const doanhThu = Number(summaryRows[0]?.DOANHTHU || 0);
  const giaVon = Number(summaryRows[0]?.GIANVON || 0);
  const tongSoLuong = Number(summaryRows[0]?.TONGSOLUONG || 0);

  const dailyRevenue = dailyRows.map((row) => Number(row.DOANHTHU || 0));
  const middle = Math.ceil(dailyRevenue.length / 2);
  const firstHalf = dailyRevenue
    .slice(0, middle)
    .reduce((sum, value) => sum + value, 0);
  const secondHalf = dailyRevenue
    .slice(middle)
    .reduce((sum, value) => sum + value, 0);
  const growth =
    firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  const dailySales = dailyRows.map((row) => {
    const rawDate = new Date(row.NGAY);
    const label = Number.isNaN(rawDate.getTime())
      ? String(row.NGAY || "")
      : rawDate.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
    return {
      date: String(row.NGAY || ""),
      label,
      sales: Number(row.DOANHTHU || 0),
    };
  });

  const categoryData = categoryRows.map((row) => ({
    name: row.DANHMUC,
    value:
      doanhThu > 0
        ? Number(((Number(row.DOANHTHU || 0) / doanhThu) * 100).toFixed(1))
        : 0,
  }));

  const monthlySales = monthlyRows.map((row) => ({
    month: `T${Number(row.THANG || 0)}`,
    sales: Number(row.DOANHTHU || 0),
    orders: Number(row.DATHANG || 0),
  }));

  const normalizedProductRows = productRows.map((row) => {
    const revenue = Number(row.DOANHTHU || 0);
    const cost = Number(row.GIANVON || 0);
    const profit = revenue - cost;
    return {
      productName: row.TENSANPHAM,
      category: row.DANHMUC,
      units: Number(row.SOLUONG || 0),
      revenue,
      cost,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    };
  });

  const sortedByUnits = [...normalizedProductRows].sort(
    (a, b) => b.units - a.units,
  );
  const topProduct = sortedByUnits[0];
  const slowProduct = sortedByUnits[sortedByUnits.length - 1];

  return {
    revenue: doanhThu,
    orders: tongSoLuong,
    growth,
    profitMargin: doanhThu > 0 ? ((doanhThu - giaVon) / doanhThu) * 100 : 0,
    totalCost: giaVon,
    grossProfit: doanhThu - giaVon,
    topProductName: topProduct?.productName || "-",
    topProductUnits: topProduct?.units || 0,
    slowProductName: slowProduct?.productName || "-",
    slowProductUnits: slowProduct?.units || 0,
    categoryData,
    monthlySales,
    dailySales,
    productRows: normalizedProductRows,
  };
}

module.exports = {
  createImportReceipt,
  getImportReceiptDetail,
  decideImportReceipt,
  createExportReceipt,
  listExportReceipts,
  getExportReceiptDetail,
  cancelExportReceipt,
  listCustomers,
  listImportReceipts,
  getProfitByDateRange,
  getSalesReportByDateRange,
};
