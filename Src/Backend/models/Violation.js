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
       v.GHICHU as description,
       pcl.NGAY as violationDate
     FROM VIPHAM v
     LEFT JOIN PHANCALAM pcl ON pcl.MPCL = v.MPCL
     WHERE v.MNV = ? AND v.THANG = ? AND v.NAM = ?
     ORDER BY pcl.NGAY ASC, v.MVP ASC`,
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

/**
 * Xóa vi phạm theo MVP, đồng thời cập nhật BANGLUONG.KHAUTRU_KHAC
 */
async function deleteViolation(mvp) {
  const rows = await query(
    `SELECT MNV, TIEN_PHAT, THANG, NAM FROM VIPHAM WHERE MVP = ? LIMIT 1`,
    [mvp],
  );
  if (!rows || rows.length === 0) throw Object.assign(new Error("Không tìm thấy vi phạm"), { statusCode: 404 });

  const { MNV: mnv, TIEN_PHAT: penalty, THANG: month, NAM: year } = rows[0];

  await query(`DELETE FROM VIPHAM WHERE MVP = ?`, [mvp]);
  await syncKhauTruKhac(mnv, month, year, -Number(penalty || 0));
}

/**
 * Cập nhật loại vi phạm và tiền phạt theo MVP
 */
async function updateViolation(mvp, { loai, tienPhat, ghiChu }) {
  const rows = await query(
    `SELECT MNV, TIEN_PHAT, THANG, NAM FROM VIPHAM WHERE MVP = ? LIMIT 1`,
    [mvp],
  );
  if (!rows || rows.length === 0) throw Object.assign(new Error("Không tìm thấy vi phạm"), { statusCode: 404 });

  const { MNV: mnv, TIEN_PHAT: oldPenalty, THANG: month, NAM: year } = rows[0];
  const delta = Number(tienPhat) - Number(oldPenalty || 0);

  await query(
    `UPDATE VIPHAM SET LOAI = ?, TIEN_PHAT = ?, GHICHU = ? WHERE MVP = ?`,
    [loai, tienPhat, ghiChu || null, mvp],
  );
  await syncKhauTruKhac(mnv, month, year, delta);
}

/**
 * Hàm nội bộ: cộng delta vào KHAUTRU_KHAC + tính lại LUONGTHUCLANH
 */
async function syncKhauTruKhac(mnv, month, year, delta) {
  if (delta === 0) return;

  const salRows = await query(
    `SELECT MBL, LUONGCOBAN, BHXH, BHYT, BHTN, HOA_HONG, KHAUTRU_KHAC
     FROM BANGLUONG WHERE MNV = ? AND THANG = ? AND NAM = ? LIMIT 1`,
    [mnv, month, year],
  );
  if (!salRows || salRows.length === 0) return;

  const s = salRows[0];

  // Ngày công quy đổi
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd   = new Date(year, month, 0).toISOString().slice(0, 10);

  const [wdRows, ulRows, hlRows] = await Promise.all([
    query(
      `SELECT COUNT(DISTINCT NGAY) AS D FROM PHANCALAM
       WHERE MNV=? AND TT=2 AND DAYOFWEEK(NGAY)<>1 AND MONTH(NGAY)=? AND YEAR(NGAY)=?`,
      [mnv, month, year],
    ),
    query(
      `SELECT COUNT(DISTINCT NGAYNGHI) AS D FROM DONXINNGH
       WHERE MNV=? AND TRANGTHAI=1 AND LOAI=1
         AND NGAYNGHI>=? AND COALESCE(NGAYKETTHUC,NGAYNGHI)<=?`,
      [mnv, monthStart, monthEnd],
    ),
    query(
      `SELECT SUM(GREATEST(COALESCE(nl.HESO_LUONG,1)-1,0)) AS D
       FROM PHANCALAM p INNER JOIN NGAYLE nl ON nl.NGAY=p.NGAY
       WHERE p.MNV=? AND p.TT=2 AND DAYOFWEEK(p.NGAY)<>1 AND MONTH(p.NGAY)=? AND YEAR(p.NGAY)=?`,
      [mnv, month, year],
    ),
  ]);

  const wd   = Number(wdRows?.[0]?.D  || 0);
  const ul   = Number(ulRows?.[0]?.D  || 0);
  const hl   = Number(hlRows?.[0]?.D  || 0);
  const days = Math.max(0, wd - ul) + hl;

  const baseSalary  = Number(s.LUONGCOBAN || 0);
  const commission  = Number(s.HOA_HONG   || 0);
  const bhxh = Number(s.BHXH || 0);
  const bhyt = Number(s.BHYT || 0);
  const bhtn = Number(s.BHTN || 0);
  const newKT = Math.max(0, Number(s.KHAUTRU_KHAC || 0) + delta);
  const newTake = (baseSalary / 26) * days + commission - (bhxh + bhyt + bhtn + newKT);

  await query(
    `UPDATE BANGLUONG SET KHAUTRU_KHAC=?, LUONGTHUCLANH=? WHERE MBL=?`,
    [newKT, newTake, s.MBL],
  );
}

module.exports = {
  getViolationsByEmployeeAndMonth,
  deleteViolation,
  updateViolation,
};