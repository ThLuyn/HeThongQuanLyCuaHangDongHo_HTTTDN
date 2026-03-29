const { query } = require("../config/db");

async function createImportReceipt(connection, payload) {
  const headerMnv = Number(payload.mnv);
  const headerMncc = Number(payload.mncc);
  const headerTotal = Number(payload.total);

  const [headerResult] = await connection.execute(
    `
      INSERT INTO PHIEUNHAP (MNV, MNCC, TIEN, TT)
      VALUES (?, ?, ?, 1)
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

    await connection.execute(
      `
        UPDATE SANPHAM
        SET SOLUONG = SOLUONG + ?
        WHERE MSP = ?
      `,
      [sl, msp],
    );
  }

  return receiptId;
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

    await connection.execute(
      `
        UPDATE SANPHAM
        SET SOLUONG = SOLUONG - ?
        WHERE MSP = ?
      `,
      [item.sl, item.msp],
    );
  }

  return receiptId;
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
        pn.LYDOHUY
      FROM PHIEUNHAP pn
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = pn.MNCC
      INNER JOIN NHANVIEN nv ON nv.MNV = pn.MNV
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

module.exports = {
  createImportReceipt,
  createExportReceipt,
  listImportReceipts,
  getProfitByDateRange,
};
