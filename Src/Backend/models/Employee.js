const { query, withTransaction } = require("../config/db");

function isManagerLikeRole(roleName) {
  const value = String(roleName || "").toLowerCase();
  return (
    value.includes("manager") ||
    value.includes("quản lý") ||
    value.includes("quan ly")
  );
}

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function toDateOnly(value) {
  const text = String(value || "").slice(0, 10);
  if (!text) {
    return null;
  }
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countNonSundayDaysInRange(startDate, endDate) {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!start || !end || end < start) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    // JS getDay: 0=Sunday, 1..6=Mon..Sat
    if (cursor.getDay() !== 0) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

function countNonSundayOverlapDays(startDate, endDate, rangeStart, rangeEnd) {
  const leaveStart = toDateOnly(startDate);
  const leaveEnd = toDateOnly(endDate);
  const periodStart = toDateOnly(rangeStart);
  const periodEnd = toDateOnly(rangeEnd);

  if (!leaveStart || !leaveEnd || !periodStart || !periodEnd) {
    return 0;
  }

  const overlapStart = leaveStart > periodStart ? leaveStart : periodStart;
  const overlapEnd = leaveEnd < periodEnd ? leaveEnd : periodEnd;
  return countNonSundayDaysInRange(overlapStart, overlapEnd);
}

async function listAll() {
  return query(
    `
      SELECT
        nv.MNV,
        nv.HOTEN,
        nv.GIOITINH,
        nv.NGAYSINH,
        nv.SDT,
        nv.EMAIL,
        nv.TT,
        cv.MCV,
        cv.TEN AS TENCHUCVU,
        cv.LUONGCOBAN,
        cv.TY_LE_HOA_HONG,
        COALESCE(
          (
            SELECT MAX(COALESCE(dxn.NGAY_NGHIVIEC, dxn.NGAYNGHI))
            FROM DONXINNGH dxn
            WHERE dxn.MNV = nv.MNV
              AND dxn.LOAI = 3
              AND dxn.TRANGTHAI = 1
          ),
          (
            SELECT MAX(COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI))
            FROM DONXINNGH dxn
            WHERE dxn.MNV = nv.MNV
              AND dxn.TRANGTHAI = 1
          )
        ) AS NGAYNGHIVIEC
      FROM NHANVIEN nv
      INNER JOIN CHUCVU cv ON cv.MCV = nv.MCV
      ORDER BY nv.MNV DESC
    `,
  );
}

async function findById(mnv) {
  const rows = await query(
    `
      SELECT
        nv.MNV,
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
        nv.SOTAIKHOAN,
        nv.TENNGANHANG,
        COALESCE(
          (
            SELECT MAX(COALESCE(dxn.NGAY_NGHIVIEC, dxn.NGAYNGHI))
            FROM DONXINNGH dxn
            WHERE dxn.MNV = nv.MNV
              AND dxn.LOAI = 3
              AND dxn.TRANGTHAI = 1
          ),
          (
            SELECT MAX(COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI))
            FROM DONXINNGH dxn
            WHERE dxn.MNV = nv.MNV
              AND dxn.TRANGTHAI = 1
          )
        ) AS NGAYNGHIVIEC,
        cv.TEN AS TENCHUCVU,
        cv.LUONGCOBAN,
        cv.TY_LE_HOA_HONG,
        tk.TDN,
        tk.TRANGTHAI AS TRANGTHAI_TAIKHOAN,
        nq.TEN AS TENNHOMQUYEN
      FROM NHANVIEN nv
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      LEFT JOIN TAIKHOAN tk ON tk.MNV = nv.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      WHERE nv.MNV = ?
      LIMIT 1
    `,
    [Number(mnv)],
  );

  return rows[0] || null;
}

async function listLeaveRequests(status) {
  const params = [];
  let whereClause = "";

  if (status !== undefined) {
    whereClause = "WHERE dxn.TRANGTHAI = ?";
    params.push(Number(status));
  }

  const rows = await query(
    `
      SELECT
        dxn.MDN,
        dxn.MNV,
        nv.HOTEN,
        dxn.LOAI,
        dxn.NGAYNGHI,
        dxn.NGAYKETTHUC,
        dxn.NGAY_NGHIVIEC,
        dxn.LYDO,
        dxn.MINHCHUNG,
        dxn.TRANGTHAI,
        dxn.NGUOIDUYET,
        dxn.NGAYTAO,
        dxn.GHICHU
      FROM DONXINNGH dxn
      INNER JOIN NHANVIEN nv ON nv.MNV = dxn.MNV
      ${whereClause}
      ORDER BY dxn.MDN DESC
    `,
    params,
  );

  return rows.map((row) => {
    const endDate =
      Number(row.LOAI) === 3
        ? row.NGAY_NGHIVIEC || row.NGAYNGHI
        : row.NGAYKETTHUC || row.NGAYNGHI;
    const songay = Math.max(
      countNonSundayDaysInRange(row.NGAYNGHI, endDate),
      1,
    );
    return { ...row, SONGAY: songay };
  });
}

async function listMyLeaveRequests(mnv) {
  const rows = await query(
    `
      SELECT
        dxn.MDN,
        dxn.MNV,
        nv.HOTEN,
        dxn.LOAI,
        dxn.NGAYNGHI,
        dxn.NGAYKETTHUC,
        dxn.NGAY_NGHIVIEC,
        dxn.LYDO,
        dxn.MINHCHUNG,
        dxn.TRANGTHAI,
        dxn.NGUOIDUYET,
        dxn.NGAYTAO,
        dxn.GHICHU
      FROM DONXINNGH dxn
      INNER JOIN NHANVIEN nv ON nv.MNV = dxn.MNV
      WHERE dxn.MNV = ?
      ORDER BY dxn.MDN DESC
    `,
    [Number(mnv)],
  );

  return rows.map((row) => {
    const endDate =
      Number(row.LOAI) === 3
        ? row.NGAY_NGHIVIEC || row.NGAYNGHI
        : row.NGAYKETTHUC || row.NGAYNGHI;
    const songay = Math.max(
      countNonSundayDaysInRange(row.NGAYNGHI, endDate),
      1,
    );
    return { ...row, SONGAY: songay };
  });
}

async function hasLeaveOverlap(mnv, startDate, endDate) {
  const rows = await query(
    `
      SELECT dxn.MDN
      FROM DONXINNGH dxn
      WHERE dxn.MNV = ?
        AND dxn.TRANGTHAI IN (0, 1)
        AND dxn.NGAYNGHI <= ?
        AND (
          CASE
            WHEN dxn.LOAI = 3 THEN COALESCE(dxn.NGAY_NGHIVIEC, dxn.NGAYNGHI)
            ELSE COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI)
          END
        ) >= ?
      LIMIT 1
    `,
    [Number(mnv), endDate, startDate],
  );

  return rows.length > 0;
}

async function getAnnualLeaveBalance(mnv, startDate) {
  const requestYear = new Date(startDate).getFullYear();
  const currentYear = new Date().getFullYear();

  if (requestYear === currentYear) {
    try {
      const rows = await query(
        `
          SELECT TongQuyPhep, SoNgayDaNghi, NgayPhepConLai
          FROM View_ThongKeNgayPhep
          WHERE MNV = ?
          LIMIT 1
        `,
        [Number(mnv)],
      );

      const row = rows[0] || {};
      return {
        quota: Number(row.TongQuyPhep || 12),
        used: Number(row.SoNgayDaNghi || 0),
        remaining: Math.max(0, Number(row.NgayPhepConLai ?? 12)),
      };
    } catch (err) {
      // Fallback when the view does not exist (e.g., DB schema not imported).
      // Compute used days from DONXINNGH for the current year as a best-effort.
      const fallbackRows = await query(
        `
          SELECT dxn.NGAYNGHI, COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) AS NGAYKETTHUC
          FROM DONXINNGH dxn
          WHERE dxn.MNV = ?
            AND dxn.LOAI = 0
            AND dxn.TRANGTHAI = 1
            AND YEAR(dxn.NGAYNGHI) = ?
        `,
        [Number(mnv), Number(requestYear)],
      );

      const used = fallbackRows.reduce(
        (sum, r) =>
          sum + Math.max(countNonSundayDaysInRange(r.NGAYNGHI, r.NGAYKETTHUC), 1),
        0,
      );
      const quota = 12;
      return {
        quota,
        used,
        remaining: Math.max(0, quota - used),
      };
    }
  }

  const leaveRows = await query(
    `
      SELECT dxn.NGAYNGHI, COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) AS NGAYKETTHUC
      FROM DONXINNGH dxn
      WHERE dxn.MNV = ?
        AND dxn.LOAI = 0
        AND dxn.TRANGTHAI = 1
        AND YEAR(dxn.NGAYNGHI) = ?
    `,
    [Number(mnv), Number(requestYear)],
  );

  const used = leaveRows.reduce(
    (sum, r) =>
      sum + Math.max(countNonSundayDaysInRange(r.NGAYNGHI, r.NGAYKETTHUC), 1),
    0,
  );
  const quota = 12;

  return {
    quota,
    used,
    remaining: Math.max(0, quota - used),
  };
}

async function createLeaveRequest(mnv, payload) {
  return query(
    `
      INSERT INTO DONXINNGH (MNV, LOAI, NGAYNGHI, NGAYKETTHUC, NGAY_NGHIVIEC, LYDO, MINHCHUNG, TRANGTHAI, NGAYTAO)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_DATE)
    `,
    [
      Number(mnv),
      Number(payload.type),
      payload.startDate,
      Number(payload.type) === 3 ? null : payload.endDate,
      Number(payload.type) === 3
        ? payload.resignationDate || payload.startDate
        : null,
      String(payload.reason || "").trim() || null,
      String(payload.evidencePath || "").trim() || null,
    ],
  );
}

async function approveLeaveRequest(id, status, reviewerId, note) {
  return query(
    `
      UPDATE DONXINNGH
      SET TRANGTHAI = ?, NGUOIDUYET = ?, GHICHU = ?
      WHERE MDN = ?
    `,
    [Number(status), reviewerId, note || null, Number(id)],
  );
}

async function getPayrollByMonth(month, year) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  const monthStart = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
  const monthEnd = new Date(yearNum, monthNum, 0).toISOString().slice(0, 10);

  const payrollRows = await query(
    `
      SELECT
        bl.MBL,
        bl.MNV,
        nv.HOTEN,
        cv.TEN AS TENCHUCVU,
        COALESCE(nq.TEN, '') AS TENNHOMQUYEN,
        bl.THANG,
        bl.NAM,
        bl.LUONGCOBAN,
        bl.NGAYCONG AS NGAYCONG_LUU,
        COALESCE(wd.SO_NGAY_CONG_THUC_TE, bcc.NGAYCONG, bl.NGAYCONG, 0) AS NGAYCONG_THUCTE,
        COALESCE(bcc.NGAYNGHI_KP, 0) AS NGAYNGHI_KP_BCC,
        COALESCE(hs.SO_NGAY_LE_DI_LAM, 0) AS SO_NGAY_LE_DI_LAM,
        COALESCE(hs.NGAYCONG_LE_QUYDOI_THEM, 0) AS NGAYCONG_LE_QUYDOI_THEM,
        bl.DOANH_SO,
        bl.TY_LE_HOA_HONG,
        bl.HOA_HONG,
        bl.BHXH,
        bl.BHYT,
        bl.BHTN,
        bl.KHAUTRU_KHAC,
        0 AS THUONG,
        bl.HOA_HONG AS PHUCAP,
        (bl.BHXH + bl.BHYT + bl.BHTN + bl.KHAUTRU_KHAC) AS KHAUTRU,
        bl.LUONGTHUCLANH,
        bl.TT
      FROM BANGLUONG bl
      INNER JOIN NHANVIEN nv ON nv.MNV = bl.MNV
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      LEFT JOIN TAIKHOAN tk ON tk.MNV = bl.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      LEFT JOIN BANGCHAMCONG bcc ON bcc.MNV = bl.MNV AND bcc.THANG = bl.THANG AND bcc.NAM = bl.NAM
      LEFT JOIN (
        SELECT
          p.MNV,
          MONTH(p.NGAY) AS THANG,
          YEAR(p.NGAY) AS NAM,
          COUNT(DISTINCT p.NGAY) AS SO_NGAY_CONG_THUC_TE
        FROM PHANCALAM p
        WHERE p.TT = 2
          AND DAYOFWEEK(p.NGAY) <> 1
        GROUP BY p.MNV, MONTH(p.NGAY), YEAR(p.NGAY)
      ) wd ON wd.MNV = bl.MNV AND wd.THANG = bl.THANG AND wd.NAM = bl.NAM
      LEFT JOIN (
        SELECT
          day_logs.MNV,
          MONTH(day_logs.NGAY) AS THANG,
          YEAR(day_logs.NGAY) AS NAM,
          COUNT(*) AS SO_NGAY_LE_DI_LAM,
          SUM(GREATEST(COALESCE(day_logs.HESO_LUONG, 1) - 1, 0)) AS NGAYCONG_LE_QUYDOI_THEM
        FROM (
          SELECT DISTINCT p.MNV, p.NGAY, nl.HESO_LUONG
          FROM PHANCALAM p
          INNER JOIN NGAYLE nl ON nl.NGAY = p.NGAY
          WHERE p.TT = 2
            AND DAYOFWEEK(p.NGAY) <> 1
        ) day_logs
        GROUP BY day_logs.MNV, MONTH(day_logs.NGAY), YEAR(day_logs.NGAY)
      ) hs ON hs.MNV = bl.MNV AND hs.THANG = bl.THANG AND hs.NAM = bl.NAM
      WHERE bl.THANG = ? AND bl.NAM = ?
      ORDER BY bl.MNV ASC
    `,
    [monthNum, yearNum],
  );

  const [
    totalRevenueRows,
    personalRevenueRows,
    annualLeaveRows,
    unpaidLeaveRows,
  ] = await Promise.all([
    query(
      `
        SELECT COALESCE(SUM(px.TIEN), 0) AS TONG_DOANH_SO
        FROM PHIEUXUAT px
        WHERE px.TT = 1 AND MONTH(px.TG) = ? AND YEAR(px.TG) = ?
      `,
      [monthNum, yearNum],
    ),
    query(
      `
        SELECT px.MNV, COALESCE(SUM(px.TIEN), 0) AS DOANH_SO_CANHAN
        FROM PHIEUXUAT px
        WHERE px.TT = 1 AND MONTH(px.TG) = ? AND YEAR(px.TG) = ? AND px.MNV IS NOT NULL
        GROUP BY px.MNV
      `,
      [monthNum, yearNum],
    ),
    query(
      `
        SELECT
          dxn.MNV,
          dxn.NGAYNGHI,
          COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) AS NGAYKETTHUC
        FROM DONXINNGH dxn
        WHERE dxn.TRANGTHAI = 1
          AND dxn.LOAI = 0
          AND YEAR(dxn.NGAYNGHI) = ?
          AND MONTH(dxn.NGAYNGHI) <= ?
      `,
      [yearNum, monthNum],
    ),
    query(
      `
        SELECT
          dxn.MNV,
          dxn.NGAYNGHI,
          COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) AS NGAYKETTHUC
        FROM DONXINNGH dxn
        WHERE dxn.TRANGTHAI = 1
          AND dxn.LOAI = 1
          AND dxn.NGAYNGHI <= ?
          AND COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) >= ?
      `,
      [monthEnd, monthStart],
    ),
  ]);

  const totalRevenue = Number(totalRevenueRows[0]?.TONG_DOANH_SO || 0);
  const personalRevenueMap = new Map(
    personalRevenueRows.map((row) => [
      Number(row.MNV),
      Number(row.DOANH_SO_CANHAN || 0),
    ]),
  );
  const annualLeaveMap = annualLeaveRows.reduce((acc, row) => {
    const mnv = Number(row.MNV);
    const days = Math.max(
      countNonSundayDaysInRange(row.NGAYNGHI, row.NGAYKETTHUC),
      1,
    );
    acc.set(mnv, (acc.get(mnv) || 0) + days);
    return acc;
  }, new Map());
  const unpaidLeaveMap = unpaidLeaveRows.reduce((acc, row) => {
    const mnv = Number(row.MNV);
    const overlapDays = countNonSundayOverlapDays(
      row.NGAYNGHI,
      row.NGAYKETTHUC,
      monthStart,
      monthEnd,
    );
    acc.set(mnv, Number(acc.get(mnv) || 0) + overlapDays);
    return acc;
  }, new Map());

  return payrollRows.map((row) => {
    const revenue = isManagerLikeRole(row.TENNHOMQUYEN)
      ? totalRevenue
      : Number(personalRevenueMap.get(Number(row.MNV)) || 0);
    const commissionRate = Number(row.TY_LE_HOA_HONG || 0);
    const commission = toMoney(revenue * (commissionRate / 100));
    const workDaysRawBeforeLeave = Number(
      row.NGAYCONG_THUCTE ?? row.NGAYCONG_LUU ?? 0,
    );
    const unpaidLeaveDaysFromLeaveRequest = Number(
      unpaidLeaveMap.get(Number(row.MNV)) || 0,
    );
    const unpaidLeaveDaysFromBcc = Number(row.NGAYNGHI_KP_BCC || 0);
    const unpaidLeaveDays = Math.max(
      unpaidLeaveDaysFromLeaveRequest,
      unpaidLeaveDaysFromBcc,
    );
    const workDaysRaw = Math.max(
      0,
      toMoney(workDaysRawBeforeLeave - unpaidLeaveDays),
    );
    const holidayExtraDays = Number(row.NGAYCONG_LE_QUYDOI_THEM || 0);
    const workDaysConverted = toMoney(workDaysRaw + holidayExtraDays);
    const leaveUsed = Number(annualLeaveMap.get(Number(row.MNV)) || 0);
    const leaveRemaining = Math.max(0, 12 - leaveUsed);
    const deduction =
      Number(row.BHXH || 0) +
      Number(row.BHYT || 0) +
      Number(row.BHTN || 0) +
      Number(row.KHAUTRU_KHAC || 0);
    const salaryByDays = toMoney(
      (Number(row.LUONGCOBAN || 0) / 26) * workDaysConverted,
    );
    const takeHome = toMoney(salaryByDays + commission - deduction);

    return {
      ...row,
      NGAYCONG: workDaysConverted,
      NGAYCONG_THUCTE: workDaysRaw,
      SO_NGAY_LE_DI_LAM: Number(row.SO_NGAY_LE_DI_LAM || 0),
      NGAYCONG_LE_QUYDOI_THEM: holidayExtraDays,
      NGAY_NGHI_KHONG_LUONG: unpaidLeaveDays,
      NGAYNGHI_KP: unpaidLeaveDays,
      DOANH_SO: revenue,
      HOA_HONG: commission,
      PHUCAP: commission,
      KHAUTRU: deduction,
      LUONGTHUCLANH: takeHome,
      LUONGTHUCLANH_TINHLAI: takeHome,
      NGAYNGHI_DA_DUNG: leaveUsed,
      NGAYNGHI_CONLAI: leaveRemaining,
    };
  });
}

