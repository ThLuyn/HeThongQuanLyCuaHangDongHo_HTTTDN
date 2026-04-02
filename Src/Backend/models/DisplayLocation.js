const { query } = require("../config/db");

function getExecutor(connection = null) {
  if (connection) {
    return connection;
  }

  return {
    execute: (sql, params) => query(sql, params).then((rows) => [rows]),
  };
}

async function listAll() {
  return query(
    `
      SELECT
        VT.MVT,
        VT.TEN,
        VT.GHICHU,
        COUNT(SP.MSP) AS PRODUCT_COUNT
      FROM VITRITRUNGBAY VT
      LEFT JOIN SANPHAM SP ON SP.MVT = VT.MVT
      GROUP BY VT.MVT, VT.TEN, VT.GHICHU
      ORDER BY MVT DESC
    `,
  );
}

async function createDisplayLocation(payload) {
  const result = await query(
    `
      INSERT INTO VITRITRUNGBAY (TEN, GHICHU)
      VALUES (?, ?)
    `,
    [payload.name, payload.note || null],
  );

  return Number(result.insertId || 0);
}

async function updateDisplayLocation(locationId, payload) {
  await query(
    `
      UPDATE VITRITRUNGBAY
      SET TEN = ?, GHICHU = ?
      WHERE MVT = ?
    `,
    [payload.name, payload.note || null, Number(locationId)],
  );
}

async function deleteDisplayLocation(locationId) {
  const executor = getExecutor();

  await executor.execute(
    `
      DELETE FROM VITRITRUNGBAY
      WHERE MVT = ?
    `,
    [Number(locationId)],
  );
}

async function deleteDisplayLocationWithConnection(connection, locationId) {
  const executor = getExecutor(connection);

  await executor.execute(
    `
      DELETE FROM VITRITRUNGBAY
      WHERE MVT = ?
    `,
    [Number(locationId)],
  );
}

async function countActiveProductsByLocation(locationId) {
  const rows = await query(
    `
      SELECT COUNT(*) AS TOTAL
      FROM SANPHAM
      WHERE MVT = ?
        AND TT = 1
    `,
    [Number(locationId)],
  );

  return Number(rows[0]?.TOTAL || 0);
}

async function clearInactiveProductsLocation(connection, locationId) {
  const executor = getExecutor(connection);

  await executor.execute(
    `
      UPDATE SANPHAM
      SET MVT = NULL
      WHERE MVT = ?
        AND TT <> 1
    `,
    [Number(locationId)],
  );
}

module.exports = {
  listAll,
  createDisplayLocation,
  updateDisplayLocation,
  deleteDisplayLocation,
  deleteDisplayLocationWithConnection,
  countActiveProductsByLocation,
  clearInactiveProductsLocation,
};
