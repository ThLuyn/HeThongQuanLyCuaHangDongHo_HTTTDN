const { query } = require("../config/db");

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
        nq.TEN AS TENNHOMQUYEN
      FROM TAIKHOAN tk
      INNER JOIN NHANVIEN nv ON nv.MNV = tk.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      WHERE tk.MNV = ?
      LIMIT 1
    `,
    [mnv],
  );

  return rows[0] || null;
}

module.exports = {
  findByUsername,
  findById,
};
