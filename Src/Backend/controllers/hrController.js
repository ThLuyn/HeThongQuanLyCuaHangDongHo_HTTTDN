const Employee = require("../models/Employee");
const Position = require("../models/Position");
const { success, fail } = require("../utils/response");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const leaveEvidenceUploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "leave-evidences",
);

if (!fs.existsSync(leaveEvidenceUploadDir)) {
  fs.mkdirSync(leaveEvidenceUploadDir, { recursive: true });
}

const leaveEvidenceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, leaveEvidenceUploadDir),
  filename: (_req, file, cb) => {
    const safeBaseName = String(file.originalname || "evidence")
      .replace(/\.[^.]+$/, "")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 60);
    const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
    cb(null, `${Date.now()}-${safeBaseName || "evidence"}${ext}`);
  },
});

const leaveEvidenceUpload = multer({
  storage: leaveEvidenceStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedMimeTypes.includes(String(file.mimetype || "").toLowerCase())) {
      cb(new Error("Only .jpg, .png, .webp, .pdf files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const uploadLeaveEvidenceMiddleware = leaveEvidenceUpload.single("evidence");

function getVietnamDateString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function resolveAttendanceDate(input) {
  const raw = String(input || "").trim();
  const dateText = raw || getVietnamDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return null;
  }
  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return dateText;
}

async function getEmployees(req, res, next) {
  try {
    const employees = await Employee.listAll();
    return success(res, employees, "Employee list loaded");
  } catch (error) {
    return next(error);
  }
}

async function getEmployeeDetail(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid employee id", 400);
    }

    const profile = await Employee.findById(id);
    if (!profile) {
      return fail(res, "Employee not found", 404);
    }

    return success(
      res,
      {
        mnv: profile.MNV,
        username: profile.TDN || null,
        fullName: profile.HOTEN,
        groupName: profile.TENNHOMQUYEN || null,
        chucVu: profile.TENCHUCVU || null,
        gioiTinh: profile.GIOITINH,
        ngaySinh: profile.NGAYSINH,
        soDienThoai: profile.SDT,
        email: profile.EMAIL,
        trangThai: Number(profile.TT),
        trangThaiTaiKhoan: Number(profile.TRANGTHAI_TAIKHOAN ?? 0),
        queQuan: profile.QUEQUAN || null,
        diaChi: profile.DIACHI || null,
        hinhAnh: profile.HINHANH || null,
        ngayVaoLam: profile.NGAYVAOLAM || null,
        cccd: profile.CCCD || null,
        boPhan: profile.BOPHAN || null,
        ngayNghiViec: profile.NGAYNGHIVIEC || null,
        soTaiKhoanNganHang: profile.SOTAIKHOAN || null,
        tenNganHang: profile.TENNGANHANG || null,
        luongCoBan: Number(profile.LUONGCOBAN || 0),
        tyLeHoaHong: Number(profile.TY_LE_HOA_HONG || 0),
      },
      "Employee detail loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function getLeaveRequests(req, res, next) {
  try {
    const { status } = req.query;
    const leaveRequests = await Employee.listLeaveRequests(status);
    return success(res, leaveRequests, "Leave requests loaded");
  } catch (error) {
    return next(error);
  }
}

async function getMyLeaveRequests(req, res, next) {
  try {
    const currentMnv = Number(req.user?.mnv || 0);

    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const leaveRequests = await Employee.listMyLeaveRequests(currentMnv);
    return success(res, leaveRequests, "My leave requests loaded");
  } catch (error) {
    return next(error);
  }
}

async function createMyLeaveRequest(req, res, next) {
  try {
    const currentMnv = Number(req.user?.mnv || 0);

    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const type = Number(req.body?.type);
    const startDate = String(req.body?.startDate || "").trim();
    const endDateInput = String(req.body?.endDate || "").trim();
    const resignationDateInput = String(req.body?.resignationDate || "").trim();
    const daysInput = Number(req.body?.days);
    const reason = String(req.body?.reason || "").trim();
    const evidencePath = req.file
      ? `/uploads/leave-evidences/${req.file.filename}`
      : null;

    if (!reason) {
      return fail(res, "reason is required", 400);
    }

    if (![0, 1, 2, 3].includes(type)) {
      return fail(res, "type must be 0, 1, 2 or 3", 400);
    }

    if (evidencePath && ![0, 2].includes(type)) {
      return fail(
        res,
        "minh chung chỉ áp dụng cho loại phép năm hoặc chế độ",
        400,
      );
    }

    if (!startDate || Number.isNaN(new Date(startDate).getTime())) {
      return fail(res, "startDate is required and must be a valid date", 400);
    }

    const start = new Date(startDate);
    const isValidDate = (value) =>
      value && !Number.isNaN(new Date(value).getTime());
    const normalize = (value) => new Date(value).toISOString().slice(0, 10);

    let endDate = "";
    if (type === 3) {
      const resignationDate = resignationDateInput || startDate;
      if (!isValidDate(resignationDate)) {
        return fail(res, "resignationDate must be a valid date", 400);
      }
      endDate = normalize(resignationDate);
    } else if (isValidDate(endDateInput)) {
      endDate = normalize(endDateInput);
    } else if (
      Number.isInteger(daysInput) &&
      daysInput > 0 &&
      daysInput <= 365
    ) {
      const computedEnd = new Date(start);
      computedEnd.setDate(computedEnd.getDate() + daysInput - 1);
      endDate = computedEnd.toISOString().slice(0, 10);
    } else {
      return fail(
        res,
        "endDate is required (or provide days between 1 and 365)",
        400,
      );
    }

    if (new Date(endDate) < start) {
      return fail(
        res,
        "endDate must be greater than or equal to startDate",
        400,
      );
    }

    const requestedDays =
      Math.floor(
        (new Date(endDate).getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
      ) + 1;

    if (
      !Number.isInteger(requestedDays) ||
      requestedDays <= 0 ||
      requestedDays > 365
    ) {
      return fail(res, "leave duration must be between 1 and 365 days", 400);
    }

    const isOverlap = await Employee.hasLeaveOverlap(
      currentMnv,
      startDate,
      endDate,
    );
    if (isOverlap) {
      return fail(
        res,
        "Đơn xin nghỉ bị trùng lịch với đơn đã tồn tại (chờ duyệt hoặc đã duyệt)",
        400,
      );
    }

    if (type === 0) {
      const leaveBalance = await Employee.getAnnualLeaveBalance(
        currentMnv,
        startDate,
      );

      if (Number(requestedDays) > Number(leaveBalance.remaining || 0)) {
        return fail(
          res,
          `Số dư phép năm không đủ. Còn lại ${leaveBalance.remaining} ngày`,
          400,
        );
      }
    }

    const result = await Employee.createLeaveRequest(currentMnv, {
      type,
      startDate,
      endDate,
      resignationDate: type === 3 ? endDate : null,
      reason,
      evidencePath,
    });

    return success(
      res,
      {
        id: Number(result.insertId),
      },
      "Leave request created",
      201,
    );
  } catch (error) {
    return next(error);
  }
}

async function approveLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (![1, 2, "1", "2"].includes(status)) {
      return fail(res, "status must be 1 (approved) or 2 (rejected)", 400);
    }

    await Employee.approveLeaveRequest(id, status, req.user?.mnv || null, note);
    return success(res, null, "Leave request updated");
  } catch (error) {
    return next(error);
  }
}

async function calculateSalary(req, res, next) {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const payroll = await Employee.getPayrollByMonth(month, year);
    return success(
      res,
      {
        month,
        year,
        records: payroll,
      },
      "Payroll loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function calculateMySalary(req, res, next) {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const currentMnv = Number(req.user?.mnv || 0);

    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const record = await Employee.getPayrollByMonthAndEmployee(
      currentMnv,
      month,
      year,
      req.user?.role,
    );

    return success(
      res,
      {
        month,
        year,
        record,
      },
      "My payroll loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function resignEmployee(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid employee id", 400);
    }

    await Employee.markAsResigned(id);
    return success(res, null, "Employee marked as resigned");
  } catch (error) {
    return next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    const gender = Number(req.body?.gender);
    const birthDate = String(req.body?.birthDate || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim();
    const positionName = String(req.body?.positionName || "").trim();
    const status = Number(req.body?.status);
    const hometown = String(req.body?.hometown || "").trim();
    const startDate = String(req.body?.startDate || "").trim();
    const citizenId = String(req.body?.citizenId || "").trim();
    const department = String(req.body?.department || "").trim();

    if (!fullName) {
      return fail(res, "fullName is required", 400);
    }

    if (![0, 1].includes(gender)) {
      return fail(res, "gender must be 0 or 1", 400);
    }

    if (!birthDate || Number.isNaN(new Date(birthDate).getTime())) {
      return fail(res, "birthDate is required and must be a valid date", 400);
    }

    if (!/^\d{10,11}$/.test(phone)) {
      return fail(res, "phone must contain 10 to 11 digits", 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, "email is invalid", 400);
    }

    if (!positionName) {
      return fail(res, "positionName is required", 400);
    }

    if (![0, 1].includes(status)) {
      return fail(res, "status must be 0 or 1", 400);
    }

    if (!hometown) {
      return fail(res, "hometown is required", 400);
    }

    if (!startDate || Number.isNaN(new Date(startDate).getTime())) {
      return fail(res, "startDate is required and must be a valid date", 400);
    }

    if (!/^\d{9,12}$/.test(citizenId)) {
      return fail(res, "citizenId must contain 9 to 12 digits", 400);
    }

    const position = await Employee.findPositionByName(positionName);
    if (!position) {
      return fail(res, "positionName does not exist", 400);
    }

    const result = await Employee.create({
      fullName,
      gender,
      birthDate,
      phone,
      email,
      positionId: Number(position.MCV),
      status,
      hometown,
      startDate,
      citizenId,
      department,
    });

    return success(
      res,
      {
        id: Number(result.insertId),
      },
      "Employee created",
      201,
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      const duplicateMessage = String(error?.sqlMessage || "").toLowerCase();
      if (duplicateMessage.includes("sdt")) {
        return fail(res, "Phone number already exists", 400);
      }
      if (duplicateMessage.includes("email")) {
        return fail(res, "Email already exists", 400);
      }
      if (duplicateMessage.includes("cccd")) {
        return fail(res, "Citizen ID already exists", 400);
      }
      return fail(res, "Duplicate employee information", 400);
    }

    return next(error);
  }
}

async function getPositions(req, res, next) {
  try {
    const rows = await Position.listAll();
    return success(
      res,
      rows.map((row) => ({
        id: Number(row.MCV),
        positionName: row.TEN,
        baseSalary: Number(row.LUONGCOBAN || 0),
        commissionRate: Number(row.TY_LE_HOA_HONG || 0),
        status: Number(row.TT || 0),
      })),
      "Positions loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function getPositionWorkHistory(req, res, next) {
  try {
    const rows = await Position.listWorkHistory();
    return success(
      res,
      rows.map((row) => ({
        id: Number(row.MLS),
        employeeId: Number(row.MNV),
        employeeName: row.HOTEN,
        oldPositionId: row.MCV_CU == null ? null : Number(row.MCV_CU),
        oldPositionName: row.TENCHUCVU_CU || null,
        oldBaseSalary: Number(row.LUONGCOBAN_CU || 0),
        newPositionId: Number(row.MCV_MOI),
        newPositionName: row.TENCHUCVU_MOI || null,
        newBaseSalary: Number(row.LUONGCOBAN_MOI || 0),
        effectiveDate: row.NGAY_HIEULUC,
        endDate: row.NGAY_KETTHUC || null,
        note: row.GHICHU || null,
        approverId: Number(row.MNV_DUYET),
        approverName: row.HOTEN_DUYET || null,
      })),
      "Work history loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function updatePosition(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid position id", 400);
    }

    const baseSalary = Number(req.body?.baseSalary);
    const commissionRate = Number(req.body?.commissionRate);
    const status = Number(req.body?.status);

    if (!Number.isFinite(baseSalary) || baseSalary <= 0) {
      return fail(res, "baseSalary must be greater than 0", 400);
    }

    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      return fail(res, "commissionRate must be between 0 and 100", 400);
    }

    if (![0, 1].includes(status)) {
      return fail(res, "status must be 0 or 1", 400);
    }

    const found = await Position.findById(id);
    if (!found) {
      return fail(res, "Position not found", 404);
    }

    await Position.updateById(id, {
      baseSalary,
      commissionRate,
      status,
    });

    return success(res, null, "Position updated");
  } catch (error) {
    return next(error);
  }
}

async function createPosition(req, res, next) {
  try {
    const positionName = String(req.body?.positionName || "").trim();
    const baseSalary = Number(req.body?.baseSalary);
    const commissionRate = Number(req.body?.commissionRate);
    const status = Number(req.body?.status);

    if (!positionName) {
      return fail(res, "positionName is required", 400);
    }

    if (!Number.isFinite(baseSalary) || baseSalary <= 0) {
      return fail(res, "baseSalary must be greater than 0", 400);
    }

    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      return fail(res, "commissionRate must be between 0 and 100", 400);
    }

    if (![0, 1].includes(status)) {
      return fail(res, "status must be 0 or 1", 400);
    }

    const result = await Position.create({
      positionName,
      baseSalary,
      commissionRate,
      status,
    });

    return success(
      res,
      {
        id: Number(result.insertId),
      },
      "Position created",
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Position name already exists", 400);
    }
    return next(error);
  }
}

async function transferEmployeePosition(req, res, next) {
  try {
    const employeeId = Number(req.body?.employeeId);
    const newPositionId = Number(req.body?.newPositionId);
    const effectiveDate = String(req.body?.effectiveDate || "").trim();
    const note = String(req.body?.note || "").trim();
    const approverId = Number(req.user?.mnv || 0);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return fail(res, "employeeId is invalid", 400);
    }

    if (!Number.isInteger(newPositionId) || newPositionId <= 0) {
      return fail(res, "newPositionId is invalid", 400);
    }

    if (!effectiveDate || Number.isNaN(new Date(effectiveDate).getTime())) {
      return fail(
        res,
        "effectiveDate is required and must be a valid date",
        400,
      );
    }

    if (!approverId) {
      return fail(res, "Approver is invalid", 401);
    }

    const result = await Position.transferEmployeePosition({
      employeeId,
      newPositionId,
      effectiveDate,
      note,
      approverId,
    });

    return success(
      res,
      {
        historyId: Number(result.historyId),
        previousPositionId: Number(result.previousPositionId),
      },
      "Employee transferred successfully",
    );
  } catch (error) {
    if (error?.statusCode === 404 || error?.statusCode === 400) {
      return fail(res, error.message, error.statusCode);
    }
    return next(error);
  }
}

