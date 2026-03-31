const { query } = require("../config/db");

async function listAll() {
  return query(
    `
      SELECT
        nv.MNV,
        nv.HOTEN,
        nv.GIOITINH,
        nv.NGAYSINH,
        nv.SDT,
        nv.EMAIL,
        nv.TT,
        cv.MCV,
        cv.TEN AS TENCHUCVU,
        cv.LUONGCOBAN,
        cv.TY_LE_HOA_HONG
      FROM NHANVIEN nv
      INNER JOIN CHUCVU cv ON cv.MCV = nv.MCV
      ORDER BY nv.MNV DESC
    `,
  );
}

async function findById(mnv) {
  const rows = await query(
    `
      SELECT
        nv.MNV,
        nv.HOTEN,
        nv.GIOITINH,
        nv.NGAYSINH,
        nv.SDT,
        nv.EMAIL,
        nv.TT,
        nv.QUEQUAN,
        nv.DIACHI,
        nv.HINHANH,
        nv.NGAYVAOLAM,
        nv.CCCD,
        nv.BOPHAN,
        nv.SOTAIKHOAN,
        nv.TENNGANHANG,
        cv.TEN AS TENCHUCVU,
        cv.LUONGCOBAN,
        cv.TY_LE_HOA_HONG,
        tk.TDN,
        tk.TRANGTHAI AS TRANGTHAI_TAIKHOAN,
        nq.TEN AS TENNHOMQUYEN
      FROM NHANVIEN nv
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      LEFT JOIN TAIKHOAN tk ON tk.MNV = nv.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      WHERE nv.MNV = ?
      LIMIT 1
    `,
    [Number(mnv)],
  );

  return rows[0] || null;
}

async function listLeaveRequests(status) {
  const params = [];
  let whereClause = "";

  if (status !== undefined) {
    whereClause = "WHERE dxn.TRANGTHAI = ?";
    params.push(Number(status));
  }

  return query(
    `
      SELECT
        dxn.MDN,
        dxn.MNV,
        nv.HOTEN,
        dxn.LOAI,
        dxn.NGAYNGHI,
        dxn.SONGAY,
        dxn.LYDO,
        dxn.TRANGTHAI,
        dxn.NGUOIDUYET,
        dxn.NGAYTAO,
        dxn.GHICHU
      FROM DONXINNGH dxn
      INNER JOIN NHANVIEN nv ON nv.MNV = dxn.MNV
      ${whereClause}
      ORDER BY dxn.MDN DESC
    `,
    params,
  );
}

async function approveLeaveRequest(id, status, reviewerId, note) {
  return query(
    `
      UPDATE DONXINNGH
      SET TRANGTHAI = ?, NGUOIDUYET = ?, GHICHU = ?
      WHERE MDN = ?
    `,
    [Number(status), reviewerId, note || null, Number(id)],
  );
}

async function getPayrollByMonth(month, year) {
  return query(
    `
      SELECT
        bl.MBL,
        bl.MNV,
        nv.HOTEN,
        bl.THANG,
        bl.NAM,
        bl.LUONGCOBAN,
        bl.NGAYCONG,
        bl.DOANH_SO,
        bl.TY_LE_HOA_HONG,
        bl.HOA_HONG,
        0 AS THUONG,
        bl.HOA_HONG AS PHUCAP,
        (bl.BHXH + bl.BHYT + bl.BHTN + bl.KHAUTRU_KHAC) AS KHAUTRU,
        bl.LUONGTHUCLANH,
        bl.TT
      FROM BANGLUONG bl
      INNER JOIN NHANVIEN nv ON nv.MNV = bl.MNV
      WHERE bl.THANG = ? AND bl.NAM = ?
      ORDER BY bl.MNV ASC
    `,
    [Number(month), Number(year)],
  );
}

async function markAsResigned(mnv) {
  const employeeId = Number(mnv);

  await query(
    `
      UPDATE NHANVIEN
      SET TT = 0
      WHERE MNV = ?
    `,
    [employeeId],
  );

  await query(
    `
      UPDATE TAIKHOAN
      SET TRANGTHAI = 0
      WHERE MNV = ?
    `,
    [employeeId],
  );
}

module.exports = {
  listAll,
  findById,
  listLeaveRequests,
  approveLeaveRequest,
  getPayrollByMonth,
  markAsResigned,
};
