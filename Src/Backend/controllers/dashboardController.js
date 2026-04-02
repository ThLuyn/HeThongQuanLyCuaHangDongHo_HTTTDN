const { query } = require("../config/db");
const { success } = require("../utils/response");

function toNumber(value) {
  return Number(value || 0);
}

async function getOverview(req, res, next) {
  try {
    const currentYear = new Date().getFullYear();
    const year = Number(req.query.year) || currentYear;

    const yearlyRows = await query(
      `
        SELECT
          COALESCE(SUM(px.TIEN), 0) AS DOANHTHU,
          COUNT(*) AS SOHOADON
        FROM PHIEUXUAT px
        WHERE px.TT = 1 AND YEAR(px.TG) = ?
      `,
      [year],
    );

    const lowStockRows = await query(
      `
        SELECT COUNT(*) AS SANPHAMTONTHAP
        FROM SANPHAM
        WHERE TT = 1 AND SOLUONG <= 3
      `,
    );

    const employeeRows = await query(
      `
        SELECT COUNT(*) AS NHANSU
        FROM NHANVIEN
        WHERE TT = 1
      `,
    );

    const monthlyRows = await query(
      `
        SELECT
          MONTH(px.TG) AS THANG,
          COALESCE(SUM(ctx.SL * ctx.TIENXUAT), 0) AS DOANHTHU,
          COALESCE(SUM(ctx.SL * sp.GIANHAP), 0) AS GIANVON
        FROM PHIEUXUAT px
        LEFT JOIN CTPHIEUXUAT ctx ON ctx.MPX = px.MPX
        LEFT JOIN SANPHAM sp ON sp.MSP = ctx.MSP
        WHERE px.TT = 1 AND YEAR(px.TG) = ?
        GROUP BY MONTH(px.TG)
      `,
      [year],
    );

    const recentRows = await query(
      `
        SELECT
          px.MPX,
          px.TIEN,
          px.TG,
          COALESCE(kh.HOTEN, 'Khách lẻ') AS TENKHACHHANG
        FROM PHIEUXUAT px
        LEFT JOIN KHACHHANG kh ON kh.MKH = px.MKH
        WHERE px.TT = 1
        ORDER BY px.TG DESC
        LIMIT 10
      `,
    );

    const monthlyMap = new Map(
      monthlyRows.map((row) => [
        Number(row.THANG),
        {
          revenue: toNumber(row.DOANHTHU),
          profit: toNumber(row.DOANHTHU) - toNumber(row.GIANVON),
        },
      ]),
    );

    const chart = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = monthlyMap.get(month) || { revenue: 0, profit: 0 };
      return {
        month: `T${month}`,
        revenue: data.revenue,
        profit: data.profit,
      };
    });

    const recentTransactions = recentRows.map((row) => ({
      id: `HD${String(row.MPX).padStart(3, "0")}`,
      customer: row.TENKHACHHANG,
      total: toNumber(row.TIEN),
      time: row.TG,
    }));

    return success(
      res,
      {
        year,
        summary: {
          doanhThu: toNumber(yearlyRows[0]?.DOANHTHU),
          hoaDonMoi: toNumber(yearlyRows[0]?.SOHOADON),
          sanPhamTonThap: toNumber(lowStockRows[0]?.SANPHAMTONTHAP),
          nhanSu: toNumber(employeeRows[0]?.NHANSU),
        },
        chart,
        recentTransactions,
      },
      "Dashboard overview loaded",
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOverview,
};
