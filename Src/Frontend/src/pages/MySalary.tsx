// @ts-nocheck
import { EyeIcon, PrinterIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { loadAuthSession } from '../utils/authStorage';
import { getMySalaryApi, getViolationPenaltiesApi } from '../utils/backendApi';
import { buildMonthlyPayslipHtml, openPrintWindow } from '../utils/payrollPrintTemplates';

const VND = new Intl.NumberFormat('vi-VN');
const INSURANCE_RATES = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01,
};

function formatMoney(value) {
  return `${VND.format(Number(value || 0))} đ`;
}

function monthYearLabel(month, year) {
  return `Tháng ${month}/${year}`;
}

function resolvePayrollStatus(record) {
  const statusCode = Number(record?.TT || 0);
  return statusCode === 2 ? 'Đã thanh toán' : 'Tạm tính';
}

// ============================================================
// PATCH A: MySalary.tsx
// Vấn đề: Sau khi ra ca, trang lương không tự reload → KHAUTRU_KHAC vẫn hiện 0
// Fix:
//  1. Tính khauTruKhac từ violations API (source of truth) thay vì từ record.KHAUTRU_KHAC
//     → đảm bảo dù BANGLUONG chưa cập nhật kịp, UI vẫn hiển thị đúng
//  2. Tổng tiền phạt từ violations = sum(penaltyAmount * violationCount)
//     hiển thị đúng ở "Khấu trừ khác (Phạt)"
// ============================================================

// Thay thế hàm buildPersonalSalary, thêm prop violationPenaltyTotal:

function buildPersonalSalary(record, month, year, violationPenaltyTotal = 0) {
  if (!record) {
    return null;
  }

  const baseSalary = Number(record.LUONGCOBAN || 0);
  const salesRevenue = Number(record.DOANH_SO || 0);
  const commissionRate = Number(record.TY_LE_HOA_HONG || 0);
  const commissionByFormula = Math.round(salesRevenue * (commissionRate / 100));
  const commission = Number(record.HOA_HONG || commissionByFormula || record.PHUCAP || 0);
  const workingDays = Number(record.NGAYCONG || 0);
  const salaryByWorkDays = Math.round((baseSalary / 26) * workingDays);
  const grossIncome = salaryByWorkDays + commission;
  const bhxh = Math.round(baseSalary * INSURANCE_RATES.bhxh);
  const bhyt = Math.round(baseSalary * INSURANCE_RATES.bhyt);
  const bhtn = Math.round(baseSalary * INSURANCE_RATES.bhtn);

  // ✅ FIX: Ưu tiên lấy từ violations API (realtime), fallback về DB record
  // violationPenaltyTotal = tổng tiền phạt tính từ VIPHAM (luôn mới nhất)
  // record.KHAUTRU_KHAC = giá trị trong BANGLUONG (có thể chưa cập nhật kịp)
  const khauTruKhacFromDb = Number(record.KHAUTRU_KHAC || 0);
  const khauTruKhac = violationPenaltyTotal > 0 ? violationPenaltyTotal : khauTruKhacFromDb;

  const totalDeduction = bhxh + bhyt + bhtn + khauTruKhac;
  const netSalary = Math.max(0, grossIncome - totalDeduction);
  const leaveRemaining =
    record.NGAYNGHI_CONLAI != null
      ? Math.max(0, Number(record.NGAYNGHI_CONLAI || 0))
      : Math.max(0, 12 - Math.round(workingDays / 2));

  return {
    employeeCode: `NV${String(record.MNV).padStart(3, '0')}`,
    month,
    year,
    label: monthYearLabel(month, year),
    workingDays,
    leaveRemaining,
    grossIncome,
    netSalary,
    deductionTotal: totalDeduction,
    incomes: [
      { key: 'baseSalary', label: 'Lương cơ bản', value: baseSalary },
      { key: 'commission', label: 'Hoa hồng', value: commission },
    ],
    salesRevenue,
    commissionRate,
    commissionByFormula,
    deductions: [
      { key: 'bhxh', label: 'Khấu trừ BHXH (8%)', value: bhxh },
      { key: 'bhyt', label: 'Khấu trừ BHYT (1.5%)', value: bhyt },
      { key: 'bhtn', label: 'Khấu trừ BHTN (1%)', value: bhtn },
      { key: 'khauTruKhac', label: 'Khấu trừ khác (Phạt)', value: khauTruKhac },
    ],
  };
}

