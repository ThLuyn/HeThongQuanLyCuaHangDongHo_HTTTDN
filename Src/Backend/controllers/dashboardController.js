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
    const leaveRows = await query(
      `
        SELECT
          dxn.MDN,
          nv.HOTEN,
          dxn.NGAYTAO
        FROM DONXINNGH dxn
        INNER JOIN NHANVIEN nv ON nv.MNV = dxn.MNV
        WHERE dxn.TRANGTHAI = 0
        ORDER BY dxn.NGAYTAO DESC, dxn.MDN DESC
        LIMIT 5
      `,
    );

    const lowStockRows = await query(
      `
        SELECT
          MSP,
          TEN,
          SOLUONG
        FROM SANPHAM
        WHERE TT = 1 AND SOLUONG <= 3
        ORDER BY SOLUONG ASC, MSP ASC
        LIMIT 5
      `,
    );

    const leaveNotifications = leaveRows.map((row) => ({
      id: `LEAVE-${row.MDN}`,
      text: `Nhân viên ${row.HOTEN} đã gửi đơn xin nghỉ`,
      time: row.NGAYTAO || null,
      unread: true,
    }));

    const lowStockNotifications = lowStockRows.map((row) => ({
      id: `LOWSTOCK-${row.MSP}`,
      text: `Sản phẩm ${row.TEN} tồn kho thấp (${Number(row.SOLUONG || 0)})`,
      time: null,
      unread: true,
    }));

    const notifications = [
      ...leaveNotifications,
      ...lowStockNotifications,
    ].slice(0, 10);

    return success(res, notifications, "Header notifications loaded");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOverview,
  getHeaderNotifications,
};