async function getPayrollByMonthAndEmployee(mnv, month, year, roleName) {
  const monthNum = Number(month);
  const yearNum = Number(year);
  const monthStart = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
  const monthEnd = new Date(yearNum, monthNum, 0).toISOString().slice(0, 10);

  const rows = await query(
    `
      SELECT
        bl.MBL,
        bl.MNV,
        nv.HOTEN,
        cv.TEN AS TENCHUCVU,
        COALESCE(nq.TEN, '') AS TENNHOMQUYEN,
        bl.THANG,
        bl.NAM,
        bl.LUONGCOBAN,
        bl.NGAYCONG AS NGAYCONG_LUU,
        COALESCE(wd.SO_NGAY_CONG_THUC_TE, bcc.NGAYCONG, bl.NGAYCONG, 0) AS NGAYCONG_THUCTE,
        COALESCE(bcc.NGAYNGHI_KP, 0) AS NGAYNGHI_KP_BCC,
        COALESCE(hs.SO_NGAY_LE_DI_LAM, 0) AS SO_NGAY_LE_DI_LAM,
        COALESCE(hs.NGAYCONG_LE_QUYDOI_THEM, 0) AS NGAYCONG_LE_QUYDOI_THEM,
        bl.DOANH_SO,
        bl.TY_LE_HOA_HONG,
        bl.HOA_HONG,
        bl.BHXH,
        bl.BHYT,
        bl.BHTN,
        bl.KHAUTRU_KHAC,
        0 AS THUONG,
        bl.HOA_HONG AS PHUCAP,
        (bl.BHXH + bl.BHYT + bl.BHTN + bl.KHAUTRU_KHAC) AS KHAUTRU,
        bl.LUONGTHUCLANH,
        bl.TT
      FROM BANGLUONG bl
      INNER JOIN NHANVIEN nv ON nv.MNV = bl.MNV
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      LEFT JOIN TAIKHOAN tk ON tk.MNV = bl.MNV
      LEFT JOIN NHOMQUYEN nq ON nq.MNQ = tk.MNQ
      LEFT JOIN BANGCHAMCONG bcc ON bcc.MNV = bl.MNV AND bcc.THANG = bl.THANG AND bcc.NAM = bl.NAM
      LEFT JOIN (
        SELECT
          p.MNV,
          MONTH(p.NGAY) AS THANG,
          YEAR(p.NGAY) AS NAM,
          COUNT(DISTINCT p.NGAY) AS SO_NGAY_CONG_THUC_TE
        FROM PHANCALAM p
        WHERE p.TT = 2
          AND DAYOFWEEK(p.NGAY) <> 1
        GROUP BY p.MNV, MONTH(p.NGAY), YEAR(p.NGAY)
      ) wd ON wd.MNV = bl.MNV AND wd.THANG = bl.THANG AND wd.NAM = bl.NAM
      LEFT JOIN (
        SELECT
          day_logs.MNV,
          MONTH(day_logs.NGAY) AS THANG,
          YEAR(day_logs.NGAY) AS NAM,
          COUNT(*) AS SO_NGAY_LE_DI_LAM,
          SUM(GREATEST(COALESCE(day_logs.HESO_LUONG, 1) - 1, 0)) AS NGAYCONG_LE_QUYDOI_THEM
        FROM (
          SELECT DISTINCT p.MNV, p.NGAY, nl.HESO_LUONG
          FROM PHANCALAM p
          INNER JOIN NGAYLE nl ON nl.NGAY = p.NGAY
          WHERE p.TT = 2
            AND DAYOFWEEK(p.NGAY) <> 1
        ) day_logs
        GROUP BY day_logs.MNV, MONTH(day_logs.NGAY), YEAR(day_logs.NGAY)
      ) hs ON hs.MNV = bl.MNV AND hs.THANG = bl.THANG AND hs.NAM = bl.NAM
      WHERE bl.MNV = ? AND bl.THANG = ? AND bl.NAM = ?
      ORDER BY bl.MBL DESC
      LIMIT 1
    `,
    [Number(mnv), monthNum, yearNum],
  );

  const row = rows[0] || null;
  if (!row) {
    return null;
  }

  const [
    totalRevenueRows,
    personalRevenueRows,
    annualLeaveRows,
    unpaidLeaveRows,
  ] = await Promise.all([
    query(
      `
        SELECT COALESCE(SUM(px.TIEN), 0) AS TONG_DOANH_SO
        FROM PHIEUXUAT px
        WHERE px.TT = 1 AND MONTH(px.TG) = ? AND YEAR(px.TG) = ?
      `,
      [monthNum, yearNum],
    ),
    query(
      `
        SELECT COALESCE(SUM(px.TIEN), 0) AS DOANH_SO_CANHAN
        FROM PHIEUXUAT px
        WHERE px.TT = 1 AND MONTH(px.TG) = ? AND YEAR(px.TG) = ? AND px.MNV = ?
      `,
      [monthNum, yearNum, Number(mnv)],
    ),
    query(
      `
        SELECT dxn.NGAYNGHI, COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) AS NGAYKETTHUC
        FROM DONXINNGH dxn
        WHERE dxn.MNV = ?
          AND dxn.TRANGTHAI = 1
          AND dxn.LOAI = 0
          AND YEAR(dxn.NGAYNGHI) = ?
          AND MONTH(dxn.NGAYNGHI) <= ?
      `,
      [Number(mnv), yearNum, monthNum],
    ),
    query(
      `
        SELECT
          dxn.NGAYNGHI,
          COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) AS NGAYKETTHUC
        FROM DONXINNGH dxn
        WHERE dxn.MNV = ?
          AND dxn.TRANGTHAI = 1
          AND dxn.LOAI = 1
          AND dxn.NGAYNGHI <= ?
          AND COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) >= ?
      `,
      [Number(mnv), monthEnd, monthStart],
    ),
  ]);

  const totalRevenue = Number(totalRevenueRows[0]?.TONG_DOANH_SO || 0);
  const personalRevenue = Number(personalRevenueRows[0]?.DOANH_SO_CANHAN || 0);
  const shouldUseTotalRevenue =
    isManagerLikeRole(roleName) || isManagerLikeRole(row.TENNHOMQUYEN);
  const revenue = shouldUseTotalRevenue ? totalRevenue : personalRevenue;
  const commissionRate = Number(row.TY_LE_HOA_HONG || 0);
  const commission = toMoney(revenue * (commissionRate / 100));
  const workDaysRawBeforeLeave = Number(
    row.NGAYCONG_THUCTE ?? row.NGAYCONG_LUU ?? 0,
  );
  const unpaidLeaveDaysFromLeaveRequest = unpaidLeaveRows.reduce(
    (sum, leaveRow) =>
      sum +
      countNonSundayOverlapDays(
        leaveRow.NGAYNGHI,
        leaveRow.NGAYKETTHUC,
        monthStart,
        monthEnd,
      ),
    0,
  );
  const unpaidLeaveDaysFromBcc = Number(row.NGAYNGHI_KP_BCC || 0);
  const unpaidLeaveDays = Math.max(
    unpaidLeaveDaysFromLeaveRequest,
    unpaidLeaveDaysFromBcc,
  );
  const workDaysRaw = Math.max(
    0,
    toMoney(workDaysRawBeforeLeave - unpaidLeaveDays),
  );
  const holidayExtraDays = Number(row.NGAYCONG_LE_QUYDOI_THEM || 0);
  const workDaysConverted = toMoney(workDaysRaw + holidayExtraDays);
  const leaveUsed = annualLeaveRows.reduce(
    (sum, r) =>
      sum + Math.max(countNonSundayDaysInRange(r.NGAYNGHI, r.NGAYKETTHUC), 1),
    0,
  );
  const leaveRemaining = Math.max(0, 12 - leaveUsed);
  const deduction =
    Number(row.BHXH || 0) +
    Number(row.BHYT || 0) +
    Number(row.BHTN || 0) +
    Number(row.KHAUTRU_KHAC || 0);
  const salaryByDays = toMoney(
    (Number(row.LUONGCOBAN || 0) / 26) * workDaysConverted,
  );
  const takeHome = toMoney(salaryByDays + commission - deduction);

  return {
    ...row,
    NGAYCONG: workDaysConverted,
    NGAYCONG_THUCTE: workDaysRaw,
    SO_NGAY_LE_DI_LAM: Number(row.SO_NGAY_LE_DI_LAM || 0),
    NGAYCONG_LE_QUYDOI_THEM: holidayExtraDays,
    NGAY_NGHI_KHONG_LUONG: unpaidLeaveDays,
    NGAYNGHI_KP: unpaidLeaveDays,
    DOANH_SO: revenue,
    HOA_HONG: commission,
    PHUCAP: commission,
    KHAUTRU: deduction,
    LUONGTHUCLANH: takeHome,
    LUONGTHUCLANH_TINHLAI: takeHome,
    NGAYNGHI_DA_DUNG: leaveUsed,
    NGAYNGHI_CONLAI: leaveRemaining,
  };
}

