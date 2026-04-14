// @ts-nocheck
import { CalendarDaysIcon, PencilIcon, PlusIcon, PrinterIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import {
  createHolidayMultiplierApi,
  deleteHolidayMultiplierApi,
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

  const selectedMonth = Number(month);
  const selectedYear = Number(year);

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

  const mapSalaryRow = (row) => ({
    mnv: Number(row.MNV || 0),
    id: `NV${String(row.MNV).padStart(3, '0')}`,
    name: row.HOTEN,
    position: row.TENCHUCVU || 'Chưa cập nhật',
    baseSalary: Number(row.LUONGCOBAN || 0),
    allowance: Number(row.PHUCAP || 0),
    takeHome: Number(row.LUONGTHUCLANH || 0),
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

  return (
    <div className="space-y-4">
      {notice.message ? (
        <div className="fixed right-4 top-4 z-[70] w-[min(92vw,420px)]">
          <div
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              notice.type === 'success'
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
          <input
            type="number"
            value={year}
            min="2000"
            max="2100"
            onChange={(e) => setYear(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
          />
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
            <p className="text-sm font-semibold text-gray-800">Thiết lập hệ số lương ngày lễ</p>
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

      <DataTable
        title={`Quản lý lương nhân viên - Tháng ${selectedMonth}/${selectedYear}`}
        columns={columns}
        data={tableData}
        searchPlaceholder="Tìm nhân viên..."
        rowActions={[
          {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: openDetail,
            className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
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
                </div>
                <p className="mt-2 text-sm font-semibold text-rose-800">
                  Tổng khấu trừ: {formatMoney(selectedEmployee.deduction)}
                </p>
              </div>
              {/* Bảng vi phạm đi trễ/về sớm */}
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Bảng vi phạm (Khấu trừ khác)</p>
                {violationsLoading ? (
                  <p className="text-xs text-gray-500">Đang tải dữ liệu vi phạm...</p>
                ) : violations.length === 0 ? (
                  <p className="text-xs text-gray-500">Không có vi phạm trong kỳ này.</p>
                ) : (
                  <table className="min-w-full text-xs border border-rose-200 bg-white rounded-lg">
                    <thead>
                      <tr className="bg-rose-50">
                        <th className="px-2 py-1 border-b border-rose-100 text-left">Loại vi phạm</th>
                        <th className="px-2 py-1 border-b border-rose-100 text-right">Số lần</th>
                        <th className="px-2 py-1 border-b border-rose-100 text-right">Mức phạt/lần</th>
                        <th className="px-2 py-1 border-b border-rose-100 text-right">Tổng phạt</th>
                        <th className="px-2 py-1 border-b border-rose-100 text-left">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map((v, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1">{v.violationType}</td>
                          <td className="px-2 py-1 text-right">{v.violationCount}</td>
                          <td className="px-2 py-1 text-right">{formatMoney(v.penaltyAmount)}</td>
                          <td className="px-2 py-1 text-right">{formatMoney(Number(v.penaltyAmount) * Number(v.violationCount))}</td>
                          <td className="px-2 py-1">{v.description || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="mt-2 text-right text-sm font-semibold text-rose-800">
                  Tổng phạt: {formatMoney(violations.reduce((sum, v) => sum + Number(v.penaltyAmount || 0) * Number(v.violationCount || 0), 0))}
                </div>
                <div className="mt-1 text-xs text-gray-500">Mức phạt: Quản lý 50.000đ/lần, Bán hàng 25.000đ/lần, Kho 30.000đ/lần, Quản lý NS 40.000đ/lần. Ngưỡng tha thứ: ≤ 10 phút không phạt.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Đóng
              </button>
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
