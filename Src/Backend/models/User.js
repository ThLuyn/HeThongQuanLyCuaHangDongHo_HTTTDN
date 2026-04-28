const { query, withTransaction } = require("../config/db");

// ─────────────────────────────────────────────
//  Tìm tài khoản theo tên đăng nhập
// ─────────────────────────────────────────────
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
        nv.BOPHAN,
        nv.MCV,
        cv.TEN  AS TENCHUCVU,
        nq.TEN  AS TENNHOMQUYEN
      FROM TAIKHOAN tk
      INNER JOIN NHANVIEN  nv ON nv.MNV = tk.MNV
      LEFT  JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      LEFT  JOIN CHUCVU    cv ON cv.MCV = nv.MCV
      WHERE tk.TDN = ?
      LIMIT 1
    `,
    [username],
  );

  return rows[0] || null;
}

// ─────────────────────────────────────────────
//  Tìm tài khoản theo mã nhân viên
// ─────────────────────────────────────────────
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
        nv.SOTAIKHOAN  AS SOTAIKHOANNGANHANG,
        nv.TENNGANHANG,
        cv.TEN         AS TENCHUCVU,
        cv.LUONGCOBAN,
        nq.TEN         AS TENNHOMQUYEN
      FROM TAIKHOAN tk
      INNER JOIN NHANVIEN  nv ON nv.MNV = tk.MNV
      LEFT  JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      LEFT  JOIN CHUCVU    cv ON cv.MCV = nv.MCV
      WHERE tk.MNV = ?
      LIMIT 1
    `,
    [Number(mnv)],
  );

  return rows[0] || null;
}

// ─────────────────────────────────────────────
//  Lấy danh sách quyền theo nhóm quyền (MNQ)
//  — dùng sau khi login để build permissions[]
// ─────────────────────────────────────────────
async function listPermissionsByGroup(mnq) {
  return query(
    `
      SELECT ct.MCN, ct.HANHDONG
      FROM   CTQUYEN          ct
      INNER  JOIN NHOMQUYEN       nq ON nq.MNQ = ct.MNQ
      INNER  JOIN DANHMUCCHUCNANG d  ON d.MCN  = ct.MCN
      WHERE  ct.MNQ = ?
        AND  nq.TT  = 1
        AND  d.TT   = 1
      ORDER  BY ct.MCN ASC, ct.HANHDONG ASC
    `,
    [Number(mnq)],
  );
}