async function listHolidays(year) {
  const hasYear = Number.isInteger(Number(year));
  return query(
    `
      SELECT
        ID,
        TENLE,
        NGAY,
        HESO_LUONG,
        GHICHU
      FROM NGAYLE
      ${hasYear ? "WHERE YEAR(NGAY) = ?" : ""}
      ORDER BY NGAY ASC
    `,
    hasYear ? [Number(year)] : [],
  );
}

async function findHolidayById(id) {
  const rows = await query(
    `
      SELECT ID, TENLE, NGAY, HESO_LUONG, GHICHU
      FROM NGAYLE
      WHERE ID = ?
      LIMIT 1
    `,
    [Number(id)],
  );

  return rows[0] || null;
}

async function hasFinalizedPayrollByDate(date) {
  const rows = await query(
    `
      SELECT MBL
      FROM BANGLUONG
      WHERE THANG = MONTH(?)
        AND NAM = YEAR(?)
        AND TT = 2
      LIMIT 1
    `,
    [date, date],
  );

  return rows.length > 0;
}

async function createHoliday(payload) {
  return query(
    `
      INSERT INTO NGAYLE (TENLE, NGAY, HESO_LUONG, GHICHU)
      VALUES (?, ?, ?, ?)
    `,
    [
      String(payload.name || "").trim(),
      payload.date,
      Number(payload.multiplier),
      String(payload.note || "").trim() || null,
    ],
  );
}

