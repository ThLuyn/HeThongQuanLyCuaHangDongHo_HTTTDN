const { query } = require("../config/db");
const Notification = require("../models/Notification");
const { success } = require("../utils/response");

function toNumber(value) {
  return Number(value || 0);
}

function getVietnamDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
        SELECT *
        FROM (
          (
          SELECT
            'XUAT' AS LOAI,
            px.MPX AS MA,
            px.TIEN,
            px.TG,
            px.TT,
            COALESCE(kh.HOTEN, 'Khách lẻ') AS DOITUONG
          FROM PHIEUXUAT px
          LEFT JOIN KHACHHANG kh ON kh.MKH = px.MKH
          ORDER BY px.TG DESC
          LIMIT 5
          )

          UNION ALL

          (
          SELECT
            'NHAP' AS LOAI,
            pn.MPN AS MA,
            pn.TIEN,
            pn.TG,
            pn.TT,
            COALESCE(ncc.TEN, 'Nhà cung cấp') AS DOITUONG
          FROM PHIEUNHAP pn
          LEFT JOIN NHACUNGCAP ncc ON ncc.MNCC = pn.MNCC
          ORDER BY pn.TG DESC
          LIMIT 5
          )
        ) tx
        ORDER BY tx.TG DESC
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

    const recentTransactions = recentRows.map((row) => {
      const type =
        String(row.LOAI || "").toUpperCase() === "NHAP"
          ? "Nhập kho"
          : "Xuất hàng";
      const statusCode = Number(row.TT);
      const status =
        String(row.LOAI || "").toUpperCase() === "NHAP"
          ? statusCode === 1
            ? "Đã duyệt"
            : statusCode === 2
              ? "Chờ duyệt"
              : "Đã hủy"
          : statusCode === 1
            ? "Đã bán"
            : "Đã hủy";

      return {
        id: `${String(row.LOAI || "").toUpperCase() === "NHAP" ? "PNK" : "PXK"}${String(row.MA).padStart(4, "0")}`,
        customer: row.DOITUONG,
        total: toNumber(row.TIEN),
        time: row.TG,
        type,
        status,
      };
    });

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

async function getHeaderNotifications(req, res, next) {
  try {
    const mnq = Number(req.user?.mnq || 0);
    const notifications = await Notification.getNotificationsForUser(mnq);
    return success(res, notifications, "Header notifications loaded");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOverview,
  getHeaderNotifications,
};
