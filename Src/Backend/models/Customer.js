const { query } = require("../config/db");

function getExecutor(connection = null) {
  return (
    connection || {
      execute: (sql, params) => query(sql, params).then((rows) => [rows]),
    }
  );
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

async function listAll() {
  return query(
    `
      SELECT
        MKH,
        HOTEN,
        NGAYTHAMGIA,
        DIACHI,
        SDT,
        EMAIL,
        TT
      FROM KHACHHANG
      ORDER BY MKH DESC
    `,
  );
}

async function createCustomer(payload, connection = null) {
  const executor = getExecutor(connection);

  const [result] = await executor.execute(
    `
      INSERT INTO KHACHHANG (HOTEN, NGAYTHAMGIA, DIACHI, SDT, EMAIL, TT)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      payload.name,
      normalizeDate(payload.joinDate),
      payload.address || null,
      payload.phone || null,
      payload.email || null,
      Number(payload.status ?? 1),
    ],
  );

  return Number(result.insertId || 0);
}

async function updateCustomer(customerId, payload, connection = null) {
  const executor = getExecutor(connection);

  await executor.execute(
    `
      UPDATE KHACHHANG
      SET HOTEN = ?, NGAYTHAMGIA = ?, DIACHI = ?, SDT = ?, EMAIL = ?, TT = ?
      WHERE MKH = ?
    `,
    [
      payload.name,
      normalizeDate(payload.joinDate),
      payload.address || null,
      payload.phone || null,
      payload.email || null,
      Number(payload.status ?? 1),
      Number(customerId),
    ],
  );
}

async function softDeleteCustomer(customerId) {
  await query(
    `
      UPDATE KHACHHANG
      SET TT = 0
      WHERE MKH = ?
    `,
    [Number(customerId)],
  );
}

module.exports = {
  listAll,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
};
