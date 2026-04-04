const Employee = require("../models/Employee");
const Position = require("../models/Position");
const { success, fail } = require("../utils/response");

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
    if (error?.statusCode === 404) {
      return fail(res, error.message, 404);
    }
    return next(error);
  }
}

module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeDetail,
  getLeaveRequests,
  approveLeave,
  calculateSalary,
  resignEmployee,
  getPositions,
  getPositionWorkHistory,
  updatePosition,
  createPosition,
  transferEmployeePosition,
};
