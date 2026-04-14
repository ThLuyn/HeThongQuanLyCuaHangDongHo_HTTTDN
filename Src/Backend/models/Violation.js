const { query } = require("../config/db");

/**
 * Get violation records for an employee in a given month/year
 * @param {number} mnv - Employee ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g. 2024)
 * @returns {Promise<Array>} Array of violation records
 */
async function getViolationsByEmployeeAndMonth(mnv, month, year) {
  const rows = await query(
    `SELECT 
       v.MVP as id, 
       v.MNV as mnv, 
       v.MPCL as shiftId, 
       v.LOAI as violationTypeCode,
       v.PHUT_VIPHAM as minutes, 
       v.TIEN_PHAT as penaltyAmount, 
       v.THANG as month, 
       v.NAM as year, 
       v.GHICHU as description
     FROM VIPHAM v
     WHERE v.MNV = ? AND v.THANG = ? AND v.NAM = ?
     ORDER BY v.MVP ASC`,
    [mnv, month, year],
  );

  // Map loại vi phạm từ code
  return (rows || []).map((row) => ({
    ...row,
    violationType: mapViolationType(row.violationTypeCode),
  }));
}

function mapViolationType(code) {
  const typeMap = {
    1: "Đi trễ",
    2: "Về sớm",
    3: "Đi trễ và về sớm",
  };
  return typeMap[code] || `Loại ${code}`;
}

module.exports = {
  getViolationsByEmployeeAndMonth,
};
