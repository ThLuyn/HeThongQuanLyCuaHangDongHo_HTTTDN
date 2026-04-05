const { query, withTransaction } = require("../config/db");

async function listPermissionGroups() {
  return query(
    `
      SELECT
        nq.MNQ,
        nq.TEN,
        nq.TT
      FROM NHOMQUYEN nq
      ORDER BY nq.MNQ ASC
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

async function listFeatureCatalog() {
  return query(
    `
      SELECT MCN, TEN
      FROM DANHMUCCHUCNANG
      WHERE TT = 1
      ORDER BY MCN ASC
    `,
  );
}

async function listGroupPermissions(mnq) {
  return query(
    `
      SELECT MCN, HANHDONG
      FROM CTQUYEN
      WHERE MNQ = ?
      ORDER BY MCN ASC, HANHDONG ASC
    `,
    [Number(mnq)],
  );
}

async function createPermissionGroup(payload) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute(
      `
        INSERT INTO NHOMQUYEN (TEN, TT)
        VALUES (?, 1)
      `,
      [String(payload.roleName).trim()],
    );

    const mnq = Number(result.insertId);
    const rows = Array.isArray(payload.permissions) ? payload.permissions : [];

    for (const item of rows) {
      await connection.execute(
        `
          INSERT INTO CTQUYEN (MNQ, MCN, HANHDONG)
          VALUES (?, ?, ?)
        `,
        [mnq, String(item.mcn), String(item.hanhDong)],
      );
    }

    return mnq;
  });
}

async function updatePermissionGroup(mnq, payload) {
  return withTransaction(async (connection) => {
    await connection.execute(
      `
        UPDATE NHOMQUYEN
        SET TEN = ?
        WHERE MNQ = ?
      `,
      [String(payload.roleName).trim(), Number(mnq)],
    );

    const managedActions = Array.isArray(payload.managedActions)
      ? payload.managedActions
      : [];

    if (managedActions.length > 0) {
      const placeholders = managedActions.map(() => "?").join(", ");
      await connection.execute(
        `
          DELETE FROM CTQUYEN
          WHERE MNQ = ?
            AND HANHDONG IN (${placeholders})
        `,
        [Number(mnq), ...managedActions],
      );
    }

    const rows = Array.isArray(payload.permissions) ? payload.permissions : [];
    for (const item of rows) {
      await connection.execute(
        `
          INSERT INTO CTQUYEN (MNQ, MCN, HANHDONG)
          VALUES (?, ?, ?)
        `,
        [Number(mnq), String(item.mcn), String(item.hanhDong)],
      );
    }
  });
}

async function countAccountsByGroup(mnq) {
  const rows = await query(
    `
      SELECT COUNT(*) AS TOTAL
      FROM TAIKHOAN
      WHERE MNQ = ?
    `,
    [Number(mnq)],
  );
  return Number(rows[0]?.TOTAL || 0);
}

async function deletePermissionGroup(mnq) {
  await query(
    `
      UPDATE NHOMQUYEN
      SET TT = 0
      WHERE MNQ = ?
    `,
    [Number(mnq)],
  );
}

module.exports = {
  listPermissionGroups,
  listRoleGroups,
  listFeatureCatalog,
  listGroupPermissions,
  createPermissionGroup,
  updatePermissionGroup,
  countAccountsByGroup,
  deletePermissionGroup,
};