async function getHolidays(req, res, next) {
  try {
    const yearParam = req.query?.year;
    const year =
      yearParam === undefined || yearParam === null || yearParam === ""
        ? undefined
        : Number(yearParam);

    if (
      year !== undefined &&
      (!Number.isInteger(year) || year < 2000 || year > 2100)
    ) {
      return fail(res, "year must be an integer between 2000 and 2100", 400);
    }

    const rows = await Employee.listHolidays(year);
    return success(
      res,
      rows.map((row) => ({
        id: Number(row.ID),
        name: row.TENLE,
        date: row.NGAY,
        multiplier: Number(row.HESO_LUONG || 0),
        note: row.GHICHU || null,
      })),
      "Holiday multipliers loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function getTodayAttendance(req, res, next) {
  try {
    const attendanceDate = resolveAttendanceDate(req.query?.date);
    if (!attendanceDate) {
      return fail(res, "date must be in YYYY-MM-DD format", 400);
    }

    const [employees, presentEmployeeIds] = await Promise.all([
      Employee.listActiveEmployeesForAttendance(attendanceDate),
      Employee.listTodayAttendanceEmployeeIds(attendanceDate),
    ]);

    return success(
      res,
      {
        date: attendanceDate,
        employees: (employees || []).map((row) => ({
          mnv: Number(row.MNV),
          fullName: row.HOTEN,
          positionName: row.TENCHUCVU || null,
          status: Number(row.TT || 0),
          present: presentEmployeeIds.includes(Number(row.MNV)),
        })),
      },
      "Today attendance loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function saveTodayAttendance(req, res, next) {
  try {
    const attendanceDate = resolveAttendanceDate(req.body?.date);
    if (!attendanceDate) {
      return fail(res, "date must be in YYYY-MM-DD format", 400);
    }

    const presentEmployeeIds = Array.isArray(req.body?.presentEmployeeIds)
      ? req.body.presentEmployeeIds
      : [];

    const normalizedIds = Array.from(
      new Set(
        presentEmployeeIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0),
      ),
    );

    const presentCount = await Employee.saveTodayAttendanceByEmployeeIds(
      normalizedIds,
      attendanceDate,
    );

    return success(
      res,
      {
        date: attendanceDate,
        presentCount: Number(presentCount || 0),
      },
      "Today attendance saved",
    );
  } catch (error) {
    return next(error);
  }
}

async function getMyAttendanceStatus(req, res, next) {
  try {
    const currentMnv = Number(req.user?.mnv || 0);
    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const attendanceDate = resolveAttendanceDate(req.query?.date);
    if (!attendanceDate) {
      return fail(res, "date must be in YYYY-MM-DD format", 400);
    }

    const rows = await Employee.getMyAttendanceByDate(
      currentMnv,
      attendanceDate,
    );
    const shifts = (rows || []).map((row) => ({
      mpcl: Number(row.MPCL),
      shiftId: Number(row.MCA),
      shiftName: row.TENCA || null,
      startTime: row.GIO_BATDAU || null,
      endTime: row.GIO_KETTHUC || null,
      checkIn: row.GIO_CHECKIN || null,
      checkOut: row.GIO_CHECKOUT || null,
      status: Number(row.TT || 0),
    }));

    const canCheckIn = shifts.some((shift) => !shift.checkIn);
    const canCheckOut = shifts.some(
      (shift) => shift.checkIn && !shift.checkOut,
    );

    return success(
      res,
      {
        date: attendanceDate,
        hasShift: shifts.length > 0,
        canCheckIn,
        canCheckOut,
        shifts,
      },
      "My attendance loaded",
    );
  } catch (error) {
    return next(error);
  }
}

async function checkInAttendance(req, res, next) {
  try {
    const currentMnv = Number(req.user?.mnv || 0);
    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const attendanceDate = resolveAttendanceDate(req.body?.date);
    if (!attendanceDate) {
      return fail(res, "date must be in YYYY-MM-DD format", 400);
    }

    await Employee.checkInMyAttendance(currentMnv, attendanceDate);
    return success(
      res,
      {
        date: attendanceDate,
      },
      "Check-in thành công",
    );
  } catch (error) {
    if (error?.statusCode) {
      return fail(res, error.message, error.statusCode);
    }
    return next(error);
  }
}

async function checkOutAttendance(req, res, next) {
  try {
    const currentMnv = Number(req.user?.mnv || 0);
    if (!currentMnv) {
      return fail(res, "Invalid user", 401);
    }

    const attendanceDate = resolveAttendanceDate(req.body?.date);
    if (!attendanceDate) {
      return fail(res, "date must be in YYYY-MM-DD format", 400);
    }

    await Employee.checkOutMyAttendance(currentMnv, attendanceDate);
    return success(
      res,
      {
        date: attendanceDate,
      },
      "Check-out thành công",
    );
  } catch (error) {
    if (error?.statusCode) {
      return fail(res, error.message, error.statusCode);
    }
    return next(error);
  }
}

async function createHoliday(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    const date = String(req.body?.date || "").trim();
    const multiplier = Number(req.body?.multiplier);
    const note = String(req.body?.note || "").trim();

    if (!name) {
      return fail(res, "name is required", 400);
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return fail(res, "date is required and must be a valid date", 400);
    }

    if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 99.9) {
      return fail(
        res,
        "multiplier must be a number greater than 0 and less than or equal to 99.9",
        400,
      );
    }

    const isFinalized = await Employee.hasFinalizedPayrollByDate(date);
    if (isFinalized) {
      return fail(
        res,
        "Không thể thêm ngày lễ vì kỳ lương của tháng này đã thanh toán",
        400,
      );
    }

    const result = await Employee.createHoliday({
      name,
      date,
      multiplier,
      note,
    });

    return success(
      res,
      {
        id: Number(result.insertId),
      },
      "Holiday multiplier created",
      201,
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Ngày lễ này đã tồn tại", 400);
    }
    return next(error);
  }
}

async function updateHoliday(req, res, next) {
  try {
    const id = Number(req.params.id);
    const name = String(req.body?.name || "").trim();
    const date = String(req.body?.date || "").trim();
    const multiplier = Number(req.body?.multiplier);
    const note = String(req.body?.note || "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid holiday id", 400);
    }

    if (!name) {
      return fail(res, "name is required", 400);
    }

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return fail(res, "date is required and must be a valid date", 400);
    }

    if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 99.9) {
      return fail(
        res,
        "multiplier must be a number greater than 0 and less than or equal to 99.9",
        400,
      );
    }

    const found = await Employee.findHolidayById(id);
    if (!found) {
      return fail(res, "Holiday not found", 404);
    }

    const [isOldPeriodFinalized, isNewPeriodFinalized] = await Promise.all([
      Employee.hasFinalizedPayrollByDate(found.NGAY),
      Employee.hasFinalizedPayrollByDate(date),
    ]);

    if (isOldPeriodFinalized || isNewPeriodFinalized) {
      return fail(
        res,
        "Không thể cập nhật ngày lễ vì kỳ lương liên quan đã thanh toán",
        400,
      );
    }

    await Employee.updateHoliday(id, {
      name,
      date,
      multiplier,
      note,
    });

    return success(res, null, "Holiday multiplier updated");
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return fail(res, "Ngày lễ này đã tồn tại", 400);
    }
    return next(error);
  }
}

async function deleteHoliday(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(res, "Invalid holiday id", 400);
    }

    const found = await Employee.findHolidayById(id);
    if (!found) {
      return fail(res, "Holiday not found", 404);
    }

    const isFinalized = await Employee.hasFinalizedPayrollByDate(found.NGAY);
    if (isFinalized) {
      return fail(
        res,
        "Không thể xóa ngày lễ vì kỳ lương của tháng này đã thanh toán",
        400,
      );
    }

    await Employee.deleteHoliday(id);
    return success(res, null, "Holiday multiplier deleted");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadLeaveEvidenceMiddleware,
  getEmployees,
  createEmployee,
  getEmployeeDetail,
  getLeaveRequests,
  getMyLeaveRequests,
  createMyLeaveRequest,
  approveLeave,
  calculateSalary,
  calculateMySalary,
  resignEmployee,
  getPositions,
  getPositionWorkHistory,
  updatePosition,
  createPosition,
  transferEmployeePosition,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getTodayAttendance,
  saveTodayAttendance,
  getMyAttendanceStatus,
  checkInAttendance,
  checkOutAttendance,
};
