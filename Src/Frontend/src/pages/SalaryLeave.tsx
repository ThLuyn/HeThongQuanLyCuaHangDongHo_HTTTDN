// @ts-nocheck
import { BarChart3Icon, CalendarDaysIcon, PencilIcon, PlusIcon, PrinterIcon, Trash2Icon, TrendingDownIcon, TrendingUpIcon, UsersIcon, WalletIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import {
  createHolidayMultiplierApi,
  deleteHolidayMultiplierApi,
  finalizeSalaryApi,
  getHolidayMultipliersApi,
  getSalaryApi,
  getViolationPenaltiesApi,
  updateHolidayMultiplierApi,
} from '../utils/backendApi';
import {
  buildAllEmployeesMonthlyHtml,
  buildMonthlyPayslipHtml,
  buildYearlyPayrollHtml,
  formatMoney,
  openPrintWindow,
} from '../utils/payrollPrintTemplates';

const columns = [
  { key: 'id', label: 'Mã NV' },
  { key: 'name', label: 'Họ tên' },
  {
    key: 'baseSalary',
    label: 'Lương cơ bản',
    render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>,
  },
  {
    key: 'allowance',
    label: 'Hoa hồng',
    render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>,
  },
  {
    key: 'deduction',
    label: 'Khấu trừ',
    render: (val) => <span className="font-medium text-rose-700">{formatMoney(val)}</span>,
  },
  {
    key: 'takeHome',
    label: 'Thực lĩnh',
    render: (val) => <span className="font-semibold text-emerald-700">{formatMoney(val)}</span>,
  },
  {
    key: 'workingDays',
    label: 'Ngày công',
    render: (val) => <span className="font-medium text-gray-800">{Number(val || 0)} ngày</span>,
  },
  {
    key: 'leaveRemaining',
    label: 'Ngày nghỉ còn lại',
    render: (val) => (
      <span className={`font-medium ${Number(val) <= 5 ? 'text-red-600' : 'text-green-600'}`}>
        {val} ngày
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (val) => (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${val === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
        {val === 'Đã thanh toán' ? '✓ Đã thanh toán' : 'Tạm tính'}
      </span>
    ),
  },
];

export function SalaryLeave() {
  const [violations, setViolations] = useState([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [holidayRows, setHolidayRows] = useState([]);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidayFeatureUnavailable, setHolidayFeatureUnavailable] = useState(false);
  const [showAllHolidaysInYear, setShowAllHolidaysInYear] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayEditingId, setHolidayEditingId] = useState(null);
  const [notice, setNotice] = useState({
    type: 'info',
    message: '',
  });
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    multiplier: 2,
    note: '',
  });
  const [showYearlyStats, setShowYearlyStats] = useState(false);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [yearlyStatsLoading, setYearlyStatsLoading] = useState(false);

  const selectedMonth = Number(month);
  const selectedYear = Number(year);
  const START_YEAR = 2024;
  const yearOptions = Array.from(
    { length: now.getFullYear() - START_YEAR + 1 },
    (_, i) => START_YEAR + i,
  );

  const isHolidayRouteMissingError = (message) => {
    const normalized = String(message || '').toLowerCase();
    return normalized.includes('route not found') && normalized.includes('/api/hr/holidays');
  };

  const showNotice = (message, type = 'info') => {
    if (!message) {
      return;
    }
    setNotice({
      type,
      message: String(message),
    });
  };

  const loadYearlyStats = async (forYear?: number) => {
    const targetYear = forYear ?? selectedYear;
    setYearlyStatsLoading(true);
    setYearlyStats(null);
    try {
      const monthlyData = await Promise.all(
        Array.from({ length: 12 }, (_, i) => getSalaryApi(i + 1, targetYear)),
      );
      const aggregated = monthlyData.map((rows, i) => {
        const list = Array.isArray(rows) ? rows.map((r) => {
          // API có thể trả raw SQL fields hoặc đã mapped — handle cả hai
          const mapped = mapSalaryRow(r);
          return {
            takeHome: mapped.takeHome || Number(r.LUONGTHUCLANH || r.takeHome || 0),
            baseSalary: mapped.baseSalary || Number(r.LUONGCOBAN || r.baseSalary || 0),
            allowance: mapped.allowance || Number(r.HOA_HONG || r.PHUCAP || r.allowance || 0),
            deduction: mapped.deduction || Number(r.KHAUTRU || r.deduction || 0),
            workingDays: mapped.workingDays || Number(r.NGAYCONG || r.workingDays || 0),
          };
        }) : [];
        return {
          month: i + 1,
          count: list.length,
          totalTakeHome: list.reduce((s, r) => s + r.takeHome, 0),
          totalBaseSalary: list.reduce((s, r) => s + r.baseSalary, 0),
          totalCommission: list.reduce((s, r) => s + r.allowance, 0),
          totalDeduction: list.reduce((s, r) => s + r.deduction, 0),
          totalWorkingDays: list.reduce((s, r) => s + r.workingDays, 0),
        };
      });
      setYearlyStats(aggregated);
    } catch (e) {
      showNotice('Không thể tải thống kê năm', 'error');
    } finally {
      setYearlyStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!error) {
      return;
    }
    showNotice(error, 'error');
  }, [error]);

  useEffect(() => {
    if (!notice.message) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNotice((prev) => ({ ...prev, message: '' }));
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [notice.message]);

  useEffect(() => {
    const loadSalary = async () => {
      if (!Number.isInteger(selectedMonth) || !Number.isInteger(selectedYear)) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await getSalaryApi(selectedMonth, selectedYear);
        setRecords(Array.isArray(response) ? response : []);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Khong the tai du lieu luong';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadSalary();
  }, [selectedMonth, selectedYear]);

  // Reset yearly stats cache khi đổi năm, tự reload nếu đang xem tab năm
  useEffect(() => {
    setYearlyStats(null);
    if (showYearlyStats) {
      loadYearlyStats(selectedYear);
    }
  }, [selectedYear]);

  const mapSalaryRow = (row) => ({
    mbl: Number(row.MBL || 0),
    mnv: Number(row.MNV || 0),
    id: `NV${String(row.MNV).padStart(3, '0')}`,
    name: row.HOTEN,
    position: row.TENCHUCVU || 'Chưa cập nhật',
    baseSalary: Number(row.LUONGCOBAN || 0),
    allowance: Number(row.PHUCAP || 0),
    takeHome: Math.ceil(Number(row.LUONGTHUCLANH || 0)),
    workingDays: Number(row.NGAYCONG || 0),
    workingDaysRaw: Number(row.NGAYCONG_THUCTE || row.NGAYCONG || 0),
    holidayExtraDays: Number(row.NGAYCONG_LE_QUYDOI_THEM || 0),
    holidayWorkedDays: Number(row.SO_NGAY_LE_DI_LAM || 0),
    leaveRemaining:
      row.NGAYNGHI_CONLAI != null
        ? Math.max(0, Number(row.NGAYNGHI_CONLAI || 0))
        : Math.max(0, 12 - Math.round(Number(row.NGAYCONG || 0) / 2)),
    leaveUsed: Number(row.NGAYNGHI_DA_DUNG || 0),
    leaveUnpaidDays: Number(row.NGAY_NGHI_KHONG_LUONG || row.NGAYNGHI_KP || 0),
    revenue: Number(row.DOANH_SO || 0),
    commissionRate: Number(row.TY_LE_HOA_HONG || 0),
    commission: Number(row.HOA_HONG || row.PHUCAP || 0),
    bhxh: Number(row.BHXH || 0),
    bhyt: Number(row.BHYT || 0),
    bhtn: Number(row.BHTN || 0),
    khauTruKhac: Number(row.KHAUTRU_KHAC || 0),
    deduction: Number(row.KHAUTRU || 0),
    status: Number(row.TT) === 2 ? 'Đã thanh toán' : 'Tạm tính',
  });

  useEffect(() => {
    const loadHolidays = async () => {
      if (!Number.isInteger(selectedYear)) {
        return;
      }

      try {
        setHolidayLoading(true);
        const rows = await getHolidayMultipliersApi(selectedYear);
        setHolidayRows(Array.isArray(rows) ? rows : []);
        setHolidayFeatureUnavailable(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Không thể tải cấu hình ngày lễ';
        if (isHolidayRouteMissingError(message)) {
          setHolidayFeatureUnavailable(true);
          setHolidayRows([]);
        } else {
          setError(message);
        }
      } finally {
        setHolidayLoading(false);
      }
    };

    loadHolidays();
  }, [selectedYear]);

  const tableData = useMemo(
    () => records.map((row) => mapSalaryRow(row)),
    [records],
  );


  const holidayRowsByPayrollPeriod = useMemo(
    () =>
      holidayRows.filter((row) => {
        const day = new Date(row.date);
        if (Number.isNaN(day.getTime())) {
          return false;
        }
        if (day.getFullYear() !== selectedYear) {
          return false;
        }
        if (showAllHolidaysInYear) {
          return true;
        }
        return day.getMonth() + 1 === selectedMonth;
      }),
    [holidayRows, selectedMonth, selectedYear, showAllHolidaysInYear],
  );

  const openDetail = async (row) => {
    let detailRow = row;
    try {
      const latestRows = await getSalaryApi(selectedMonth, selectedYear);
      if (Array.isArray(latestRows)) {
        setRecords(latestRows);
        const matched = latestRows.find(
          (item) => Number(item.MNV) === Number(row.mnv || 0),
        );
        if (matched) {
          detailRow = mapSalaryRow(matched);
        }
      }
    } catch {
      // Keep existing row if refresh fails.
    }

    setSelectedEmployee(detailRow);
    setDetailOpen(true);

    // Lấy danh sách vi phạm khi mở chi tiết
    setViolationsLoading(true);
    setViolations([]);
    try {
      const viol = await getViolationPenaltiesApi(detailRow.mnv, selectedMonth, selectedYear);
      setViolations(Array.isArray(viol) ? viol : []);
    } catch {
      setViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  const openCreateHolidayModal = () => {
    const dateValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    setHolidayEditingId(null);
    setHolidayForm({
      name: '',
      date: dateValue,
      multiplier: 2,
      note: '',
    });
    setHolidayModalOpen(true);
  };

  const openEditHolidayModal = (row) => {
    setHolidayEditingId(Number(row.id));
    setHolidayForm({
      name: String(row.name || ''),
      date: String(row.date || '').slice(0, 10),
      multiplier: Number(row.multiplier || 1),
      note: String(row.note || ''),
    });
    setHolidayModalOpen(true);
  };

  const handleDeleteHoliday = async (row) => {
    if (!row?.id) {
      return;
    }

    if (!confirm(`Xóa ngày lễ "${row.name}"?`)) {
      return;
    }

    try {
      await deleteHolidayMultiplierApi(Number(row.id));
      setHolidayRows((prev) => prev.filter((item) => Number(item.id) !== Number(row.id)));
      showNotice('Đã xóa ngày lễ thành công', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể xóa ngày lễ';
      setError(message);
    }
  };

  const handleSaveHoliday = async () => {
    const name = String(holidayForm.name || '').trim();
    const date = String(holidayForm.date || '').trim();
    const multiplier = Number(holidayForm.multiplier);
    const note = String(holidayForm.note || '').trim();

    if (!name) {
      setError('Tên ngày lễ là bắt buộc');
      return;
    }

    if (!date) {
      setError('Ngày áp dụng là bắt buộc');
      return;
    }

    if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 99.9) {
      setError('Hệ số phải là số lớn hơn 0 và tối đa 99.9');
      return;
    }

    try {
      if (holidayEditingId) {
        await updateHolidayMultiplierApi(holidayEditingId, {
          name,
          date,
          multiplier,
          note,
        });
      } else {
        await createHolidayMultiplierApi({
          name,
          date,
          multiplier,
          note,
        });
      }

      const rows = await getHolidayMultipliersApi(selectedYear);
      setHolidayRows(Array.isArray(rows) ? rows : []);
      setHolidayModalOpen(false);
      setHolidayEditingId(null);
      showNotice(holidayEditingId ? 'Đã cập nhật ngày lễ thành công' : 'Đã thêm ngày lễ thành công', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể lưu ngày lễ';
      setError(message);
    }
  };

  const handlePrintPayrollMonth = (employee) => {
    if (!employee) {
      return;
    }

    const html = buildMonthlyPayslipHtml({
      employee,
      selectedMonth,
      selectedYear,
    });
    openPrintWindow(
      `Phiếu lương ${employee.id} - ${selectedMonth}/${selectedYear}`,
      html,
    );
  };

  const handlePrintPayrollYear = async (employee) => {
    if (!employee || !employee.mnv) {
      return;
    }

    try {
      const monthlyRows = await Promise.all(
        Array.from({ length: 12 }, async (_item, index) => {
          const currentMonth = index + 1;
          const rows = await getSalaryApi(currentMonth, selectedYear);
          const found = (Array.isArray(rows) ? rows : []).find(
            (item) => Number(item.MNV) === Number(employee.mnv),
          );
          return {
            month: currentMonth,
            takeHome: Number(found?.LUONGTHUCLANH || 0),
            commission: Number(found?.HOA_HONG || found?.PHUCAP || 0),
            deduction: Number(found?.KHAUTRU || 0),
            workDays: Number(found?.NGAYCONG || 0),
          };
        }),
      );

      const totalTakeHome = monthlyRows.reduce(
        (sum, item) => sum + Number(item.takeHome || 0),
        0,
      );
      const totalCommission = monthlyRows.reduce(
        (sum, item) => sum + Number(item.commission || 0),
        0,
      );
      const totalDeduction = monthlyRows.reduce(
        (sum, item) => sum + Number(item.deduction || 0),
        0,
      );
      const totalWorkDays = monthlyRows.reduce(
        (sum, item) => sum + Number(item.workDays || 0),
        0,
      );

      const html = buildYearlyPayrollHtml({
        employee,
        selectedYear,
        monthlyRows,
        totalWorkDays,
        totalCommission,
        totalDeduction,
        totalTakeHome,
      });

      openPrintWindow(
        `Bảng tổng hợp lương năm ${selectedYear} - ${employee.id}`,
        html,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể in tổng hợp lương năm';
      setError(message);
    }
  };

  const handleFinalizeSalary = async (row) => {
    if (!row || !row.mbl) {
      showNotice('Không có dữ liệu bảng lương', 'error');
      return;
    }

    if (!confirm(`Chốt lương cho nhân viên ${row.name}?`)) {
      return;
    }

    try {
      await finalizeSalaryApi(row.mbl);
      showNotice(`Chốt lương thành công cho ${row.name}`, 'success');
      // Reload lại dữ liệu
      const newRecords = await getSalaryApi(selectedMonth, selectedYear);
      setRecords(newRecords || []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể chốt lương';
      showNotice(message, 'error');
    }
  };

  const handlePrintAllEmployeesMonth = () => {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      return;
    }

    const totalBaseSalary = tableData.reduce((sum, item) => sum + Number(item.baseSalary || 0), 0);

    const totalGross = tableData.reduce((sum, item) => {
      const salaryByTime = Math.round((Number(item.baseSalary || 0) / 26) * Number(item.workingDays || 0));
      return sum + salaryByTime + Number(item.allowance || 0);
    }, 0);
    const totalDeduction = tableData.reduce((sum, item) => sum + Number(item.deduction || 0), 0);
    const totalTakeHome = tableData.reduce((sum, item) => sum + Number(item.takeHome || 0), 0);

    const html = buildAllEmployeesMonthlyHtml({
      rows: tableData,
      selectedMonth,
      selectedYear,
      totalBaseSalary,
      totalGross,
      totalDeduction,
      totalTakeHome,
    });

    openPrintWindow(`Bang thanh toan luong thang ${selectedMonth}-${selectedYear}`, html);
  };

  // Tính các biến cho modal chi tiết (dùng selectedEmployee + violations)
  const violationTotal = violations.reduce(
    (sum, v) => sum + Number(v.penaltyAmount || 0) * Number(v.violationCount || 1),
    0,
  );
  const effectiveKhauTruKhac =
    violationTotal > 0 ? violationTotal : (selectedEmployee?.khauTruKhac ?? 0);
  const effectiveTotalDeduction = selectedEmployee
    ? selectedEmployee.bhxh + selectedEmployee.bhyt + selectedEmployee.bhtn + effectiveKhauTruKhac
    : 0;

  return (
    <div className="space-y-4">
      {notice.message ? (
        <div className="fixed right-4 top-4 z-[70] w-[min(92vw,420px)]">
          <div
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : notice.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
          >
            <p className="leading-relaxed">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice((prev) => ({ ...prev, message: '' }))}
              className="rounded-md px-2 py-0.5 text-sm font-semibold leading-none hover:bg-black/5"
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Kỳ lương:</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
          >
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>Năm {y}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handlePrintAllEmployeesMonth}
          disabled={tableData.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PrinterIcon className="h-4 w-4" />
          In lương tất cả nhân viên
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-gray-900">Thiết lập hệ số lương ngày lễ</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllHolidaysInYear((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showAllHolidaysInYear
                ? `Xem theo kỳ lương ${selectedMonth}/${selectedYear}`
                : `Xem tất cả trong năm ${selectedYear}`}
            </button>
            <button
              type="button"
              onClick={openCreateHolidayModal}
              disabled={holidayFeatureUnavailable}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4" />
              Thêm ngày lễ
            </button>
          </div>
        </div>

        {holidayFeatureUnavailable ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Backend hiện chưa bật API ngày lễ. Vui lòng khởi động lại backend để nạp route mới `/api/hr/holidays`.
          </p>
        ) : null}

        {holidayLoading ? (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">Đang tải danh sách ngày lễ...</p>
        ) : holidayRowsByPayrollPeriod.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {showAllHolidaysInYear
              ? `Chưa có ngày lễ nào trong năm ${selectedYear}.`
              : `Chưa có ngày lễ nào trong kỳ lương tháng ${selectedMonth}/${selectedYear}.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">Ngày</th>
                  <th className="px-3 py-2 font-medium">Tên ngày lễ</th>
                  <th className="px-3 py-2 font-medium">Hệ số</th>
                  <th className="px-3 py-2 font-medium">Ghi chú</th>
                  <th className="px-3 py-2 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {holidayRowsByPayrollPeriod.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 text-gray-700 last:border-0">
                    <td className="px-3 py-2">{new Date(row.date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        x{Number(row.multiplier || 2)}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.note || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditHolidayModal(row)}
                          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                          title="Sửa"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(row)}
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gold-200 bg-gold-50 px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">Công thức lương thực lãnh</p>
        <p className="mt-2 text-sm text-gold-900">
          Ngày công quy đổi = Ngày công thực tế + Tổng (Hệ số ngày lễ - 1) cho các ngày lễ đi làm
        </p>
        <p className="mt-1 text-sm text-gold-900">
          Lương thực lãnh = (Lương cơ bản / 26) x Ngày công quy đổi + Hoa hồng - (BHXH + BHYT + BHTN + Khấu trừ khác)
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Đang tải dữ liệu bảng lương...
        </div>
      ) : null}

      {/* ===== THỐNG KÊ TỔNG HỢP ===== */}
      {tableData.length > 0 && (() => {
        const totalEmployees = tableData.length;
        const paidCount = tableData.filter((r) => r.status === 'Đã thanh toán').length;
        const pendingCount = totalEmployees - paidCount;
        const totalTakeHome = tableData.reduce((s, r) => s + Number(r.takeHome || 0), 0);
        const totalBaseSalary = tableData.reduce((s, r) => s + Number(r.baseSalary || 0), 0);
        const totalCommission = tableData.reduce((s, r) => s + Number(r.allowance || 0), 0);
        const totalDeduction = tableData.reduce((s, r) => s + Number(r.deduction || 0), 0);
        const totalWorkingDays = tableData.reduce((s, r) => s + Number(r.workingDays || 0), 0);
        const avgWorkingDays = totalEmployees > 0 ? (totalWorkingDays / totalEmployees).toFixed(1) : 0;
        const avgTakeHome = totalEmployees > 0 ? Math.round(totalTakeHome / totalEmployees) : 0;
        const maxSalary = Math.max(...tableData.map((r) => Number(r.takeHome || 0)));
        const minSalary = Math.min(...tableData.map((r) => Number(r.takeHome || 0)));
        const totalLeaveRemaining = tableData.reduce((s, r) => s + Number(r.leaveRemaining || 0), 0);

        // Yearly aggregated
        const yTotal = yearlyStats
          ? {
            takeHome: yearlyStats.reduce((s, m) => s + m.totalTakeHome, 0),
            commission: yearlyStats.reduce((s, m) => s + m.totalCommission, 0),
            baseSalary: yearlyStats.reduce((s, m) => s + m.totalBaseSalary, 0),
            deduction: yearlyStats.reduce((s, m) => s + m.totalDeduction, 0),
            activeMonths: yearlyStats.filter((m) => m.count > 0).length,
            peakMonth: yearlyStats.reduce((best, m) => m.totalTakeHome > best.totalTakeHome ? m : best, yearlyStats[0]),
          }
          : null;

        const monthStatCards = [
          { label: 'Tổng nhân viên', value: `${totalEmployees} người`, sub: `${paidCount} đã chốt · ${pendingCount} tạm tính`, icon: UsersIcon, color: 'blue' },
          { label: 'Tổng thực lĩnh', value: formatMoney(totalTakeHome), sub: `Bình quân ${formatMoney(avgTakeHome)}/người`, icon: WalletIcon, color: 'emerald' },
          { label: 'Tổng hoa hồng', value: formatMoney(totalCommission), sub: `Lương cơ bản: ${formatMoney(totalBaseSalary)}`, icon: TrendingUpIcon, color: 'gold' },
          { label: 'Tổng khấu trừ', value: formatMoney(totalDeduction), sub: `Tỷ lệ: ${totalTakeHome > 0 ? ((totalDeduction / (totalTakeHome + totalDeduction)) * 100).toFixed(1) : 0}% tổng thu`, icon: TrendingDownIcon, color: 'rose' },
          { label: 'Ngày công TB', value: `${avgWorkingDays} ngày`, sub: `Phép còn lại TB: ${totalEmployees > 0 ? (totalLeaveRemaining / totalEmployees).toFixed(1) : 0} ngày`, icon: BarChart3Icon, color: 'violet' },
          { label: 'Cao nhất / Thấp nhất', value: formatMoney(maxSalary), sub: `Thấp nhất: ${formatMoney(minSalary)}`, icon: BarChart3Icon, color: 'amber' },
        ];

        const yearStatCards = yTotal ? [
          { label: 'Tổng thực lĩnh năm', value: formatMoney(yTotal.takeHome), sub: `${yTotal.activeMonths} tháng có dữ liệu`, icon: WalletIcon, color: 'emerald' },
          { label: 'Tổng hoa hồng năm', value: formatMoney(yTotal.commission), sub: `Lương cơ bản: ${formatMoney(yTotal.baseSalary)}`, icon: TrendingUpIcon, color: 'gold' },
          { label: 'Tổng khấu trừ năm', value: formatMoney(yTotal.deduction), sub: `Tỷ lệ: ${yTotal.takeHome > 0 ? ((yTotal.deduction / (yTotal.takeHome + yTotal.deduction)) * 100).toFixed(1) : 0}% tổng thu`, icon: TrendingDownIcon, color: 'rose' },
          { label: 'Tháng lương cao nhất', value: `Tháng ${yTotal.peakMonth?.month}`, sub: `Thực lĩnh: ${formatMoney(yTotal.peakMonth?.totalTakeHome)}`, icon: BarChart3Icon, color: 'violet' },
          { label: 'TB thực lĩnh/tháng', value: formatMoney(yTotal.activeMonths > 0 ? Math.round(yTotal.takeHome / yTotal.activeMonths) : 0), sub: `Trên ${yTotal.activeMonths} tháng có dữ liệu`, icon: BarChart3Icon, color: 'blue' },
        ] : [];

        const colorMap = {
          blue: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-500', label: 'text-blue-700', val: 'text-blue-900' },
          emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-500', label: 'text-emerald-700', val: 'text-emerald-900' },
          gold: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-500', label: 'text-amber-700', val: 'text-amber-900' },
          rose: { bg: 'bg-rose-50', border: 'border-rose-100', icon: 'text-rose-500', label: 'text-rose-700', val: 'text-rose-900' },
          violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-500', label: 'text-violet-700', val: 'text-violet-900' },
          amber: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'text-orange-500', label: 'text-orange-700', val: 'text-orange-900' },
        };

        const activeCards = showYearlyStats ? yearStatCards : monthStatCards;

        return (
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-gray-500" />
                <p className="text-lg font-semibold text-gray-900">
                  {showYearlyStats
                    ? `Thống kê cả năm ${selectedYear}`
                    : `Thống kê tháng ${selectedMonth}/${selectedYear}`}
                </p>
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => setShowYearlyStats(false)}
                  className={`px-3 py-1.5 font-medium transition-colors ${!showYearlyStats ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Theo tháng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowYearlyStats(true);
                    if (!yearlyStats && !yearlyStatsLoading) loadYearlyStats(selectedYear);
                  }}
                  className={`px-3 py-1.5 font-medium transition-colors ${showYearlyStats ? 'bg-gold-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Cả năm {selectedYear}
                </button>
              </div>
            </div>

            {showYearlyStats && yearlyStatsLoading && (
              <p className="text-sm text-gray-500 py-2">Đang tải dữ liệu cả năm...</p>
            )}

            {(!showYearlyStats || (!yearlyStatsLoading && activeCards.length > 0)) && (
              <div
                className="grid gap-3 grid-cols-2 sm:grid-cols-3"
                style={{ gridTemplateColumns: `repeat(${activeCards.length}, minmax(0, 1fr))` }}
              >
                {activeCards.map((card) => {
                  const c = colorMap[card.color];
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className={`rounded-xl border ${c.border} ${c.bg} p-3 flex flex-col gap-1.5`}>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${c.icon}`} />
                        <p className={`text-sm font-semibold ${c.label}`}>{card.label}</p>
                      </div>
                      <p className={`text-base font-bold leading-snug ${c.val}`}>{card.value}</p>
                      <p className="text-sm text-gray-500 leading-snug">{card.sub}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {showYearlyStats && !yearlyStatsLoading && yearlyStats && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="px-3 py-2 font-medium">Tháng</th>
                      <th className="px-3 py-2 font-medium text-right">Thực lĩnh</th>
                      <th className="px-3 py-2 font-medium text-right">Hoa hồng</th>
                      <th className="px-3 py-2 font-medium text-right">Khấu trừ</th>
                      <th className="px-3 py-2 font-medium text-right">NV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyStats.map((m) => (
                      <tr key={m.month} className={`border-b border-gray-50 last:border-0 ${m.month === selectedMonth ? 'bg-gold-50' : ''}`}>
                        <td className="px-3 py-2 font-medium text-gray-700">
                          Tháng {m.month}
                          {m.month === selectedMonth && <span className="ml-1.5 text-xs text-gold-600">(hiện tại)</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-700">{m.count > 0 ? formatMoney(m.totalTakeHome) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{m.count > 0 ? formatMoney(m.totalCommission) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-2 text-right text-rose-600">{m.count > 0 ? formatMoney(m.totalDeduction) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{m.count > 0 ? `${m.count}` : <span className="text-gray-300">—</span>}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold text-gray-800 border-t border-gray-200">
                      <td className="px-3 py-2">Tổng năm {selectedYear}</td>
                      <td className="px-3 py-2 text-right text-emerald-800">{formatMoney(yearlyStats.reduce((s, m) => s + m.totalTakeHome, 0))}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(yearlyStats.reduce((s, m) => s + m.totalCommission, 0))}</td>
                      <td className="px-3 py-2 text-right text-rose-700">{formatMoney(yearlyStats.reduce((s, m) => s + m.totalDeduction, 0))}</td>
                      <td className="px-3 py-2 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      <DataTable
        title={`Quản lý lương nhân viên - Tháng ${selectedMonth}/${selectedYear}`}
        columns={columns}
        data={tableData}
        searchPlaceholder="Tìm kiếm..."
        rowActions={[
          {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: openDetail,
            className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
          },
          {
            key: 'finalize',
            label: '✓ Chốt',
            onClick: (row) => handleFinalizeSalary(row),
            className: 'px-2.5 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors',
            title: 'Chốt lương',
          },
          {
            key: 'print-month',
            label: 'In tháng',
            onClick: (row) => handlePrintPayrollMonth(row),
            className: 'px-2 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors',
          },
          {
            key: 'print-year',
            label: `In năm ${selectedYear}`,
            onClick: (row) => handlePrintPayrollYear(row),
            className: 'px-2 py-1.5 text-xs font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors',
          },
        ]}
      />

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết bảng lương nhân sự" size="lg">
        {selectedEmployee ? (
          <div className="space-y-4 text-sm text-gray-800">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Mã nhân viên</p>
                <p className="font-semibold">{selectedEmployee.id}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Họ tên</p>
                <p className="font-semibold">{selectedEmployee.name}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Kỳ lương</p>
                <p className="font-semibold">Tháng {selectedMonth}/{selectedYear}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Trạng thái</p>
                <p className="font-semibold">{selectedEmployee.status}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-700">Chi tiết công và phép</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Ngày công</p>
                  <p className="font-semibold">{selectedEmployee.workingDays} ngày</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Đã dùng phép năm</p>
                  <p className="font-semibold">{selectedEmployee.leaveUsed} ngày</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Phép năm còn lại</p>
                  <p className="font-semibold">{selectedEmployee.leaveRemaining} ngày</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-900">
                <p>
                  Ngày nghỉ không lương: {Number(selectedEmployee.leaveUnpaidDays || 0)} ngày
                </p>
              </div>
              <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                <p>
                  Ngày công quy đổi = {Number(selectedEmployee.workingDaysRaw || 0)} (thực tế)
                  {' + '}
                  {Number(selectedEmployee.holidayExtraDays || 0)} (lễ quy đổi thêm)
                  {' = '}
                  {Number(selectedEmployee.workingDays || 0)} ngày
                </p>
                <p className="mt-1 text-amber-800">
                  Số ngày lễ đi làm: {Number(selectedEmployee.holidayWorkedDays || 0)} ngày
                </p>
              </div>
            </div>


            <div className="rounded-xl border border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-700">Chi tiết tiền lương</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Lương cơ bản</p>
                  <p className="font-semibold">{formatMoney(selectedEmployee.baseSalary)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Doanh số</p>
                  <p className="font-semibold">{formatMoney(selectedEmployee.revenue)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Tỷ lệ hoa hồng</p>
                  <p className="font-semibold">{selectedEmployee.commissionRate}%</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Hoa hồng</p>
                  <p className="font-semibold">{formatMoney(selectedEmployee.allowance)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Khấu trừ</p>
                  <p className="font-semibold">{formatMoney(selectedEmployee.deduction)}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">Thực lĩnh</p>
                  <p className="text-base font-semibold text-emerald-800">{formatMoney(selectedEmployee.takeHome)}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Chi tiết khấu trừ</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-rose-900 sm:grid-cols-2">
                  <p>BHXH (8%): {formatMoney(selectedEmployee.bhxh)}</p>
                  <p>BHYT (1.5%): {formatMoney(selectedEmployee.bhyt)}</p>
                  <p>BHTN (1%): {formatMoney(selectedEmployee.bhtn)}</p>
                  {/* ✅ Dùng effectiveKhauTruKhac thay vì selectedEmployee.khauTruKhac */}
                  <p>Khấu trừ khác: {formatMoney(effectiveKhauTruKhac)}</p>
                </div>
                {/* ✅ Dùng effectiveTotalDeduction */}
                <p className="mt-2 text-sm font-semibold text-rose-800">
                  Tổng khấu trừ: {formatMoney(effectiveTotalDeduction)}
                </p>
              </div>

              {/* Bảng vi phạm giữ nguyên */}
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Chi tiết phạt (Khấu trừ khác)</p>
                {violationsLoading ? (
                  <p className="text-xs text-gray-500">Đang tải dữ liệu phạt...</p>
                ) : violations.length === 0 ? (
                  <>
                    <p className="text-xs text-gray-500">Không có vi phạm trong kỳ này.</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Mức phạt: Quản lý 50.000đ/lần, Bán hàng 25.000đ/lần, Kho 30.000đ/lần, Quản lý NS 40.000đ/lần.
                      Ngưỡng tha thứ: ≤ 10 phút không phạt.
                    </p>
                  </>
                ) : (
                  <>
                    <table className="min-w-full text-xs border border-rose-200 bg-white rounded-lg">
                      <thead>
                        <tr className="bg-rose-50">
                          <th className="px-2 py-1 border-b border-rose-100 text-left">Loại vi phạm</th>
                          <th className="px-2 py-1 border-b border-rose-100 text-center">Ngày vi phạm</th>
                          <th className="px-2 py-1 border-b border-rose-100 text-right">Số lần</th>
                          <th className="px-2 py-1 border-b border-rose-100 text-right">Mức phạt/lần</th>
                          <th className="px-2 py-1 border-b border-rose-100 text-right">Tổng phạt</th>
                          <th className="px-2 py-1 border-b border-rose-100 text-left">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {violations.map((v, idx) => (
                          <tr key={idx} className="hover:bg-rose-50">
                            <td className="px-2 py-1">{v.violationType}</td>
                            <td className="px-2 py-1 text-center">
                              {v.violationDate || '-'}
                            </td>
                            <td className="px-2 py-1 text-right">{v.violationCount}</td>
                            <td className="px-2 py-1 text-right">{formatMoney(v.penaltyAmount)}</td>
                            <td className="px-2 py-1 text-right font-semibold text-rose-800">
                              {formatMoney(Number(v.penaltyAmount) * Number(v.violationCount))}
                            </td>
                            <td className="px-2 py-1">{v.description || ''}</td>
                          </tr>
                        ))}
                        <tr className="bg-rose-100 font-semibold">
                          <td colSpan={4} className="px-2 py-1 text-right">Tổng phạt:</td>
                          <td className="px-2 py-1 text-right text-rose-800">
                            {/* ✅ Dùng violationTotal đã tính */}
                            {formatMoney(violationTotal)}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-2 text-xs text-gray-500">
                      Mức phạt: Quản lý 50.000đ/lần, Bán hàng 25.000đ/lần, Kho 30.000đ/lần, Quản lý NS 40.000đ/lần.
                      Ngưỡng tha thứ: ≤ 10 phút không phạt.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title={holidayEditingId ? 'Cập nhật ngày lễ' : 'Thêm ngày lễ'}
        size="md"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên ngày lễ</label>
            <input
              type="text"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Ví dụ: Quốc khánh"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ngày áp dụng</label>
              <input
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Hệ số lương ngày lễ</label>
              <input
                type="number"
                min="0.1"
                max="99.9"
                step="0.1"
                value={holidayForm.multiplier}
                onChange={(e) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    multiplier: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Ví dụ: 2 hoặc 4"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              rows={2}
              value={holidayForm.note}
              onChange={(e) => setHolidayForm((prev) => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Không bắt buộc"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setHolidayModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveHoliday}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {holidayEditingId ? 'Lưu thay đổi' : 'Thêm ngày lễ'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}