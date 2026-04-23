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
        COALESCE(latest_import.TIENNHAP, sp.GIANHAP) AS GIANHAP,
        sp.GIABAN,
        sp.SOLUONG,
        sp.THOIGIANBAOHANH,
        sp.TT
      FROM SANPHAM sp
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = sp.MNCC
      LEFT JOIN VITRITRUNGBAY vt ON vt.MVT = sp.MVT
      LEFT JOIN (
        SELECT ct.MSP, ct.TIENNHAP
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
          AND pn.TG = (
            SELECT MAX(pn2.TG)
            FROM PHIEUNHAP pn2
            INNER JOIN CTPHIEUNHAP ct2 ON ct2.MPN = pn2.MPN
            WHERE pn2.TT = 1
              AND ct2.MSP = ct.MSP
          )
        GROUP BY ct.MSP, ct.TIENNHAP
      ) latest_import ON latest_import.MSP = sp.MSP
      ORDER BY sp.MSP DESC
    `,
  );
}

/**
 * Tính giá nhập bình quân gia quyền (WAC) của một sản phẩm
 * WAC = Tổng (SL * Giá nhập) / Tổng SL — từ tất cả phiếu nhập đã duyệt
 */
async function getWAC(productId) {
  const rows = await query(
    `
      SELECT
        COALESCE(SUM(ct.SL * ct.TIENNHAP), 0) AS TONG_TIEN,
        COALESCE(SUM(ct.SL), 0) AS TONG_SL
      FROM CTPHIEUNHAP ct
      INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
      WHERE ct.MSP = ?
        AND pn.TT = 1
    `,
    [Number(productId)],
  );

  const tongTien = Number(rows[0]?.TONG_TIEN || 0);
  const tongSl = Number(rows[0]?.TONG_SL || 0);

  if (tongSl === 0) return 0;
  return Math.round(tongTien / tongSl);
}

/**
 * Lấy lịch sử nhập hàng của một sản phẩm
 * Trả về từng đợt nhập với giá, số lượng, ngày nhập
 */
async function getImportHistory(productId) {
  return query(
    `
      SELECT
        pn.MPN,
        pn.TG,
        ct.SL,
        ct.TIENNHAP,
        ct.SL * ct.TIENNHAP AS THANHTIEN,
        ncc.TEN AS TENNHACUNGCAP,
        nv.HOTEN AS TENNHANVIEN
      FROM CTPHIEUNHAP ct
      INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
      INNER JOIN NHACUNGCAP ncc ON ncc.MNCC = pn.MNCC
      LEFT JOIN NHANVIEN nv ON nv.MNV = pn.MNV
      WHERE ct.MSP = ?
        AND pn.TT = 1
      ORDER BY pn.TG DESC
    `,
    [Number(productId)],
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

  // Summary dùng WAC thay vì GIANHAP cứng để tính giá trị tồn kho chính xác hơn
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
        -- Giá trị tồn theo WAC (bình quân gia quyền)
        COALESCE(
          SUM(
            GREATEST(
              sp.SOLUONG - COALESCE(import_after.SO_LUONG_NHAP_SAU_MOC, 0) + COALESCE(export_after.SO_LUONG_XUAT_SAU_MOC, 0),
              0
            ) * COALESCE(wac.GIA_BINH_QUAN, sp.GIANHAP)
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
      LEFT JOIN (
        SELECT ct.MSP,
          CASE
            WHEN SUM(ct.SL) > 0 THEN SUM(ct.SL * ct.TIENNHAP) / SUM(ct.SL)
            ELSE 0
          END AS GIA_BINH_QUAN
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
        GROUP BY ct.MSP
      ) wac ON wac.MSP = sp.MSP
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
        -- Giá nhập mới nhất để hiển thị tham khảo
        COALESCE(latest_import.TIENNHAP, sp.GIANHAP) AS GIANHAP,
        -- WAC để tính báo cáo vốn
        COALESCE(wac.GIA_BINH_QUAN, sp.GIANHAP) AS GIA_BINH_QUAN,
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
      LEFT JOIN (
        SELECT ct.MSP, ct.TIENNHAP
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
          AND pn.TG = (
            SELECT MAX(pn2.TG)
            FROM PHIEUNHAP pn2
            INNER JOIN CTPHIEUNHAP ct2 ON ct2.MPN = pn2.MPN
            WHERE pn2.TT = 1
              AND ct2.MSP = ct.MSP
          )
        GROUP BY ct.MSP, ct.TIENNHAP
      ) latest_import ON latest_import.MSP = sp.MSP
      LEFT JOIN (
        SELECT ct.MSP,
          CASE
            WHEN SUM(ct.SL) > 0 THEN SUM(ct.SL * ct.TIENNHAP) / SUM(ct.SL)
            ELSE 0
          END AS GIA_BINH_QUAN
        FROM CTPHIEUNHAP ct
        INNER JOIN PHIEUNHAP pn ON pn.MPN = ct.MPN
        WHERE pn.TT = 1
        GROUP BY ct.MSP
      ) wac ON wac.MSP = sp.MSP
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

/**
 * Báo cáo doanh số theo kỳ.
 *
 * Tiền vốn xuất = Số lượng bán × WAC tại thời điểm bán
 *
 * WAC tại thời điểm bán được tính là:
 *   Tổng (SL nhập × Giá nhập) của tất cả lô nhập ĐÃ DUYỆT có TG <= ngày bán
 *   chia cho Tổng SL nhập tương ứng.
 *
 * Nếu sản phẩm chưa có lịch sử nhập trước ngày bán thì fallback về GIANHAP.
 */
async function getSalesReport({ fromDate, toDate }) {
  // ── 1. Doanh thu tổng & theo ngày / tháng ──────────────────────────────
  const summaryRows = await query(
    `
      SELECT
        COALESCE(SUM(ct.SL), 0)                              AS TONG_SO_LUONG,
        COALESCE(SUM(ct.SL * ct.DONGIA), 0)                  AS TONG_DOANHTHU,
        /* WAC tại thời điểm xuất: join phiếu nhập có TG <= TG xuất */
        COALESCE(
          SUM(
            ct.SL * COALESCE(wac_at_sale.GIA_BINH_QUAN, sp.GIANHAP)
          ), 0
        )                                                    AS TONG_VON,
        COALESCE(
          SUM(
            ct.SL * (ct.DONGIA - COALESCE(wac_at_sale.GIA_BINH_QUAN, sp.GIANHAP))
          ), 0
        )                                                    AS TONG_LOINHUAN
      FROM CTPHIEUXUAT ct
      INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
      INNER JOIN SANPHAM sp   ON sp.MSP  = ct.MSP
      /* WAC tính đến thời điểm của phiếu xuất */
      LEFT JOIN LATERAL (
        SELECT
          CASE WHEN SUM(cti.SL) > 0
               THEN SUM(cti.SL * cti.TIENNHAP) / SUM(cti.SL)
               ELSE NULL
          END AS GIA_BINH_QUAN
        FROM CTPHIEUNHAP cti
        INNER JOIN PHIEUNHAP pni ON pni.MPN = cti.MPN
        WHERE cti.MSP = ct.MSP
          AND pni.TT  = 1
          AND pni.TG <= px.TG
      ) wac_at_sale ON TRUE
      WHERE px.TT    = 1
        AND DATE(px.TG) BETWEEN ? AND ?
    `,
    [fromDate, toDate],
  );

  const summary = summaryRows[0] || {};
  const totalRevenue  = Number(summary.TONG_DOANHTHU  || 0);
  const totalCost     = Number(summary.TONG_VON        || 0);
  const grossProfit   = Number(summary.TONG_LOINHUAN   || 0);
  const totalOrders   = Number(summary.TONG_SO_LUONG   || 0);
  const profitMargin  = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // ── 2. Doanh thu theo ngày ─────────────────────────────────────────────
  const dailyRows = await query(
    `
      SELECT
        DATE_FORMAT(px.TG, '%Y-%m-%d') AS \`date\`,
        COALESCE(SUM(ct.SL * ct.DONGIA), 0) AS sales
      FROM CTPHIEUXUAT ct
      INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
      WHERE px.TT = 1
        AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(px.TG, '%Y-%m-%d')
      ORDER BY \`date\`
    `,
    [fromDate, toDate],
  );

  // ── 3. Doanh thu theo tháng ────────────────────────────────────────────
  const monthlyRows = await query(
    `
      SELECT
        CONCAT('T', MONTH(px.TG)) AS \`month\`,
        COALESCE(SUM(ct.SL * ct.DONGIA), 0) AS sales
      FROM CTPHIEUXUAT ct
      INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
      WHERE px.TT = 1
        AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY MONTH(px.TG)
      ORDER BY MONTH(px.TG)
    `,
    [fromDate, toDate],
  );

  // ── 4. Chi tiết từng sản phẩm (với WAC tại thời điểm bán) ─────────────
  const productRows = await query(
    `
      SELECT
        sp.MSP,
        sp.TEN                                                          AS productName,
        SUM(ct.SL)                                                      AS units,
        SUM(ct.SL * ct.DONGIA)                                          AS revenue,
        /* Vốn = SL × WAC tại thời điểm xuất */
        SUM(
          ct.SL * COALESCE(wac_at_sale.GIA_BINH_QUAN, sp.GIANHAP)
        )                                                               AS cost,
        SUM(
          ct.SL * (ct.DONGIA - COALESCE(wac_at_sale.GIA_BINH_QUAN, sp.GIANHAP))
        )                                                               AS profit,
        /* WAC toàn bộ lịch sử (tham khảo) */
        COALESCE(wac_all.GIA_BINH_QUAN, sp.GIANHAP)                    AS wacOverall
      FROM CTPHIEUXUAT ct
      INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
      INNER JOIN SANPHAM sp   ON sp.MSP  = ct.MSP
      LEFT JOIN LATERAL (
        SELECT
          CASE WHEN SUM(cti.SL) > 0
               THEN SUM(cti.SL * cti.TIENNHAP) / SUM(cti.SL)
               ELSE NULL
          END AS GIA_BINH_QUAN
        FROM CTPHIEUNHAP cti
        INNER JOIN PHIEUNHAP pni ON pni.MPN = cti.MPN
        WHERE cti.MSP = ct.MSP
          AND pni.TT  = 1
          AND pni.TG <= px.TG
      ) wac_at_sale ON TRUE
      LEFT JOIN (
        SELECT
          cti.MSP,
          CASE WHEN SUM(cti.SL) > 0
               THEN SUM(cti.SL * cti.TIENNHAP) / SUM(cti.SL)
               ELSE NULL
          END AS GIA_BINH_QUAN
        FROM CTPHIEUNHAP cti
        INNER JOIN PHIEUNHAP pni ON pni.MPN = cti.MPN
        WHERE pni.TT = 1
        GROUP BY cti.MSP
      ) wac_all ON wac_all.MSP = sp.MSP
      WHERE px.TT    = 1
        AND DATE(px.TG) BETWEEN ? AND ?
      GROUP BY sp.MSP, sp.TEN, sp.GIANHAP, wac_all.GIA_BINH_QUAN
      ORDER BY revenue DESC
    `,
    [fromDate, toDate],
  );

  // ── 5. Tăng trưởng so kỳ trước (cùng độ dài) ─────────────────────────
  const from    = new Date(fromDate);
  const to      = new Date(toDate);
  const diffMs  = to - from;
  const prevTo  = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom= new Date(prevTo.getTime() - diffMs);

  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const prevRows = await query(
    `
      SELECT COALESCE(SUM(ct.SL * ct.DONGIA), 0) AS TONG_DOANHTHU
      FROM CTPHIEUXUAT ct
      INNER JOIN PHIEUXUAT px ON px.MPX = ct.MPX
      WHERE px.TT = 1
        AND DATE(px.TG) BETWEEN ? AND ?
    `,
    [fmt(prevFrom), fmt(prevTo)],
  );

  const prevRevenue = Number(prevRows[0]?.TONG_DOANHTHU || 0);
  const growth =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  return {
    revenue:      totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    orders:       totalOrders,
    growth,
    dailySales:   dailyRows.map((r) => ({ date: r.date, sales: Number(r.sales) })),
    monthlySales: monthlyRows.map((r) => ({ month: r.month, sales: Number(r.sales) })),
    productRows:  productRows.map((r) => ({
      msp:         Number(r.MSP),
      productName: r.productName,
      units:       Number(r.units    || 0),
      revenue:     Number(r.revenue  || 0),
      cost:        Number(r.cost     || 0),
      profit:      Number(r.profit   || 0),
      wacOverall:  Number(r.wacOverall || 0),
    })),
  };
}

module.exports = {
  findById,
  listAll,
  createProduct,
  updateProduct,
  softDeleteProduct,
  getInventoryReport,
  getWAC,
  getImportHistory,
  getSalesReport,
};