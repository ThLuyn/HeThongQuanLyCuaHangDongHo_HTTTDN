const Employee = require("../models/Employee");
const { success, fail } = require("../utils/response");

async function getEmployees(req, res, next) {
  try {
    const employees = await Employee.listAll();
    return success(res, employees, "Employee list loaded");
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

module.exports = {
  getEmployees,
  getLeaveRequests,
  approveLeave,
  calculateSalary,
};