async function updateHoliday(id, payload) {
  return query(
    `
      UPDATE NGAYLE
      SET TENLE = ?, NGAY = ?, HESO_LUONG = ?, GHICHU = ?
      WHERE ID = ?
    `,
    [
      String(payload.name || "").trim(),
      payload.date,
      Number(payload.multiplier),
      String(payload.note || "").trim() || null,
      Number(id),
    ],
  );
}

async function deleteHoliday(id) {
  return query(
    `
      DELETE FROM NGAYLE
      WHERE ID = ?
    `,
    [Number(id)],
  );
}

async function markAsResigned(mnv) {
  const employeeId = Number(mnv);

  await withTransaction(async (connection) => {
    await connection.execute(
      `
        UPDATE NHANVIEN
        SET TT = 0
        WHERE MNV = ?
      `,
      [employeeId],
    );

    await connection.execute(
      `
        UPDATE TAIKHOAN
        SET TRANGTHAI = 0
        WHERE MNV = ?
      `,
      [employeeId],
    );
  });
}

async function findPositionByName(positionName) {
  const rows = await query(
    `
      SELECT
        MCV,
        TEN
      FROM CHUCVU
      WHERE TEN = ?
      LIMIT 1
    `,
    [String(positionName || "").trim()],
  );

  return rows[0] || null;
}

async function listActiveEmployeesForAttendance(attendanceDate) {
  return query(
    `
      SELECT DISTINCT
        nv.MNV,
        nv.HOTEN,
        cv.TEN AS TENCHUCVU,
        nv.TT
      FROM PHANCALAM p
      INNER JOIN NHANVIEN nv ON nv.MNV = p.MNV
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      WHERE nv.TT = 1
        AND p.NGAY = ?
      ORDER BY nv.MNV ASC
    `,
    [attendanceDate],
  );
}

async function listActiveShifts() {
  return query(
    `
      SELECT
        c.MCA,
        c.TENCA,
        c.GIO_BATDAU,
        c.GIO_KETTHUC,
        c.TT
      FROM CALAM c
      WHERE c.TT = 1
      ORDER BY c.GIO_BATDAU ASC, c.MCA ASC
    `,
  );
}

async function listShiftAssignmentsByDate(attendanceDate) {
  return query(
    `
      SELECT
        p.MPCL,
        p.MNV,
        nv.HOTEN,
        cv.TEN AS TENCHUCVU,
        p.MCA,
        c.TENCA,
        c.GIO_BATDAU,
        c.GIO_KETTHUC,
        p.NGAY,
        p.GIO_CHECKIN,
        p.GIO_CHECKOUT,
        p.TT
      FROM PHANCALAM p
      INNER JOIN NHANVIEN nv ON nv.MNV = p.MNV
      LEFT JOIN CHUCVU cv ON cv.MCV = nv.MCV
      LEFT JOIN CALAM c ON c.MCA = p.MCA
      WHERE p.NGAY = ?
        AND nv.TT = 1
      ORDER BY nv.MNV ASC, c.GIO_BATDAU ASC, p.MCA ASC, p.MPCL ASC
    `,
    [attendanceDate],
  );
}