// ─────────────────────────────────────────────
//  Cập nhật thông tin cá nhân nhân viên
// ─────────────────────────────────────────────
async function updateProfileById(mnv, payload) {
  const employeeId     = Number(mnv);
  const employeeStatus = Number(payload.trangThai) === 0 ? 0 : 1;

  await withTransaction(async (connection) => {
    await connection.execute(
      `
        UPDATE NHANVIEN
        SET
          HOTEN       = ?,
          GIOITINH    = ?,
          NGAYSINH    = ?,
          SDT         = ?,
          EMAIL       = ?,
          TT          = ?,
          QUEQUAN     = ?,
          DIACHI      = ?,
          HINHANH     = ?,
          NGAYVAOLAM  = ?,
          CCCD        = ?,
          BOPHAN      = ?,
          SOTAIKHOAN  = ?,
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
        payload.queQuan          || null,
        payload.diaChi           || null,
        payload.hinhAnh          || null,
        payload.ngayVaoLam       || null,
        payload.cccd             || null,
        payload.boPhan           || null,
        payload.soTaiKhoanNganHang || null,
        payload.tenNganHang      || null,
        employeeId,
      ],
    );

    await connection.execute(
      `UPDATE TAIKHOAN SET TRANGTHAI = ? WHERE MNV = ?`,
      [employeeStatus, employeeId],
    );
  });
}

// ─────────────────────────────────────────────
//  Đổi mật khẩu
// ─────────────────────────────────────────────
async function updatePasswordById(mnv, hashedPassword) {
  await query(
    `UPDATE TAIKHOAN SET MK = ? WHERE MNV = ?`,
    [hashedPassword, Number(mnv)],
  );
}

// ─────────────────────────────────────────────
//  Danh sách tài khoản (dùng cho trang quản lý)
// ─────────────────────────────────────────────
async function listAccounts() {
  return query(
    `
      SELECT
        tk.MNV,
        tk.TDN,
        tk.MNQ,
        tk.TRANGTHAI,
        nv.HOTEN,
        nv.NGAYVAOLAM,
        COALESCE(nq.TEN, 'Không xác định') AS TENNHOMQUYEN
      FROM TAIKHOAN tk
      INNER JOIN NHANVIEN  nv ON nv.MNV = tk.MNV
      LEFT  JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      ORDER  BY tk.MNV DESC
    `,
  );
}

// ─────────────────────────────────────────────
//  Danh sách nhóm quyền đang hoạt động
// ─────────────────────────────────────────────
async function listRoleGroups() {
  return query(
    `
      SELECT MNQ, TEN
      FROM   NHOMQUYEN
      WHERE  TT = 1
      ORDER  BY MNQ ASC
    `,
  );
}

// ─────────────────────────────────────────────
//  Nhân viên chưa có tài khoản
// ─────────────────────────────────────────────
async function listEmployeesWithoutAccount() {
  return query(
    `
      SELECT nv.MNV, nv.HOTEN
      FROM   NHANVIEN  nv
      LEFT   JOIN TAIKHOAN tk ON tk.MNV = nv.MNV
      WHERE  nv.TT = 1
        AND  tk.MNV IS NULL
      ORDER  BY nv.HOTEN ASC
    `,
  );
}

// ─────────────────────────────────────────────
//  Kiểm tra nhân viên có thể tạo tài khoản không
//  (tồn tại + đang làm + chưa có tài khoản)
// ─────────────────────────────────────────────
async function canEmployeeCreateAccount(mnv) {
  const rows = await query(
    `
      SELECT nv.MNV
      FROM   NHANVIEN  nv
      LEFT   JOIN TAIKHOAN tk ON tk.MNV = nv.MNV
      WHERE  nv.MNV = ?
        AND  nv.TT  = 1
        AND  tk.MNV IS NULL
      LIMIT  1
    `,
    [Number(mnv)],
  );
  return rows.length > 0;
}

// ─────────────────────────────────────────────
//  Đếm số tài khoản có MNQ nhất định
//  — dùng để bảo vệ tài khoản admin cuối cùng
// ─────────────────────────────────────────────
async function countActiveAccountsByMnq(mnq) {
  const rows = await query(
    `
      SELECT COUNT(*) AS CNT
      FROM   TAIKHOAN
      WHERE  MNQ = ? AND TRANGTHAI = 1
    `,
    [Number(mnq)],
  );
  return Number(rows[0]?.CNT || 0);
}

// ─────────────────────────────────────────────
//  Tạo tài khoản mới
// ─────────────────────────────────────────────
async function createAccount(payload) {
  await query(
    `
      INSERT INTO TAIKHOAN (MNV, TDN, MK, MNQ, TRANGTHAI)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      Number(payload.mnv),
      String(payload.username).trim(),
      String(payload.passwordHash),
      Number(payload.mnq),
      Number(payload.status),
    ],
  );
}

// ─────────────────────────────────────────────
//  Cập nhật tài khoản (nhóm quyền / trạng thái / mật khẩu)
// ─────────────────────────────────────────────
async function updateAccountByEmployeeId(mnv, payload) {
  const updates = [];
  const params  = [];

  if (payload.mnq != null) {
    updates.push("MNQ = ?");
    params.push(Number(payload.mnq));
  }

  if (payload.status != null) {
    updates.push("TRANGTHAI = ?");
    params.push(Number(payload.status));
  }

  if (payload.passwordHash) {
    updates.push("MK = ?");
    params.push(String(payload.passwordHash));
  }

  if (updates.length === 0) return;

  params.push(Number(mnv));

  await query(
    `UPDATE TAIKHOAN SET ${updates.join(", ")} WHERE MNV = ?`,
    params,
  );
}

// ─────────────────────────────────────────────
//  Xóa tài khoản
// ─────────────────────────────────────────────
async function deleteAccountByEmployeeId(mnv) {
  await query(
    `DELETE FROM TAIKHOAN WHERE MNV = ?`,
    [Number(mnv)],
  );
}

// ─────────────────────────────────────────────
//  Export — định nghĩa SAU tất cả các hàm
// ─────────────────────────────────────────────
module.exports = {
  findByUsername,
  findById,
  listPermissionsByGroup,
  updateProfileById,
  updatePasswordById,
  listAccounts,
  listRoleGroups,
  listEmployeesWithoutAccount,
  canEmployeeCreateAccount,
  countActiveAccountsByMnq,
  createAccount,
  updateAccountByEmployeeId,
  deleteAccountByEmployeeId,
};