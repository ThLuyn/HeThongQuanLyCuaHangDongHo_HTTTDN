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
  listPermissionsByGroup,
  updateProfileById,
  updatePasswordById,
  listAccounts,
  listRoleGroups,
  listEmployeesWithoutAccount,
  createAccount,
  updateAccountByEmployeeId,
  deleteAccountByEmployeeId,
};

async function listPermissionsByGroup(mnq) {
  return query(
    `
      SELECT ct.MCN, ct.HANHDONG
      FROM CTQUYEN ct
      INNER JOIN NHOMQUYEN nq ON nq.MNQ = ct.MNQ
      INNER JOIN DANHMUCCHUCNANG d ON d.MCN = ct.MCN
      WHERE ct.MNQ = ? AND nq.TT = 1 AND d.TT = 1
      ORDER BY ct.MCN ASC, ct.HANHDONG ASC
    `,
    [Number(mnq)],
  );
}

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
      INNER JOIN NHANVIEN nv ON nv.MNV = tk.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      ORDER BY tk.MNV DESC
    `,
  );
}

async function listRoleGroups() {
  return query(
    `
      SELECT MNQ, TEN
      FROM NHOMQUYEN
      WHERE TT = 1
      ORDER BY MNQ ASC
    `,
  );
}

async function listEmployeesWithoutAccount() {
  return query(
    `
      SELECT
        nv.MNV,
        nv.HOTEN
      FROM NHANVIEN nv
      LEFT JOIN TAIKHOAN tk ON tk.MNV = nv.MNV
      WHERE nv.TT = 1 AND tk.MNV IS NULL
      ORDER BY nv.HOTEN ASC
    `,
  );
}

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

async function updateAccountByEmployeeId(mnv, payload) {
  const updates = [];
  const params = [];

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

  if (updates.length === 0) {
    return;
  }

  params.push(Number(mnv));

  await query(
    `
      UPDATE TAIKHOAN
      SET ${updates.join(", ")}
      WHERE MNV = ?
    `,
    params,
  );
}

async function deleteAccountByEmployeeId(mnv) {
  await query(
    `
      DELETE FROM TAIKHOAN
      WHERE MNV = ?
    `,
    [Number(mnv)],
  );
}