export function MySalary() {
  const session = loadAuthSession();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [violations, setViolations] = useState([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [violationDetailOpen, setViolationDetailOpen] = useState(false);

  const selectedMonth = Number(month);
  const selectedYear = Number(year);
  const startYear = 2024;
  const currentYear = now.getFullYear();

  const yearOptions = useMemo(
    () =>
      Array.from({ length: Math.max(1, currentYear - startYear + 1) }, (_, index) =>
        String(currentYear - index),
      ),
    [currentYear],
  );

  useEffect(() => {
    const loadSalary = async () => {
      if (!Number.isInteger(selectedMonth) || !Number.isInteger(selectedYear) || !session?.mnv) {
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await getMySalaryApi(selectedMonth, selectedYear);
        setRecord(response || null);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Khong the tai du lieu luong';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadSalary();
  }, [selectedMonth, selectedYear, session?.mnv]);

  useEffect(() => {
    const loadViolations = async () => {
      if (!session?.mnv || !Number.isInteger(selectedMonth) || !Number.isInteger(selectedYear)) {
        setViolations([]);
        return;
      }

      setViolationsLoading(true);
      console.log('Loading violations for', { mnv: session?.mnv, month: selectedMonth, year: selectedYear });
      try {
        const viol = await getViolationPenaltiesApi(session.mnv, selectedMonth, selectedYear);
        const list = Array.isArray(viol) ? viol : [];
        setViolations(list);
        console.log('Violations response', { mnv: session?.mnv, month: selectedMonth, year: selectedYear, list });
      } catch (_error) {
        console.error('Failed loading violations', _error);
        setViolations([]);
      } finally {
        setViolationsLoading(false);
      }
    };

    loadViolations();
  }, [selectedMonth, selectedYear, session?.mnv]);

  useEffect(() => {
    console.log('Session and violations debug', { session, violations });
  }, [session, violations]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!session?.mnv || !Number.isInteger(selectedYear)) {
        setHistoryRows([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const periods = Array.from({ length: 6 }, (_, index) => {
          const d = new Date(selectedYear, selectedMonth - 1 - index, 1);
          return {
            month: d.getMonth() + 1,
            year: d.getFullYear(),
          };
        });

        const periodResults = await Promise.all(
          periods.map(async (period) => {
            const myRecord = await getMySalaryApi(period.month, period.year);
            const personal = buildPersonalSalary(myRecord, period.month, period.year);

            return {
              key: `${period.month}-${period.year}`,
              label: monthYearLabel(period.month, period.year),
              netSalary: personal?.netSalary || 0,
              status: myRecord ? resolvePayrollStatus(myRecord) : 'Chưa có dữ liệu',
              workingDays: personal?.workingDays ?? 0,
            };
          }),
        );

        setHistoryRows(periodResults);
      } catch (_error) {
        setHistoryRows([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [selectedMonth, selectedYear, session?.mnv]);

  const violationPenaltyTotal = useMemo(
    () =>
      violations.reduce(
        (sum, v) => sum + Number(v.penaltyAmount || 0) * Number(v.violationCount || 0),
        0,
      ),
    [violations],
  );

  const personalSalary = useMemo(
    () => buildPersonalSalary(record, selectedMonth, selectedYear, violationPenaltyTotal),
    [record, selectedMonth, selectedYear, violationPenaltyTotal],
  );

  const handlePrintPayrollMonth = () => {
    if (!personalSalary) {
      return;
    }
    

    const employee = {
      id: personalSalary.employeeCode,
      name: String(record?.HOTEN || session?.fullName || session?.username || 'Nhân viên'),
      position: String(record?.TENCHUCVU || 'Nhân viên'),
      baseSalary: Number(record?.LUONGCOBAN || 0),
      workingDays: Number(personalSalary.workingDays || 0),
      allowance: Number(record?.HOA_HONG || personalSalary.commissionByFormula || record?.PHUCAP || 0),
      revenue: Number(record?.DOANH_SO || personalSalary.salesRevenue || 0),
      bhxh: Number(record?.BHXH || personalSalary.deductions.find((item) => item.key === 'bhxh')?.value || 0),
      bhyt: Number(record?.BHYT || personalSalary.deductions.find((item) => item.key === 'bhyt')?.value || 0),
      bhtn: Number(record?.BHTN || personalSalary.deductions.find((item) => item.key === 'bhtn')?.value || 0),
      khauTruKhac: Number(record?.KHAUTRU_KHAC || 0),
      deduction: Number(record?.KHAUTRU ?? personalSalary.deductionTotal ?? 0),
      takeHome: Number(record?.LUONGTHUCLANH ?? personalSalary.netSalary ?? 0),
    };

    const html = buildMonthlyPayslipHtml({
      employee,
      selectedMonth,
      selectedYear,
    });

    openPrintWindow(`Phiếu lương ${employee.id} - ${selectedMonth}/${selectedYear}`, html);
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Không tải được dữ liệu backend: {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lương cá nhân</h2>
          </div>
          <div className="flex items-center gap-2">
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
              className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handlePrintPayrollMonth}
              disabled={!personalSalary}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PrinterIcon className="h-4 w-4" />
              In phiếu lương
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Đang tải dữ liệu lương...
        </div>
      ) : personalSalary ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Thực lĩnh</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-800">{formatMoney(Math.max(0, personalSalary.netSalary))}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Tổng thu nhập</p>
              <p className="mt-2 text-2xl font-semibold text-blue-800">{formatMoney(personalSalary.grossIncome)}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Tổng khấu trừ</p>
              <p className="mt-2 text-2xl font-semibold text-amber-800">{formatMoney(personalSalary.deductionTotal)}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chi tiết thu nhập</h3>
                <span className="text-xs text-gray-500">{personalSalary.label}</span>
              </div>
              <div className="space-y-2">
                {personalSalary.incomes.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-900">{formatMoney(item.value)}</span>
                  </div>
                ))}
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  <p className="font-medium">
                    Tiền hoa hồng = Doanh số bán hàng x (Tỷ lệ hoa hồng / 100)
                  </p>
                  <p className="mt-1">
                    = {formatMoney(personalSalary.salesRevenue)} x ({personalSalary.commissionRate}% / 100)
                    = <span className="font-semibold"> {formatMoney(personalSalary.commissionByFormula)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chi tiết khấu trừ</h3>
                <span className="text-xs text-gray-500">{personalSalary.employeeCode}</span>
              </div>
              <div className="space-y-2">
                {personalSalary.deductions.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-rose-700">{item.label}</span>
                      {item.key === 'khauTruKhac' && violations && violations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setViolationDetailOpen(true)}
                          title="Xem chi tiết phạt"
                          className="rounded p-0.5 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="font-medium text-rose-800">{formatMoney(item.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-100 px-3 py-2 text-sm">
                  <span className="font-semibold text-rose-800">Tổng khấu trừ</span>
                  <span className="font-semibold text-rose-900">
                    {formatMoney(personalSalary.deductionTotal)}
                  </span>
                </div>
              </div>

            </div>
          </section>

          <section className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gold-700">Công thức thực lĩnh</p>
            <p className="mt-2 text-sm text-gold-900">
              Thực lĩnh = (Lương cơ bản/26) x Ngày công quy đổi + Hoa hồng - (BHXH + BHYT + BHTN + Khấu trừ khác) =
              <span className="ml-1 font-semibold">
                {formatMoney(personalSalary.netSalary)}
              </span>
            </p>
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
          <p className="text-base font-medium text-gray-700">Chưa có dữ liệu lương cho kỳ đã chọn</p>
          <p className="mt-1 text-sm text-gray-500">Vui lòng chọn kỳ khác hoặc liên hệ bộ phận nhân sự để được hỗ trợ.</p>
        </section>
      )}

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Lịch sử kỳ lương gần đây</h3>
          {historyLoading ? <span className="text-xs text-gray-500">Đang tải...</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Kỳ lương</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Thực lĩnh</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Ngày công</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyRows.length > 0 ? (
                historyRows.map((row) => (
                  <tr key={row.key}>
                    <td className="px-3 py-2 text-gray-700">{row.label}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{formatMoney(row.netSalary)}</td>
                    <td className="px-3 py-2 text-gray-700">{row.workingDays}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status === 'Đã thanh toán' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Tạm tính' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={4}>
                    Không có dữ liệu lịch sử lương.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Chi tiết phạt */}
      {violationDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl p-6 mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết phạt - Tháng {selectedMonth}/{selectedYear}</h2>
              <button
                type="button"
                onClick={() => setViolationDetailOpen(false)}
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {violationsLoading ? (
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            ) : violations.length === 0 ? (
              <p className="text-sm text-gray-500">Không có vi phạm trong kỳ này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-red-50">
                      <th className="px-3 py-2 border-b border-gray-200 text-left font-semibold text-red-700">Loại vi phạm</th>
                      <th className="px-3 py-2 border-b border-gray-200 text-center font-semibold text-red-700">Ngày vi phạm</th>
                      <th className="px-3 py-2 border-b border-gray-200 text-center font-semibold text-red-700">Số lần</th>
                      <th className="px-3 py-2 border-b border-gray-200 text-right font-semibold text-red-700">Mức phạt/lần</th>
                      <th className="px-3 py-2 border-b border-gray-200 text-right font-semibold text-red-700">Tổng phạt</th>
                      <th className="px-3 py-2 border-b border-gray-200 text-left font-semibold text-red-700">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{v.violationType}</td>
                        <td className="px-3 py-2 text-center text-gray-700">
                          {v.violationDate || '-'}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-gray-900">{v.violationCount}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{formatMoney(v.penaltyAmount)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-red-700">
                          {formatMoney(Number(v.penaltyAmount) * Number(v.violationCount))}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{v.description || '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-red-50 font-semibold">
                      <td colSpan={4} className="px-3 py-2 text-right text-red-800">Tổng tiền phạt:</td>
                      <td className="px-3 py-2 text-right text-red-900">
                        {formatMoney(violations.reduce((sum, v) => sum + Number(v.penaltyAmount || 0) * Number(v.violationCount || 0), 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViolationDetailOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}