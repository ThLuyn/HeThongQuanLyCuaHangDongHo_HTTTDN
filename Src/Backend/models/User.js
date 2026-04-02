const { query, withTransaction } = require("../config/db");

async function findByUsername(username) {
  const rows = await query(
    `
      SELECT
        tk.MNV,
        tk.TDN,
        tk.MK,
        tk.MNQ,
        tk.TRANGTHAI,
        nv.HOTEN,
        nv.HINHANH,
        nq.TEN AS TENNHOMQUYEN
      FROM TAIKHOAN tk
      INNER JOIN NHANVIEN nv ON nv.MNV = tk.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      WHERE tk.TDN = ?
      LIMIT 1
    `,
    [username],
  );

  return rows[0] || null;
}

async function findById(mnv) {
  const rows = await query(
    `
      SELECT
        tk.MNV,
        tk.TDN,
        tk.MNQ,
        tk.TRANGTHAI,
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
        nv.SOTAIKHOAN AS SOTAIKHOANNGANHANG,
        nv.TENNGANHANG,
        cv.TEN AS TENCHUCVU,
        cv.LUONGCOBAN,
        nq.TEN AS TENNHOMQUYEN
      FROM TAIKHOAN tk
      INNER JOIN NHANVIEN nv ON nv.MNV = tk.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      WHERE tk.MNV = ?
      LIMIT 1
    `,
    [mnv],
  );

  return rows[0] || null;
}

async function updateProfileById(mnv, payload) {
  const employeeId = Number(mnv);
  const employeeStatus = Number(payload.trangThai) === 0 ? 0 : 1;

  await withTransaction(async (connection) => {
    await connection.execute(
      `
        UPDATE NHANVIEN
        SET
          HOTEN = ?,
          GIOITINH = ?,
          NGAYSINH = ?,
          SDT = ?,
          EMAIL = ?,
          TT = ?,
          QUEQUAN = ?,
          DIACHI = ?,
          HINHANH = ?,
          NGAYVAOLAM = ?,
          CCCD = ?,
          BOPHAN = ?,
          SOTAIKHOAN = ?,
          TENNGANHANG = ?
        WHERE MNV = ?
      `,
      [
        payload.fullName,
        Number(payload.gioiTinh),
        payload.ngaySinh,
        payload.soDienThoai,
        payload.email,
        employeeStatus,
        payload.queQuan || null,
        payload.diaChi || null,
        payload.hinhAnh || null,
        payload.ngayVaoLam || null,
        payload.cccd || null,
        payload.boPhan || null,
        payload.soTaiKhoanNganHang || null,
        payload.tenNganHang || null,
        employeeId,
      ],
    );

    await connection.execute(
      `
        UPDATE TAIKHOAN
        SET TRANGTHAI = ?
        WHERE MNV = ?
      `,
      [employeeStatus, employeeId],
    );
  });
}

async function updatePasswordById(mnv, hashedPassword) {
  await query(
    `
      UPDATE TAIKHOAN
      SET MK = ?
      WHERE MNV = ?
    `,
    [hashedPassword, Number(mnv)],
  );
}

module.exports = {
  findByUsername,
  findById,
  updateProfileById,
  updatePasswordById,
};
