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

async function createProduct(payload, connection = null) {
  const executor = connection || {
    execute: (sql, params) => query(sql, params).then((rows) => [rows]),
  };

  const mvt = await ensureDisplayLocationByName(
    payload.displayPosition,
    connection,
  );

  const [result] = await executor.execute(
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
        GIABAN = ?,
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
      Number(payload.sellPrice || 0),
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

  const periodEndDate = monthNumber
    ? new Date(yearNumber, monthNumber, 0, 23, 59, 59)
    : new Date(yearNumber, 11, 31, 23, 59, 59);

  const periodEnd = `${periodEndDate.getFullYear()}-${String(
    periodEndDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(periodEndDate.getDate()).padStart(
    2,
    "0",
  )} ${String(periodEndDate.getHours()).padStart(2, "0")}:${String(
    periodEndDate.getMinutes(),
  ).padStart(2, "0")}:${String(periodEndDate.getSeconds()).padStart(2, "0")}`;

  const summaryRows = await query(
    `
      SELECT
        COUNT(*) AS TONG_SANPHAM,
        SUM(CASE WHEN sp.TT = 1 THEN 1 ELSE 0 END) AS SANPHAM_HOATDONG,
        COALESCE(
          SUM(
            GREATEST(
              sp.SOLUONG - COALESCE(import_after.SO_LUONG_NHAP_SAU_MOC, 0) + COALESCE(export_after.SO_LUONG_XUAT_SAU_MOC, 0),
              0
            )
          ),
          0
        ) AS TONG_TON_KHO,
        COALESCE(
          SUM(
            GREATEST(
              sp.SOLUONG - COALESCE(import_after.SO_LUONG_NHAP_SAU_MOC, 0) + COALESCE(export_after.SO_LUONG_XUAT_SAU_MOC, 0),
              0
            ) * sp.GIANHAP
          ),
          0
        ) AS GIA_TRI_TON_THEO_GIANHAP,
        COALESCE(
          SUM(
            GREATEST(
              sp.SOLUONG - COALESCE(import_after.SO_LUONG_NHAP_SAU_MOC, 0) + COALESCE(export_after.SO_LUONG_XUAT_SAU_MOC, 0),
              0
            ) * sp.GIABAN
          ),
          0
        ) AS GIA_TRI_TON_THEO_GIABAN
      FROM SANPHAM sp
      INNER JOIN (
        SELECT ct.MSP, MIN(pn.TG) AS TG_NHAP_DAU_TIEN
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
        GROUP BY ct.MSP
      ) first_import ON first_import.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP, COALESCE(SUM(ct.SL), 0) AS SO_LUONG_NHAP_SAU_MOC
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1 AND pn.TG > ?
        GROUP BY ct.MSP
      ) import_after ON import_after.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP, COALESCE(SUM(ct.SL), 0) AS SO_LUONG_XUAT_SAU_MOC
        FROM CTPHIEUXUAT ct
        INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
        WHERE px.TT = 1 AND px.TG > ?
        GROUP BY ct.MSP
      ) export_after ON export_after.MSP = sp.MSP
      WHERE first_import.TG_NHAP_DAU_TIEN <= ?
    `,
    [periodEnd, periodEnd, periodEnd],
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
        AND pn.TT = 1
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
        GREATEST(
          sp.SOLUONG - COALESCE(import_after.SO_LUONG_NHAP_SAU_MOC, 0) + COALESCE(export_after.SO_LUONG_XUAT_SAU_MOC, 0),
          0
        ) AS SOLUONG,
        GREATEST(
          GREATEST(
            sp.SOLUONG - COALESCE(import_after.SO_LUONG_NHAP_SAU_MOC, 0) + COALESCE(export_after.SO_LUONG_XUAT_SAU_MOC, 0),
            0
          ) - COALESCE(import_period.SO_LUONG_NHAP_TRONG_KY, 0) + COALESCE(export_period.SO_LUONG_XUAT_TRONG_KY, 0),
          0
        ) AS TON_DAU_KY,
        COALESCE(import_period.SO_LUONG_NHAP_TRONG_KY, 0) AS NHAP_TRONG_KY,
        COALESCE(export_period.SO_LUONG_XUAT_TRONG_KY, 0) AS XUAT_TRONG_KY,
        sp.GIANHAP,
        sp.GIABAN,
        sp.TT
      FROM SANPHAM sp
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = sp.MNCC
      INNER JOIN (
        SELECT ct.MSP, MIN(pn.TG) AS TG_NHAP_DAU_TIEN
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
        GROUP BY ct.MSP
      ) first_import ON first_import.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP, COALESCE(SUM(ct.SL), 0) AS SO_LUONG_NHAP_SAU_MOC
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1 AND pn.TG > ?
        GROUP BY ct.MSP
      ) import_after ON import_after.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP, COALESCE(SUM(ct.SL), 0) AS SO_LUONG_XUAT_SAU_MOC
        FROM CTPHIEUXUAT ct
        INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
        WHERE px.TT = 1 AND px.TG > ?
        GROUP BY ct.MSP
      ) export_after ON export_after.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP, COALESCE(SUM(ct.SL), 0) AS SO_LUONG_NHAP_TRONG_KY
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
          AND YEAR(pn.TG) = ?
          AND (? IS NULL OR MONTH(pn.TG) = ?)
        GROUP BY ct.MSP
      ) import_period ON import_period.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP, COALESCE(SUM(ct.SL), 0) AS SO_LUONG_XUAT_TRONG_KY
        FROM CTPHIEUXUAT ct
        INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
        WHERE px.TT = 1
          AND YEAR(px.TG) = ?
          AND (? IS NULL OR MONTH(px.TG) = ?)
        GROUP BY ct.MSP
      ) export_period ON export_period.MSP = sp.MSP
      WHERE first_import.TG_NHAP_DAU_TIEN <= ?
      ORDER BY sp.MSP DESC
    `,
    [
      periodEnd,
      periodEnd,
      yearNumber,
      monthNumber,
      monthNumber,
      yearNumber,
      monthNumber,
      monthNumber,
      periodEnd,
    ],
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
