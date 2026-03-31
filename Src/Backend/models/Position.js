const { query, withTransaction } = require("../config/db");

async function listAll() {
  return query(
    `
      SELECT
        MCV,
        TEN,
        LUONGCOBAN,
        TY_LE_HOA_HONG,
        TT
      FROM CHUCVU
      ORDER BY MCV ASC
    `,
  );
}

async function findById(id) {
  const rows = await query(
    `
      SELECT
        MCV,
        TEN,
        LUONGCOBAN,
        TY_LE_HOA_HONG,
        TT
      FROM CHUCVU
      WHERE MCV = ?
      LIMIT 1
    `,
    [Number(id)],
  );

  return rows[0] || null;
}

async function updateById(id, payload) {
  return query(
    `
      UPDATE CHUCVU
      SET
        LUONGCOBAN = ?,
        TY_LE_HOA_HONG = ?,
        TT = ?
      WHERE MCV = ?
    `,
    [
      Number(payload.baseSalary),
      Number(payload.commissionRate),
      Number(payload.status),
      Number(id),
    ],
  );
}

async function create(payload) {
  return query(
    `
      INSERT INTO CHUCVU (TEN, LUONGCOBAN, TY_LE_HOA_HONG, TT)
      VALUES (?, ?, ?, ?)
    `,
    [
      String(payload.positionName || "").trim(),
      Number(payload.baseSalary),
      Number(payload.commissionRate),
      Number(payload.status),
    ],
  );
}

async function listWorkHistory() {
  return query(
    `
      SELECT
        ls.MLS,
        ls.MNV,
        nv.HOTEN,
        ls.MCV_CU,
        cv_cu.TEN AS TENCHUCVU_CU,
        cv_cu.LUONGCOBAN AS LUONGCOBAN_CU,
        ls.MCV_MOI,
        cv_moi.TEN AS TENCHUCVU_MOI,
        cv_moi.LUONGCOBAN AS LUONGCOBAN_MOI,
        ls.NGAY_HIEULUC,
        ls.GHICHU,
        ls.MNV_DUYET,
        nv_duyet.HOTEN AS HOTEN_DUYET
      FROM LICHSUCHUCVU ls
      INNER JOIN NHANVIEN nv ON nv.MNV = ls.MNV
      LEFT JOIN CHUCVU cv_cu ON cv_cu.MCV = ls.MCV_CU
      LEFT JOIN CHUCVU cv_moi ON cv_moi.MCV = ls.MCV_MOI
      LEFT JOIN NHANVIEN nv_duyet ON nv_duyet.MNV = ls.MNV_DUYET
      ORDER BY ls.NGAY_HIEULUC DESC, ls.MLS DESC
    `,
  );
}

async function transferEmployeePosition(payload) {
  return withTransaction(async (connection) => {
    const employeeId = Number(payload.employeeId);
    const newPositionId = Number(payload.newPositionId);
    const effectiveDate = payload.effectiveDate;
    const note = payload.note || null;
    const approverId = Number(payload.approverId);

    const [employeeRows] = await connection.execute(
      `
        SELECT MNV, MCV
        FROM NHANVIEN
        WHERE MNV = ?
        LIMIT 1
      `,
      [employeeId],
    );

    if (!employeeRows || employeeRows.length === 0) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }

    const currentPositionId = Number(employeeRows[0].MCV);

    const [positionRows] = await connection.execute(
      `
        SELECT MCV
        FROM CHUCVU
        WHERE MCV = ?
        LIMIT 1
      `,
      [newPositionId],
    );

    if (!positionRows || positionRows.length === 0) {
      const error = new Error("New position not found");
      error.statusCode = 404;
      throw error;
    }

    await connection.execute(
      `
        UPDATE NHANVIEN
        SET MCV = ?
        WHERE MNV = ?
      `,
      [newPositionId, employeeId],
    );

    const [insertResult] = await connection.execute(
      `
        INSERT INTO LICHSUCHUCVU (MNV, MCV_CU, MCV_MOI, NGAY_HIEULUC, GHICHU, MNV_DUYET)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        employeeId,
        currentPositionId,
        newPositionId,
        effectiveDate,
        note,
        approverId,
      ],
    );

    return {
      historyId: Number(insertResult.insertId),
      previousPositionId: currentPositionId,
    };
  });
}

module.exports = {
  listAll,
  findById,
  updateById,
  create,
  listWorkHistory,
  transferEmployeePosition,
};
