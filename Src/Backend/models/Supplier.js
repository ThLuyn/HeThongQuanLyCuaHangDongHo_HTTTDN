const { query } = require("../config/db");

async function listAll() {
  return query(
    `
      SELECT MNCC, TEN, DIACHI, SDT, EMAIL, TT
      FROM NHACUNGCAP
      ORDER BY MNCC DESC
    `,
  );
}

async function createSupplier(payload) {
  const result = await query(
    `
      INSERT INTO NHACUNGCAP (TEN, DIACHI, SDT, EMAIL, TT)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      payload.name,
      payload.address || null,
      payload.phone || null,
      payload.email || null,
      Number(payload.status ?? 1),
    ],
  );

  return Number(result.insertId || 0);
}

async function updateSupplier(supplierId, payload) {
  await query(
    `
      UPDATE NHACUNGCAP
      SET TEN = ?, DIACHI = ?, SDT = ?, EMAIL = ?, TT = ?
      WHERE MNCC = ?
    `,
    [
      payload.name,
      payload.address || null,
      payload.phone || null,
      payload.email || null,
      Number(payload.status ?? 1),
      Number(supplierId),
    ],
  );
}

async function softDeleteSupplier(supplierId) {
  await query(
    `
      UPDATE NHACUNGCAP
      SET TT = 0
      WHERE MNCC = ?
    `,
    [Number(supplierId)],
  );
}

module.exports = {
  listAll,
  createSupplier,
  updateSupplier,
  softDeleteSupplier,
};