async function saveShiftAssignmentsByDate(assignments, attendanceDate) {
  const normalizedAssignments = Array.from(
    new Map(
      (Array.isArray(assignments) ? assignments : [])
        .map((item) => {
          const employeeId = Number(item?.employeeId);
          const shiftIds = Array.from(
            new Set(
              (Array.isArray(item?.shiftIds) ? item.shiftIds : [])
                .map((shiftId) => Number(shiftId))
                .filter((shiftId) => Number.isInteger(shiftId) && shiftId > 0),
            ),
          );

          if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return null;
          }

          return [employeeId, { employeeId, shiftIds }];
        })
        .filter(Boolean),
    ).values(),
  );

  if (normalizedAssignments.length === 0) {
    return 0;
  }

  return withTransaction(async (connection) => {
    const insertRows = normalizedAssignments.flatMap((item) =>
      item.shiftIds.map((shiftId) => ({
        employeeId: item.employeeId,
        shiftId,
      })),
    );

    if (insertRows.length <= 0) {
      return 0;
    }

    // Xóa các ca dư (ca cũ không còn trong danh sách mới),
    // nhưng chỉ xóa những bản ghi KHÔNG có VIPHAM tham chiếu tới
    const employeeIds = normalizedAssignments.map((item) => item.employeeId);
    const employeePlaceholders = employeeIds.map(() => "?").join(", ");

    const newShiftPairs = insertRows.map(() => "(p.MNV = ? AND p.MCA = ?)").join(" OR ");
    const newShiftParams = insertRows.flatMap((row) => [row.employeeId, row.shiftId]);

    await connection.execute(
      `
        DELETE p FROM PHANCALAM p
        LEFT JOIN VIPHAM v ON v.MPCL = p.MPCL
        WHERE p.NGAY = ?
          AND p.MNV IN (${employeePlaceholders})
          AND v.MPCL IS NULL
          AND NOT (${newShiftPairs})
      `,
      [attendanceDate, ...employeeIds, ...newShiftParams],
    );

    // Upsert: thêm mới nếu chưa có, cập nhật TT=0 nếu đã tồn tại
    // → KHÔNG xóa bản ghi cũ → VIPHAM không bị ảnh hưởng
    const valuePlaceholders = insertRows.map(() => "(?, ?, ?, 0)").join(", ");
    const valueParams = insertRows.flatMap((row) => [
      row.employeeId,
      row.shiftId,
      attendanceDate,
    ]);

    await connection.execute(
      `
        INSERT INTO PHANCALAM (MNV, MCA, NGAY, TT)
        VALUES ${valuePlaceholders}
        ON DUPLICATE KEY UPDATE TT = 0
      `,
      valueParams,
    );

    return insertRows.length;
  });
}

async function listTodayAttendanceEmployeeIds(attendanceDate) {
  const rows = await query(
    `
      SELECT DISTINCT p.MNV
      FROM PHANCALAM p
      INNER JOIN NHANVIEN nv ON nv.MNV = p.MNV
      WHERE p.NGAY = ?
        AND nv.TT = 1
        AND (
          p.TT IN (1, 2)
          OR p.GIO_CHECKIN IS NOT NULL
          OR p.GIO_CHECKOUT IS NOT NULL
        )
    `,
    [attendanceDate],
  );

  return rows.map((row) => Number(row.MNV));
}

