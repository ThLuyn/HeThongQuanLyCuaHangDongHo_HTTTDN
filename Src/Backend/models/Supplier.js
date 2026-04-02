const { query } = require("../config/db");

function getExecutor(connection = null) {
  return (
    connection || {
      execute: (sql, params) => query(sql, params).then((rows) => [rows]),
    }
  );
}

function normalizeBrands(brands) {
  if (!Array.isArray(brands)) {
    return [];
  }
  return Array.from(
    new Set(
      brands
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0),
    ),
  );
}

async function ensureSupplierBrandTable(executor) {
  await executor.execute(
    `
      CREATE TABLE IF NOT EXISTS NHACUNGCAP_THUONGHIEU (
        ID INT(11) NOT NULL AUTO_INCREMENT,
        MNCC INT(11) NOT NULL,
        THUONGHIEU VARCHAR(100) NOT NULL,
        PRIMARY KEY (ID),
        UNIQUE KEY UK_NCC_THUONGHIEU (MNCC, THUONGHIEU),
        CONSTRAINT FK_NCC_THUONGHIEU_MNCC
          FOREIGN KEY (MNCC) REFERENCES NHACUNGCAP(MNCC)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `,
    [],
  );
}

async function replaceSupplierBrands(executor, supplierId, brands) {
  await ensureSupplierBrandTable(executor);

  await executor.execute(
    `
      DELETE FROM NHACUNGCAP_THUONGHIEU
      WHERE MNCC = ?
    `,
    [Number(supplierId)],
  );

  const normalizedBrands = normalizeBrands(brands);
  for (const brand of normalizedBrands) {
    await executor.execute(
      `
        INSERT INTO NHACUNGCAP_THUONGHIEU (MNCC, THUONGHIEU)
        VALUES (?, ?)
      `,
      [Number(supplierId), brand],
    );
  }
}

async function listAll() {
  const executor = getExecutor();
  await ensureSupplierBrandTable(executor);

  return query(
    `
      SELECT
        ncc.MNCC,
        ncc.TEN,
        ncc.DIACHI,
        ncc.SDT,
        ncc.EMAIL,
        ncc.TT,
        GROUP_CONCAT(nct.THUONGHIEU ORDER BY nct.THUONGHIEU SEPARATOR ' | ') AS THUONGHIEU_CUNG_CAP
      FROM NHACUNGCAP ncc
      LEFT JOIN NHACUNGCAP_THUONGHIEU nct ON nct.MNCC = ncc.MNCC
      GROUP BY ncc.MNCC, ncc.TEN, ncc.DIACHI, ncc.SDT, ncc.EMAIL, ncc.TT
      ORDER BY MNCC DESC
    `,
  );
}

async function createSupplier(payload, connection = null) {
  const executor = getExecutor(connection);
  await ensureSupplierBrandTable(executor);

  const [result] = await executor.execute(
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

  const supplierId = Number(result.insertId || 0);
  await replaceSupplierBrands(executor, supplierId, payload.brands);
  return supplierId;
}

async function updateSupplier(supplierId, payload, connection = null) {
  const executor = getExecutor(connection);
  await ensureSupplierBrandTable(executor);

  await executor.execute(
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

  await replaceSupplierBrands(executor, supplierId, payload.brands);
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
