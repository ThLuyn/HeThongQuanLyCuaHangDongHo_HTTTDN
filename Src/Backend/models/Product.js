const { query } = require("../config/db");

async function ensureDisplayLocationByName(name, connection = null) {
  const locationName = String(name || "").trim();
  if (!locationName) {
    return null;
  }

  const executor = connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows]),
  };

  const [existingRows] = await executor.execute(
    `
      SELECT MVT
      FROM VITRITRUNGBAY
      WHERE TEN = ?
      LIMIT 1
    `,
    [locationName],
  );

  if (existingRows[0]?.MVT) {
    return Number(existingRows[0].MVT);
  }

  const [insertResult] = await executor.execute(
    `
      INSERT INTO VITRITRUNGBAY (TEN, GHICHU)
      VALUES (?, NULL)
    `,
    [locationName],
  );

  return Number(insertResult.insertId);
}

async function findById(productId, connection = null) {
  const executor = connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows]),
  };

  const [rows] = await executor.execute(
    `
      SELECT MSP, TEN, GIANHAP, GIABAN, SOLUONG, TT
      FROM SANPHAM
      WHERE MSP = ?
      LIMIT 1
    `,
    [Number(productId)],
  );

  return rows[0] || null;
}

async function listAll() {
  return query(
    `
      SELECT
        sp.MSP,
        sp.TEN,
        sp.HINHANH,
        sp.MNCC,
        ncc.TEN AS TENNHACUNGCAP,
        sp.MVT,
        vt.TEN AS TENVITRI,
        sp.THUONGHIEU,
        sp.NAMSANXUAT,
        sp.GIANHAP,
        sp.GIABAN,
        sp.SOLUONG,
        sp.THOIGIANBAOHANH,
        sp.TT
      FROM SANPHAM sp
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = sp.MNCC
      LEFT JOIN VITRITRUNGBAY vt ON vt.MVT = sp.MVT
      ORDER BY sp.MSP DESC
    `,
  );
}

async function createProduct(payload) {
  const mvt = await ensureDisplayLocationByName(payload.displayPosition);

  const result = await query(
    `
      INSERT INTO SANPHAM (
        TEN,
        HINHANH,
        MNCC,
        MVT,
        THUONGHIEU,
        NAMSANXUAT,
        GIANHAP,
        GIABAN,
        SOLUONG,
        THOIGIANBAOHANH,
        TT
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.name,
      payload.image || "about:blank",
      Number(payload.mncc),
      mvt,
      payload.brand || null,
      payload.productionYear || null,
      Number(payload.importPrice || 0),
      Number(payload.sellPrice || 0),
      Number(payload.stock || 0),
      Number(payload.warrantyMonths || 12),
      Number(payload.status ?? 1),
    ],
  );

  return Number(result.insertId || 0);
}

async function updateProduct(productId, payload) {
  const mvt = await ensureDisplayLocationByName(payload.displayPosition);

  await query(
    `
      UPDATE SANPHAM
      SET
        TEN = ?,
        HINHANH = ?,
        MNCC = ?,
        MVT = ?,
        THUONGHIEU = ?,
        NAMSANXUAT = ?,
        GIANHAP = ?,
        GIABAN = ?,
        SOLUONG = ?,
        THOIGIANBAOHANH = ?,
        TT = ?
      WHERE MSP = ?
    `,
    [
      payload.name,
      payload.image || "about:blank",
      Number(payload.mncc),
      mvt,
      payload.brand || null,
      payload.productionYear || null,
      Number(payload.importPrice || 0),
      Number(payload.sellPrice || 0),
      Number(payload.stock || 0),
      Number(payload.warrantyMonths || 12),
      Number(payload.status ?? 1),
      Number(productId),
    ],
  );
}

async function softDeleteProduct(productId) {
  await query(
    `
      UPDATE SANPHAM
      SET TT = 0
      WHERE MSP = ?
    `,
    [Number(productId)],
  );
}

async function getInventoryReport(month, year) {
  const yearNumber = Number(year);
  const monthNumber = month ? Number(month) : null;

  const summaryRows = await query(
    `
      SELECT
        COUNT(*) AS TONG_SANPHAM,
        SUM(CASE WHEN TT = 1 THEN 1 ELSE 0 END) AS SANPHAM_HOATDONG,
        COALESCE(SUM(SOLUONG), 0) AS TONG_TON_KHO,
        COALESCE(SUM(SOLUONG * GIANHAP), 0) AS GIA_TRI_TON_THEO_GIANHAP,
        COALESCE(SUM(SOLUONG * GIABAN), 0) AS GIA_TRI_TON_THEO_GIABAN
      FROM SANPHAM
    `,
  );

  const importRows = await query(
    `
      SELECT
        COUNT(DISTINCT pn.MPN) AS SO_PHIEU_NHAP,
        COALESCE(SUM(ctpn.SL), 0) AS SO_LUONG_NHAP,
        COALESCE(SUM(ctpn.SL * ctpn.TIENNHAP), 0) AS TONG_GIA_TRI_NHAP
      FROM PHIEUNHAP pn
      INNER JOIN CTPHIEUNHAP ctpn ON ctpn.MPN = pn.MPN
      WHERE YEAR(pn.TG) = ?
        AND (? IS NULL OR MONTH(pn.TG) = ?)
    `,
    [yearNumber, monthNumber, monthNumber],
  );

  const productRows = await query(
    `
      SELECT
        sp.MSP,
        sp.TEN,
        sp.THUONGHIEU,
        ncc.TEN AS TENNHACUNGCAP,
        sp.SOLUONG,
        sp.GIANHAP,
        sp.GIABAN,
        COALESCE(SUM(CASE
          WHEN YEAR(pn.TG) = ? AND (? IS NULL OR MONTH(pn.TG) = ?)
          THEN ctpn.SL
          ELSE 0
        END), 0) AS NHAP_TRONG_KY
      FROM SANPHAM sp
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = sp.MNCC
      LEFT JOIN CTPHIEUNHAP ctpn ON ctpn.MSP = sp.MSP
      LEFT JOIN PHIEUNHAP pn ON pn.MPN = ctpn.MPN
      GROUP BY sp.MSP, sp.TEN, sp.THUONGHIEU, ncc.TEN, sp.SOLUONG, sp.GIANHAP, sp.GIABAN
      ORDER BY sp.MSP DESC
    `,
    [yearNumber, monthNumber, monthNumber],
  );

  return {
    year: yearNumber,
    month: monthNumber,
    summary: summaryRows[0] || {},
    imports: importRows[0] || {},
    products: productRows,
  };
}

module.exports = {
  findById,
  listAll,
  createProduct,
  updateProduct,
  softDeleteProduct,
  getInventoryReport,
};