async function saveTodayAttendanceByEmployeeIds(employeeIds, attendanceDate) {
  const uniqueIds = Array.from(
    new Set(
      (Array.isArray(employeeIds) ? employeeIds : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  return withTransaction(async (connection) => {
    await connection.execute(
      `
        UPDATE PHANCALAM p
        INNER JOIN NHANVIEN nv ON nv.MNV = p.MNV
        SET p.TT = 3
        WHERE p.NGAY = ?
          AND nv.TT = 1
      `,
      [attendanceDate],
    );

    if (uniqueIds.length > 0) {
      const inPlaceholders = uniqueIds.map(() => "?").join(", ");
      await connection.execute(
        `
          UPDATE PHANCALAM
          SET TT = 2
          WHERE NGAY = ?
            AND MNV IN (${inPlaceholders})
        `,
        [attendanceDate, ...uniqueIds],
      );
    }

    const [rows] = await connection.execute(
      `
        SELECT COUNT(DISTINCT p.MNV) AS PRESENT_COUNT
        FROM PHANCALAM p
        INNER JOIN NHANVIEN nv ON nv.MNV = p.MNV
        WHERE p.NGAY = ?
          AND nv.TT = 1
          AND p.TT = 2
      `,
      [attendanceDate],
    );

    return Number(rows?.[0]?.PRESENT_COUNT || 0);
  });
}

async function getMyAttendanceByDate(mnv, attendanceDate) {
  return query(
    `
      SELECT
        p.MPCL,
        p.MCA,
        c.TENCA,
        c.GIO_BATDAU,
        c.GIO_KETTHUC,
        p.NGAY,
        p.GIO_CHECKIN,
        p.GIO_CHECKOUT,
        p.TT
      FROM PHANCALAM p
      LEFT JOIN CALAM c ON c.MCA = p.MCA
      WHERE p.MNV = ?
        AND p.NGAY = ?
      ORDER BY c.GIO_BATDAU ASC, p.MCA ASC, p.MPCL ASC
    `,
    [Number(mnv), attendanceDate],
  );
}

async function checkInMyAttendance(mnv, attendanceDate) {
  return withTransaction(async (connection) => {
    const [updateResult] = await connection.execute(
      `
        UPDATE PHANCALAM p
        INNER JOIN (
          SELECT p2.MPCL
          FROM PHANCALAM p2
          WHERE p2.MNV = ?
            AND p2.NGAY = ?
            AND p2.GIO_CHECKIN IS NULL
          ORDER BY p2.MCA ASC, p2.MPCL ASC
          LIMIT 1
        ) pick ON pick.MPCL = p.MPCL
        SET
          p.GIO_CHECKIN = NOW(),
          p.TT = 1
      `,
      [Number(mnv), attendanceDate],
    );

    if (Number(updateResult?.affectedRows || 0) > 0) {
      // Check-in thành công, tính violation "đi trễ" và lưu vào VIPHAM
      try {
        await recordLateCheckInViolation(mnv, attendanceDate);
      } catch (err) {
        // Log nhưng không throw, vì violation recording là optional
        console.error(
          "[checkInMyAttendance] Late check-in recording error:",
          err,
        );
      }
      return true;
    }

    const [rows] = await connection.execute(
      `
        SELECT
          COUNT(*) AS TOTAL_SHIFT,
          SUM(CASE WHEN GIO_CHECKIN IS NOT NULL THEN 1 ELSE 0 END) AS CHECKED_IN
        FROM PHANCALAM
        WHERE MNV = ?
          AND NGAY = ?
      `,
      [Number(mnv), attendanceDate],
    );

    const totalShift = Number(rows?.[0]?.TOTAL_SHIFT || 0);
    const checkedIn = Number(rows?.[0]?.CHECKED_IN || 0);

    if (totalShift <= 0) {
      const error = new Error("Bạn không có ca làm trong ngày này");
      error.statusCode = 400;
      throw error;
    }

    if (checkedIn >= totalShift) {
      const error = new Error("Bạn đã check-in đầy đủ các ca trong ngày");
      error.statusCode = 400;
      throw error;
    }

    const fallbackError = new Error("Không thể check-in, vui lòng thử lại");
    fallbackError.statusCode = 400;
    throw fallbackError;
  });
}

async function checkOutMyAttendance(mnv, attendanceDate) {
  // Lấy MPCL của ca sắp checkout TRƯỚC khi UPDATE
  const mpcl = await withTransaction(async (connection) => {
    const [pickRows] = await connection.execute(
      `SELECT p2.MPCL FROM PHANCALAM p2
        WHERE p2.MNV = ? AND p2.NGAY = ?
          AND p2.GIO_CHECKIN IS NOT NULL AND p2.GIO_CHECKOUT IS NULL
        ORDER BY p2.GIO_CHECKIN DESC, p2.MPCL DESC LIMIT 1`,
      [Number(mnv), attendanceDate],
    );

    const mpcl = pickRows?.[0]?.MPCL ?? null;

    if (!mpcl) {
      // Không tìm được ca cần checkout → trả lỗi thân thiện
      const [rows] = await connection.execute(
        `SELECT
           COUNT(*) AS TOTAL_SHIFT,
           SUM(CASE WHEN GIO_CHECKIN IS NOT NULL THEN 1 ELSE 0 END) AS CHECKED_IN,
           SUM(CASE WHEN GIO_CHECKIN IS NOT NULL AND GIO_CHECKOUT IS NOT NULL THEN 1 ELSE 0 END) AS CHECKED_OUT
         FROM PHANCALAM
         WHERE MNV = ? AND NGAY = ?`,
        [Number(mnv), attendanceDate],
      );

      const totalShift = Number(rows?.[0]?.TOTAL_SHIFT || 0);
      const checkedIn = Number(rows?.[0]?.CHECKED_IN || 0);
      const checkedOut = Number(rows?.[0]?.CHECKED_OUT || 0);

      const mkErr = (msg) => Object.assign(new Error(msg), { statusCode: 400 });
      if (totalShift <= 0) throw mkErr("Bạn không có ca làm trong ngày này");
      if (checkedIn <= 0)
        throw mkErr("Bạn chưa check-in nên không thể check-out");
      if (checkedOut >= checkedIn)
        throw mkErr("Bạn đã check-out đầy đủ cho các ca đã check-in");
      throw mkErr("Không thể check-out, vui lòng thử lại");
    }

    // Ghi GIO_CHECKOUT cho đúng ca
    const [updateResult] = await connection.execute(
      `UPDATE PHANCALAM SET GIO_CHECKOUT = NOW(), TT = 2 WHERE MPCL = ?`,
      [mpcl],
    );
    if (Number(updateResult?.affectedRows || 0) <= 0) {
      throw Object.assign(new Error("Không thể check-out, vui lòng thử lại"), {
        statusCode: 400,
      });
    }

    return mpcl; // ← trả MPCL ra ngoài, transaction tự COMMIT sau return
  });
  try {
    const violation = await calculateCheckInOutViolation(
      mnv,
      attendanceDate,
      mpcl,
    );
    if (violation.hasViolation && violation.penaltyAmount > 0) {
      await autoUpdateKhauTruKhacFromViolation(
        mnv,
        attendanceDate,
        mpcl,
        violation.penaltyAmount,
        violation.violationType,
        violation.lateMinutes,
        violation.earlyMinutes,
      );
    }
  } catch (err) {
    console.error("[checkOutMyAttendance] Violation calc error:", err);
  }

  return true;
}

// ── Hằng số & helper dùng chung cho tính vi phạm ────────────────────────────
const PENALTY_RATES = {
  "Quản lý cửa hàng": 50000,
  "Nhân viên bán hàng": 25000,
  "Nhân viên kho": 30000,
  "Quản lý nhân sự": 40000,
};
const THRESHOLD_MINUTES = 10;

function parseAsMinutes(val) {
  if (!val) return NaN;

  // Nếu là Date object → ISO string
  const str = val instanceof Date ? val.toISOString() : String(val).trim();

  // ISO UTC: "2026-04-15T06:19:05.000Z" hoặc "2026-04-15T06:19:05Z"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    if (isNaN(d.getTime())) return NaN;
    // UTC+7
    const utc7 = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return utc7.getUTCHours() * 60 + utc7.getUTCMinutes();
  }

  // "YYYY-MM-DD HH:MM:SS" hoặc "HH:MM:SS" hoặc "HH:MM"
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }

  return NaN;
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính vi phạm check-in/check-out cho 1 ca cụ thể (theo MPCL)
 * Gọi SAU khi check-out thành công.
 * @param {number} mnv
 * @param {string} attendanceDate  YYYY-MM-DD
 * @param {number} mpcl  Mã phân ca vừa checkout
 * @returns {{ hasViolation, penaltyAmount, violationType, lateMinutes, earlyMinutes, mpcl }}
 */
async function calculateCheckInOutViolation(mnv, attendanceDate, mpcl) {
  try {
    // Lấy đúng ca vừa checkout (theo MPCL) — bao gồm GIO_CHECKIN và GIO_CHECKOUT
    const shiftRows = await query(
      `SELECT
         pc.MPCL,
         pc.MCA,
         pc.GIO_CHECKIN,
         pc.GIO_CHECKOUT,
         ca.GIO_BATDAU,
         ca.GIO_KETTHUC,
         cv.TEN AS TENCHUCVU
       FROM PHANCALAM pc
       INNER JOIN CALAM      ca ON ca.MCA = pc.MCA
       INNER JOIN NHANVIEN   nv ON nv.MNV = pc.MNV
       INNER JOIN CHUCVU     cv ON cv.MCV = nv.MCV
       WHERE pc.MPCL = ?
         AND pc.MNV  = ?
         AND pc.GIO_CHECKIN  IS NOT NULL
         AND pc.GIO_CHECKOUT IS NOT NULL
       LIMIT 1`,
      [mpcl, Number(mnv)],
    );

    const EMPTY = {
      hasViolation: false,
      penaltyAmount: 0,
      violationType: null,
      lateMinutes: 0,
      earlyMinutes: 0,
      mpcl,
    };

    if (!Array.isArray(shiftRows) || shiftRows.length === 0) {
      // console.warn(
      //   `[calculateCheckInOutViolation] Không tìm thấy ca MPCL=${mpcl} MNV=${mnv}`,
      // );
      return EMPTY;
    }

    const shift = shiftRows[0];
    const positionName = String(shift.TENCHUCVU || "").trim();
    // Nếu chức vụ không khớp map → dùng mức Bán hàng làm mặc định
    const penaltyRate =
      PENALTY_RATES[positionName] ?? PENALTY_RATES["Bán hàng"];

    let lateMinutes = 0; // phút đi trễ (> THRESHOLD)
    let earlyMinutes = 0; // phút về sớm (> THRESHOLD)

    // ── Kiểm tra ĐI TRỄ ──────────────────────────────────────────
    if (shift.GIO_CHECKIN && shift.GIO_BATDAU) {
      const checkInMin = parseAsMinutes(shift.GIO_CHECKIN);
      const shiftStartMin = parseAsMinutes(shift.GIO_BATDAU);

      if (
        !isNaN(checkInMin) &&
        !isNaN(shiftStartMin) &&
        checkInMin > shiftStartMin
      ) {
        const diff = checkInMin - shiftStartMin;
        if (diff > THRESHOLD_MINUTES) {
          lateMinutes = diff;
        }
      }
    }

    // ── Kiểm tra VỀ SỚM ──────────────────────────────────────────
    if (shift.GIO_CHECKOUT && shift.GIO_KETTHUC) {
      const checkOutMin = parseAsMinutes(shift.GIO_CHECKOUT);
      const shiftEndMin = parseAsMinutes(shift.GIO_KETTHUC);

      if (
        !isNaN(checkOutMin) &&
        !isNaN(shiftEndMin) &&
        checkOutMin < shiftEndMin
      ) {
        const diff = shiftEndMin - checkOutMin;
        if (diff > THRESHOLD_MINUTES) {
          earlyMinutes = diff;
        }
      }
    }

    const isLate = lateMinutes > 0;
    const isEarly = earlyMinutes > 0;

    let violationType = null;
    let penaltyAmount = 0;

    if (isLate && isEarly) {
      // Vừa đi trễ vừa về sớm → phạt x2
      violationType = "Đi trễ & Về sớm";
      penaltyAmount = penaltyRate * 2;
    } else if (isLate) {
      violationType = "Đi trễ";
      penaltyAmount = penaltyRate;
    } else if (isEarly) {
      violationType = "Về sớm";
      penaltyAmount = penaltyRate;
    }

    if (penaltyAmount > 0) {
      // console.log(
      //   `[calculateCheckInOutViolation] MNV=${mnv}, MPCL=${mpcl}, ` +
      //     `chucVu="${positionName}", type="${violationType}", ` +
      //     `late=${lateMinutes}min, early=${earlyMinutes}min, penalty=${penaltyAmount}đ`,
      // );
      return {
        hasViolation: true,
        penaltyAmount,
        violationType,
        lateMinutes,
        earlyMinutes,
        mpcl,
      };
    }

    return {
      hasViolation: false,
      penaltyAmount: 0,
      violationType: null,
      lateMinutes,
      earlyMinutes,
      mpcl,
    };
  } catch (err) {
    console.error("[calculateCheckInOutViolation] Error:", err);
    return {
      hasViolation: false,
      penaltyAmount: 0,
      violationType: null,
      lateMinutes: 0,
      earlyMinutes: 0,
      mpcl,
    };
  }
}

/**
 * Ghi vi phạm "đi trễ" tạm thời khi check-in, để lúc check-out sẽ xử lý lại toàn bộ.
 * Hàm này chỉ log, KHÔNG insert vào VIPHAM nữa (tránh duplicate).
 * Toàn bộ logic vi phạm được xử lý trong calculateCheckInOutViolation khi check-out.
 */
async function recordLateCheckInViolation(mnv, attendanceDate) {
  // PENALTY_RATES, THRESHOLD_MINUTES, parseAsMinutes → dùng từ module level
}

/**
 * Ghi vi phạm vào VIPHAM và cập nhật KHAUTRU_KHAC trong BANGLUONG.
 * Gọi SAU khi calculateCheckInOutViolation xác nhận có vi phạm.
 * @param {number} mnv
 * @param {string} attendanceDate  YYYY-MM-DD
 * @param {number} mpcl  Mã phân ca vừa hoàn thành (để tránh duplicate)
 * @param {number} penaltyAmount  Tiền phạt
 * @param {string} violationType  "Đi trễ" | "Về sớm" | "Đi trễ & Về sớm"
 */
async function autoUpdateKhauTruKhacFromViolation(
  mnv,
  attendanceDate,
  mpcl,
  penaltyAmount,
  violationType,
  lateMinutes = 0,
  earlyMinutes = 0,
) {
  if (!penaltyAmount || penaltyAmount <= 0) return;

  try {
    // Dùng ngày ca làm xác định tháng/năm (tránh edge-case ca đêm vắt qua tháng)
    const refDate = new Date(attendanceDate + "T00:00:00");
    const currentMonth = refDate.getMonth() + 1;
    const currentYear = refDate.getFullYear();

    // LOAI: 1=Đi trễ, 2=Về sớm, 3=Đi trễ & Về sớm
    const loaiCode =
      violationType === "Đi trễ"
        ? 1
        : violationType === "Về sớm"
          ? 2
          : violationType === "Đi trễ & Về sớm"
            ? 3
            : null;

    if (!loaiCode) {
      console.warn(
        `[autoUpdateKhauTruKhacFromViolation] Unknown violationType: "${violationType}"`,
      );
      return;
    }

    // PHUT_VIPHAM: nếu cả 2 vi phạm → lấy max (hoặc tổng, tuỳ nghiệp vụ — hiện dùng max)
    const phutVipham = Math.max(lateMinutes, earlyMinutes);

    // ── Bước 1: Ghi VIPHAM (INSERT hoặc UPDATE theo MPCL) ────────
    const existRows = await query(
      `SELECT MVP, TIEN_PHAT FROM VIPHAM WHERE MPCL = ? LIMIT 1`,
      [mpcl],
    );

    let oldPenalty = 0;

    if (Array.isArray(existRows) && existRows.length > 0) {
      // Đã có bản ghi cho ca này → cập nhật (tránh double-count)
      oldPenalty = Number(existRows[0].TIEN_PHAT || 0);
      await query(
        `UPDATE VIPHAM
         SET LOAI        = ?,
             TIEN_PHAT   = ?,
             PHUT_VIPHAM = ?,
             GHICHU      = ?
         WHERE MPCL = ?`,
        [
          loaiCode,
          penaltyAmount,
          phutVipham,
          _buildNote(violationType, penaltyAmount),
          mpcl,
        ],
      );
      // console.log(
      //   `[autoUpdateKhauTruKhacFromViolation] Updated VIPHAM MPCL=${mpcl}, ` +
      //     `old=${oldPenalty}đ → new=${penaltyAmount}đ`,
      // );
    } else {
      // Chưa có → INSERT mới
      await query(
        `INSERT INTO VIPHAM (MNV, MPCL, LOAI, PHUT_VIPHAM, TIEN_PHAT, THANG, NAM, GHICHU)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mnv,
          mpcl,
          loaiCode,
          phutVipham,
          penaltyAmount,
          currentMonth,
          currentYear,
          _buildNote(violationType, penaltyAmount),
        ],
      );
      // console.log(
      //   `[autoUpdateKhauTruKhacFromViolation] Inserted VIPHAM LOAI=${loaiCode}, ` +
      //     `MNV=${mnv}, MPCL=${mpcl}, penalty=${penaltyAmount}đ`,
      // );
    }

    // ── Bước 2: Cập nhật BANGLUONG ────────────────────────────────
    const salaryRows = await query(
      `SELECT MBL FROM BANGLUONG WHERE MNV = ? AND THANG = ? AND NAM = ? LIMIT 1`,
      [mnv, currentMonth, currentYear],
    );

    if (!Array.isArray(salaryRows) || salaryRows.length === 0) {
      // Chưa có bảng lương tháng này → bỏ qua (sẽ tính khi tạo bảng lương)
      // console.log(
      //   `[autoUpdateKhauTruKhacFromViolation] Chưa có BANGLUONG cho MNV=${mnv} ` +
      //     `tháng ${currentMonth}/${currentYear} — bỏ qua cập nhật lương`,
      // );
      return;
    }

    const mbl = salaryRows[0].MBL;

    const salaryInfoRows = await query(
      `SELECT LUONGCOBAN, BHXH, BHYT, BHTN, HOA_HONG, KHAUTRU_KHAC
       FROM BANGLUONG WHERE MBL = ?`,
      [mbl],
    );
    if (!Array.isArray(salaryInfoRows) || salaryInfoRows.length === 0) return;

    const salary = salaryInfoRows[0];
    const baseSalary = Number(salary.LUONGCOBAN || 0);
    const bhxh = Number(salary.BHXH || 0);
    const bhyt = Number(salary.BHYT || 0);
    const bhtn = Number(salary.BHTN || 0);
    const commission = Number(salary.HOA_HONG || 0);
    const currentKhauTruKhac = Number(salary.KHAUTRU_KHAC || 0);

    // delta = tiền phạt mới − tiền phạt cũ (tránh double-count khi UPDATE)
    const delta = penaltyAmount - oldPenalty;
    const newKhauTruKhac = toMoney(Math.max(0, currentKhauTruKhac + delta));

    // Ngày công quy đổi (giống updateSalaryByMbl)
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const monthEnd = new Date(currentYear, currentMonth, 0)
      .toISOString()
      .slice(0, 10);

    const [workDaysResult, unpaidLeaveResult, holidayResult] =
      await Promise.all([
        query(
          `SELECT COUNT(DISTINCT p.NGAY) AS D
         FROM PHANCALAM p
         WHERE p.MNV = ? AND p.TT = 2
           AND DAYOFWEEK(p.NGAY) <> 1
           AND MONTH(p.NGAY) = ? AND YEAR(p.NGAY) = ?`,
          [mnv, currentMonth, currentYear],
        ),
        query(
          `SELECT COUNT(DISTINCT dxn.NGAYNGHI) AS D
         FROM DONXINNGH dxn
         WHERE dxn.MNV = ? AND dxn.TRANGTHAI = 1 AND dxn.LOAI = 1
           AND dxn.NGAYNGHI >= ?
           AND COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) <= ?`,
          [mnv, monthStart, monthEnd],
        ),
        query(
          `SELECT SUM(GREATEST(COALESCE(nl.HESO_LUONG, 1) - 1, 0)) AS D
         FROM PHANCALAM p
         INNER JOIN NGAYLE nl ON nl.NGAY = p.NGAY
         WHERE p.MNV = ? AND p.TT = 2
           AND DAYOFWEEK(p.NGAY) <> 1
           AND MONTH(p.NGAY) = ? AND YEAR(p.NGAY) = ?`,
          [mnv, currentMonth, currentYear],
        ),
      ]);

    const workDaysRaw = Number(workDaysResult?.[0]?.D || 0);
    const unpaidLeaveDays = Number(unpaidLeaveResult?.[0]?.D || 0);
    const holidayExtraDays = Number(holidayResult?.[0]?.D || 0);
    const workDaysConverted = toMoney(
      Math.max(0, workDaysRaw - unpaidLeaveDays) + holidayExtraDays,
    );

    const salaryByWorkDays = toMoney((baseSalary / 26) * workDaysConverted);
    const totalDeduction = toMoney(bhxh + bhyt + bhtn + newKhauTruKhac);
    const newLuongThucLanh = toMoney(
      salaryByWorkDays + commission - totalDeduction,
    );

    await query(
      `UPDATE BANGLUONG SET KHAUTRU_KHAC = ?, LUONGTHUCLANH = ? WHERE MBL = ?`,
      [newKhauTruKhac, newLuongThucLanh, mbl],
    );

    // console.log(
    //   `[autoUpdateKhauTruKhacFromViolation] ✅ MNV=${mnv}, MPCL=${mpcl}, ` +
    //     `delta=${delta}đ, newKhauTruKhac=${newKhauTruKhac}đ, ` +
    //     `workDays=${workDaysConverted}, luongThucLanh=${newLuongThucLanh}đ`,
    // );
  } catch (err) {
    console.error("[autoUpdateKhauTruKhacFromViolation] Error:", err);
    // Không throw — violation là optional, không làm hỏng checkout
  }
}

function _buildNote(violationType, penaltyAmount) {
  const fmt = (n) => n.toLocaleString("vi-VN") + "đ";
  if (violationType === "Đi trễ & Về sớm")
    return `Đi trễ & Về sớm — phạt x2: ${fmt(penaltyAmount)}`;
  return `${violationType} — phạt: ${fmt(penaltyAmount)}`;
}

async function create(payload) {
  return query(
    `
      INSERT INTO NHANVIEN (
        HOTEN,
        GIOITINH,
        NGAYSINH,
        SDT,
        EMAIL,
        MCV,
        TT,
        QUEQUAN,
        NGAYVAOLAM,
        CCCD,
        BOPHAN
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      String(payload.fullName || "").trim(),
      Number(payload.gender),
      payload.birthDate,
      String(payload.phone || "").trim(),
      String(payload.email || "").trim(),
      Number(payload.positionId),
      Number(payload.status),
      String(payload.hometown || "").trim(),
      payload.startDate,
      String(payload.citizenId || "").trim(),
      String(payload.department || "").trim() || null,
    ],
  );
}

async function updateSalaryByMbl(mbl, payload) {
  const mblNum = Number(mbl);
  if (!Number.isFinite(mblNum) || mblNum <= 0) {
    throw new Error("Invalid MBL");
  }

  const khauTruKhac =
    payload.khauTruKhac !== undefined ? Number(payload.khauTruKhac) : undefined;

  if (
    khauTruKhac !== undefined &&
    (!Number.isFinite(khauTruKhac) || khauTruKhac < 0)
  ) {
    throw new Error("Invalid khau tru khac");
  }

  if (khauTruKhac === undefined) {
    throw new Error("No fields to update");
  }

  // Fetch salary record info
  const salaryResult = await query(
    `SELECT bl.MBL, bl.MNV, bl.LUONGCOBAN, bl.BHXH, bl.BHYT, bl.BHTN, bl.HOA_HONG, bl.THANG, bl.NAM
     FROM BANGLUONG bl WHERE bl.MBL = ?`,
    [mblNum],
  );

  if (!Array.isArray(salaryResult) || salaryResult.length === 0) {
    throw new Error("Salary record not found");
  }

  const salary = salaryResult[0];
  const mnv = Number(salary.MNV);
  const baseSalary = Number(salary.LUONGCOBAN || 0);
  const bhxh = Number(salary.BHXH || 0);
  const bhyt = Number(salary.BHYT || 0);
  const bhtn = Number(salary.BHTN || 0);
  const hoaHong = Number(salary.HOA_HONG || 0);
  const month = Number(salary.THANG);
  const year = Number(salary.NAM);

  // Fetch working days info
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10);

  // Get actual working days from PHANCALAM
  const workDaysResult = await query(
    `SELECT COUNT(DISTINCT p.NGAY) AS SO_NGAY_CONG_THUC_TE
     FROM PHANCALAM p
     WHERE p.MNV = ? AND p.TT = 2 AND DAYOFWEEK(p.NGAY) <> 1 
     AND MONTH(p.NGAY) = ? AND YEAR(p.NGAY) = ?`,
    [mnv, month, year],
  );

  const workDaysRaw = Number(
    (Array.isArray(workDaysResult) &&
      workDaysResult[0]?.SO_NGAY_CONG_THUC_TE) ||
      0,
  );

  // Get unpaid leave days
  const unpaidLeaveResult = await query(
    `SELECT COUNT(DISTINCT dxn.NGAYNGHI) AS NGAY_NGHI_KP
     FROM DONXINNGH dxn
     WHERE dxn.MNV = ? AND dxn.TRANGTHAI = 1 AND dxn.LOAI = 1
     AND dxn.NGAYNGHI >= ? AND COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI) <= ?`,
    [mnv, monthStart, monthEnd],
  );

  const unpaidLeaveDays = Number(
    (Array.isArray(unpaidLeaveResult) && unpaidLeaveResult[0]?.NGAY_NGHI_KP) ||
      0,
  );

  // Get holiday extra days
  const holidayResult = await query(
    `SELECT SUM(GREATEST(COALESCE(nl.HESO_LUONG, 1) - 1, 0)) AS NGAYCONG_LE_QUYDOI
     FROM PHANCALAM p
     INNER JOIN NGAYLE nl ON nl.NGAY = p.NGAY
     WHERE p.MNV = ? AND p.TT = 2 AND DAYOFWEEK(p.NGAY) <> 1
     AND MONTH(p.NGAY) = ? AND YEAR(p.NGAY) = ?`,
    [mnv, month, year],
  );

  const holidayExtraDays = Number(
    (Array.isArray(holidayResult) && holidayResult[0]?.NGAYCONG_LE_QUYDOI) || 0,
  );

  // Calculate working days converted
  const workDaysRawFinal = Math.max(0, toMoney(workDaysRaw - unpaidLeaveDays));
  const workDaysConverted = toMoney(workDaysRawFinal + holidayExtraDays);

  // Calculate salary: (Lương cơ bản / 26) × Ngày công quy đổi + Hoa hồng - (BHXH + BHYT + BHTN + Khấu trừ khác)
  const newKhauTruKhac = Number(khauTruKhac);
  const salaryByWorkDays = toMoney((baseSalary / 26) * workDaysConverted);
  const totalDeduction = toMoney(bhxh + bhyt + bhtn + newKhauTruKhac);
  const newLuongThucLanh = toMoney(salaryByWorkDays + hoaHong - totalDeduction);

  const sql = `UPDATE BANGLUONG SET KHAUTRU_KHAC = ?, LUONGTHUCLANH = ? WHERE MBL = ?`;
  const params = [newKhauTruKhac, newLuongThucLanh, mblNum];

  return query(sql, params);
}

async function finalizeSalary(mbl) {
  const mblNum = Number(mbl);
  if (!Number.isFinite(mblNum) || mblNum <= 0) {
    throw new Error("Invalid MBL");
  }

  // Check if salary record exists and is not already finalized
  const salaryResult = await query(
    `SELECT MBL, TT FROM BANGLUONG WHERE MBL = ?`,
    [mblNum],
  );

  if (!Array.isArray(salaryResult) || salaryResult.length === 0) {
    throw new Error("Salary record not found");
  }

  const salary = salaryResult[0];
  if (Number(salary.TT) === 2) {
    throw new Error("Salary already finalized");
  }

  // Update TT = 2 (Đã thanh toán - Already paid)
  const sql = `UPDATE BANGLUONG SET TT = 2 WHERE MBL = ?`;
  return query(sql, [mblNum]);
}

async function updateById(id, payload) {
  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE NHANVIEN SET
        HOTEN = ?, GIOITINH = ?, NGAYSINH = ?, SDT = ?, EMAIL = ?,
        MCV = ?, TT = ?, QUEQUAN = ?, DIACHI = ?, NGAYVAOLAM = ?,
        CCCD = ?, BOPHAN = ?
       WHERE MNV = ?`,
      [
        payload.fullName, payload.gender, payload.birthDate,
        payload.phone, payload.email, payload.positionId,
        payload.status, payload.hometown, payload.address || null,
        payload.startDate, payload.citizenId, payload.department,
        id,
      ],
    );
  });
}

module.exports = {
  listAll,
  findById,
  listLeaveRequests,
  listMyLeaveRequests,
  hasLeaveOverlap,
  getAnnualLeaveBalance,
  createLeaveRequest,
  approveLeaveRequest,
  getPayrollByMonth,
  getPayrollByMonthAndEmployee,
  listHolidays,
  findHolidayById,
  hasFinalizedPayrollByDate,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  markAsResigned,
  findPositionByName,
  listActiveEmployeesForAttendance,
  listActiveShifts,
  listShiftAssignmentsByDate,
  saveShiftAssignmentsByDate,
  listTodayAttendanceEmployeeIds,
  saveTodayAttendanceByEmployeeIds,
  getMyAttendanceByDate,
  checkInMyAttendance,
  checkOutMyAttendance,
  recordLateCheckInViolation,
  calculateCheckInOutViolation,
  autoUpdateKhauTruKhacFromViolation,
  updateSalaryByMbl,
  finalizeSalary,
  create,
  updateById,
};