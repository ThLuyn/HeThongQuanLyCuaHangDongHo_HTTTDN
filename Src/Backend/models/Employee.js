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

  return query(
    `
      SELECT
        dxn.MDN,
        dxn.MNV,
        nv.HOTEN,
        dxn.LOAI,
        dxn.NGAYNGHI,
        dxn.NGAYKETTHUC,
        dxn.NGAY_NGHIVIEC,
        GREATEST(
          DATEDIFF(
            CASE
              WHEN dxn.LOAI = 3 THEN COALESCE(dxn.NGAY_NGHIVIEC, dxn.NGAYNGHI)
              ELSE COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI)
            END,
            dxn.NGAYNGHI
          ) + 1,
          1
        ) AS SONGAY,
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
}

async function listMyLeaveRequests(mnv) {
  return query(
    `
      SELECT
        dxn.MDN,
        dxn.MNV,
        nv.HOTEN,
        dxn.LOAI,
        dxn.NGAYNGHI,
        dxn.NGAYKETTHUC,
        dxn.NGAY_NGHIVIEC,
        GREATEST(
          DATEDIFF(
            CASE
              WHEN dxn.LOAI = 3 THEN COALESCE(dxn.NGAY_NGHIVIEC, dxn.NGAYNGHI)
              ELSE COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI)
            END,
            dxn.NGAYNGHI
          ) + 1,
          1
        ) AS SONGAY,
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
  }

  const rows = await query(
    `
      SELECT COALESCE(
        SUM(
          GREATEST(
            DATEDIFF(COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI), dxn.NGAYNGHI) + 1,
            1
          )
        ),
        0
      ) AS SO_NGAY_DA_NGHI
      FROM DONXINNGH dxn
      WHERE dxn.MNV = ?
        AND dxn.LOAI = 0
        AND dxn.TRANGTHAI = 1
        AND YEAR(dxn.NGAYNGHI) = ?
    `,
    [Number(mnv), Number(requestYear)],
  );

  const used = Number(rows[0]?.SO_NGAY_DA_NGHI || 0);
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
          COALESCE(
            SUM(
              GREATEST(
                DATEDIFF(COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI), dxn.NGAYNGHI) + 1,
                1
              )
            ),
            0
          ) AS SO_NGAY_DA_NGHI
        FROM DONXINNGH dxn
        WHERE dxn.TRANGTHAI = 1
          AND dxn.LOAI = 0
          AND YEAR(dxn.NGAYNGHI) = ?
          AND MONTH(dxn.NGAYNGHI) <= ?
        GROUP BY dxn.MNV
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
  const annualLeaveMap = new Map(
    annualLeaveRows.map((row) => [
      Number(row.MNV),
      Number(row.SO_NGAY_DA_NGHI || 0),
    ]),
  );
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
        SELECT COALESCE(
          SUM(
            GREATEST(
              DATEDIFF(COALESCE(dxn.NGAYKETTHUC, dxn.NGAYNGHI), dxn.NGAYNGHI) + 1,
              1
            )
          ),
          0
        ) AS SO_NGAY_DA_NGHI
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
  const leaveUsed = Number(annualLeaveRows[0]?.SO_NGAY_DA_NGHI || 0);
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
  return withTransaction(async (connection) => {
    const [updateResult] = await connection.execute(
      `
        UPDATE PHANCALAM p
        INNER JOIN (
          SELECT p2.MPCL
          FROM PHANCALAM p2
          WHERE p2.MNV = ?
            AND p2.NGAY = ?
            AND p2.GIO_CHECKIN IS NOT NULL
            AND p2.GIO_CHECKOUT IS NULL
          ORDER BY p2.GIO_CHECKIN DESC, p2.MPCL DESC
          LIMIT 1
        ) pick ON pick.MPCL = p.MPCL
        SET
          p.GIO_CHECKOUT = NOW(),
          p.TT = 2
      `,
      [Number(mnv), attendanceDate],
    );

    if (Number(updateResult?.affectedRows || 0) > 0) {
      return true;
    }

    const [rows] = await connection.execute(
      `
        SELECT
          COUNT(*) AS TOTAL_SHIFT,
          SUM(CASE WHEN GIO_CHECKIN IS NOT NULL THEN 1 ELSE 0 END) AS CHECKED_IN,
          SUM(CASE WHEN GIO_CHECKIN IS NOT NULL AND GIO_CHECKOUT IS NOT NULL THEN 1 ELSE 0 END) AS CHECKED_OUT
        FROM PHANCALAM
        WHERE MNV = ?
          AND NGAY = ?
      `,
      [Number(mnv), attendanceDate],
    );

    const totalShift = Number(rows?.[0]?.TOTAL_SHIFT || 0);
    const checkedIn = Number(rows?.[0]?.CHECKED_IN || 0);
    const checkedOut = Number(rows?.[0]?.CHECKED_OUT || 0);

    if (totalShift <= 0) {
      const error = new Error("Bạn không có ca làm trong ngày này");
      error.statusCode = 400;
      throw error;
    }

    if (checkedIn <= 0) {
      const error = new Error("Bạn chưa check-in nên không thể check-out");
      error.statusCode = 400;
      throw error;
    }

    if (checkedOut >= checkedIn) {
      const error = new Error("Bạn đã check-out đầy đủ cho các ca đã check-in");
      error.statusCode = 400;
      throw error;
    }

    const fallbackError = new Error("Không thể check-out, vui lòng thử lại");
    fallbackError.statusCode = 400;
    throw fallbackError;
  });
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
  listTodayAttendanceEmployeeIds,
  saveTodayAttendanceByEmployeeIds,
  getMyAttendanceByDate,
  checkInMyAttendance,
  checkOutMyAttendance,
  create,
};
