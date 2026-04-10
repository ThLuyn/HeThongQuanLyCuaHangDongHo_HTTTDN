// @ts-nocheck
import { RefreshCcwIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { decideLeaveRequestApi, getLeaveRequestsApi } from '../utils/backendApi';

const LEAVE_TYPE_LABEL = {
  0: 'Phép năm',
  1: 'Không lương',
  2: 'Chế độ',
  3: 'Nghỉ việc',
};

const STATUS_LABEL = {
  0: 'Tạm tính',
  1: 'Đã thanh toán',
  2: 'Từ chối',
};

const REQUEST_STATUS_LABEL = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Từ chối',
};

function getStatusBadgeClass(status) {
  if (Number(status) === 1) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (Number(status) === 2) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-amber-100 text-amber-700';
}

export function LeaveOperations() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailMode, setDetailMode] = useState('view');
  const [detailOpen, setDetailOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [tableResetSignal, setTableResetSignal] = useState(0);

  const getLeaveEndDate = (item) => {
    if (Number(item?.LOAI) === 3) {
      return item?.NGAY_NGHIVIEC || item?.NGAYNGHI || null;
    }
    return item?.NGAYKETTHUC || item?.NGAYNGHI || null;
  };

  const getLeaveDays = (item) => {
    const fallbackDays = Number(item?.SONGAY || 0);
    const start = new Date(item?.NGAYNGHI || '');
    const end = new Date(getLeaveEndDate(item) || '');

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return fallbackDays;
    }

    const computed = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return computed > 0 ? computed : fallbackDays;
  };

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getLeaveRequestsApi();
      setRequests(Array.isArray(rows) ? rows : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải dữ liệu nghỉ phép';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    setTableResetSignal((prev) => prev + 1);
  }, []);

  const resetViewState = () => {
    setSelectedYear(String(currentYear));
    setSelectedMonth('all');
    setSelectedStatus('all');
    setSelectedRequest(null);
    setDetailOpen(false);
    setDecisionNote('');
    setTableResetSignal((prev) => prev + 1);
  };

  const handleRefresh = async () => {
    resetViewState();
    await loadRequests();
  };

  const yearOptions = useMemo(() => {
    const years = requests
      .map((item) => new Date(item.NGAYNGHI || item.NGAYTAO || '').getFullYear())
      .filter((year) => Number.isInteger(year) && year > 0);
    years.push(currentYear);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [requests, currentYear]);

  const filteredRequests = useMemo(() => {
    const shouldFilterByYear = selectedYear !== 'all';
    const yearValue = Number(selectedYear);

    return requests.filter((item) => {
      const startDate = new Date(item.NGAYNGHI || item.NGAYTAO || '');
      if (Number.isNaN(startDate.getTime())) {
        return false;
      }

      if (shouldFilterByYear && Number.isInteger(yearValue) && yearValue > 0 && startDate.getFullYear() !== yearValue) {
        return false;
      }

      if (selectedMonth !== 'all') {
        const monthValue = Number(selectedMonth);
        if (!Number.isInteger(monthValue) || monthValue < 1 || monthValue > 12) {
          return false;
        }
        if (startDate.getMonth() + 1 !== monthValue) {
          return false;
        }
      }

      if (selectedStatus !== 'all' && Number(item.TRANGTHAI) !== Number(selectedStatus)) {
        return false;
      }

      return true;
    });
  }, [requests, selectedYear, selectedMonth, selectedStatus]);

  const summary = useMemo(() => {
    const totalRequests = filteredRequests.length;
    const pendingRequests = filteredRequests.filter((item) => Number(item.TRANGTHAI) === 0).length;

    const leaveDaysByEmployee = filteredRequests.reduce((acc, item) => {
      const key = String(item.HOTEN || 'Chưa xác định');
      acc[key] = (acc[key] || 0) + getLeaveDays(item);
      return acc;
    }, {});

    const topEmployeeEntry = Object.entries(leaveDaysByEmployee).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || null;

    return {
      totalRequests,
      pendingRequests,
      topEmployeeName: topEmployeeEntry ? topEmployeeEntry[0] : 'Chưa có dữ liệu',
      topEmployeeDays: topEmployeeEntry ? Number(topEmployeeEntry[1]) : 0,
    };
  }, [filteredRequests]);

  const tableRows = useMemo(
    () =>
      filteredRequests.map((row) => ({
        id: Number(row.MDN),
        requestCode: `DON${String(row.MDN).padStart(4, '0')}`,
        employeeCode: `NV${String(row.MNV).padStart(3, '0')}`,
        employeeId: Number(row.MNV),
        employeeName: row.HOTEN,
        leaveTypeCode: Number(row.LOAI),
        leaveType: LEAVE_TYPE_LABEL[Number(row.LOAI)] || 'Khác',
        startDate: row.NGAYNGHI,
        endDate: getLeaveEndDate(row),
        resignationDate: row.NGAY_NGHIVIEC || null,
        days: getLeaveDays(row),
        reason: row.LYDO || '-',
        createdAt: row.NGAYTAO,
        statusCode: Number(row.TRANGTHAI),
        statusText: REQUEST_STATUS_LABEL[Number(row.TRANGTHAI)] || 'Không xác định',
        reviewerId: row.NGUOIDUYET != null ? Number(row.NGUOIDUYET) : null,
        reviewerNote: row.GHICHU || '',
      })),
    [filteredRequests],
  );

  const columns = [
    { key: 'requestCode', label: 'Mã đơn' },
    { key: 'employeeName', label: 'Nhân viên' },
    { key: 'leaveType', label: 'Loại nghỉ' },
    {
      key: 'startDate',
      label: 'Ngày nghỉ',
      render: (value, row) => {
        if (!value) {
          return '-';
        }
        const startText = new Date(value).toLocaleDateString('vi-VN');
        if (!row.endDate || row.endDate === value) {
          return startText;
        }
        return `${startText} - ${new Date(row.endDate).toLocaleDateString('vi-VN')}`;
      },
    },
    { key: 'days', label: 'Số ngày' },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-'),
    },
    {
      key: 'resignationDate',
      label: 'Ngày nghỉ việc',
      render: (value, row) => {
        if (row?.leaveType !== 'Nghỉ việc') {
          return '-';
        }
        return value ? new Date(value).toLocaleDateString('vi-VN') : '-';
      },
    },
    {
      key: 'statusText',
      label: 'Trạng thái',
      render: (_value, row) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(row.statusCode)}`}>
          {row.statusText}
        </span>
      ),
    },
  ];

  const openDetail = (row, mode = 'view') => {
    setSelectedRequest(row);
    setDetailMode(mode);
    setDecisionNote(String(row?.reviewerNote || ''));
    setDetailOpen(true);
  };

  const submitDecision = async (status) => {
    if (!selectedRequest) {
      return;
    }

    setSavingDecision(true);
    setError('');
    try {
      await decideLeaveRequestApi(Number(selectedRequest.id), {
        status: Number(status) === 1 ? 1 : 2,
        note: decisionNote.trim() || undefined,
      });
      setDetailOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể cập nhật trạng thái đơn nghỉ';
      setError(message);
    } finally {
      setSavingDecision(false);
    }
  };

  const saveReviewerNote = async () => {
    if (!selectedRequest) {
      return;
    }

    const currentStatus = Number(selectedRequest.statusCode);
    if (![1, 2].includes(currentStatus)) {
      return;
    }

    setSavingDecision(true);
    setError('');
    try {
      await decideLeaveRequestApi(Number(selectedRequest.id), {
        status: currentStatus,
        note: decisionNote.trim() || undefined,
      });
      setDetailOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể lưu ghi chú duyệt';
      setError(message);
    } finally {
      setSavingDecision(false);
    }
  };

  const rowActions = [
    {
      key: 'view',
      label: 'Xem',
      onClick: (row) => openDetail(row, 'view'),
      className: 'p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors',
    },
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      onClick: (row) => openDetail(row, 'edit'),
      className: 'p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors',
    },
  ];

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Điều hành Nghỉ phép</h2>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcwIcon className="h-4 w-4" />
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value="all">Tất cả các năm</option>
              {yearOptions.map((year) => (
                <option key={year} value={String(year)}>
                  Năm {year}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value="all">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Trạng thái đơn</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Chờ duyệt</option>
              <option value="1">Đã duyệt</option>
              <option value="2">Từ chối</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">Tổng số đơn nghỉ</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{summary.totalRequests} đơn</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStatus('0')}
            className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100/80"
          >
            <p className="text-xs text-emerald-700">Số đơn chờ duyệt</p>
            <p className="mt-1 text-xl font-semibold text-emerald-800">{summary.pendingRequests} đơn</p>
          </button>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-700">Nhân viên nghỉ nhiều nhất</p>
            <p className="mt-1 text-base font-semibold text-amber-800">{summary.topEmployeeName}</p>
            <p className="text-xs text-amber-700">{summary.topEmployeeDays} ngày nghỉ</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Đang tải danh sách đơn nghỉ...
        </div>
      ) : null}

      <DataTable
        resetSignal={tableResetSignal}
        title="Danh sách đơn nghỉ"
        columns={columns}
        data={tableRows}
        defaultSortBy="createdAt"
        defaultSortDirection="desc"
        rowActions={rowActions}
        searchPlaceholder="Tìm kiếm..."
        advancedFilterKeys={['employeeName', 'leaveType', 'statusText', 'startDate']}
        forceSelectFilterKeys={['leaveType', 'statusText']}
        fixedSelectOptions={{
          leaveType: ['Phép năm', 'Không lương', 'Chế độ', 'Nghỉ việc'],
          statusText: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],
        }}
        rangeFilterKeys={[
          { key: 'startDate', minPlaceholder: 'Ngày nghỉ từ', maxPlaceholder: 'Ngày nghỉ đến', inputType: 'date' },
          { key: 'createdAt', minPlaceholder: 'Ngày tạo từ', maxPlaceholder: 'Ngày tạo đến', inputType: 'date' },
          { key: 'days', minPlaceholder: 'Số ngày từ', maxPlaceholder: 'Số ngày đến', inputType: 'number' },
        ]}
      />

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailMode === 'edit' ? 'Chỉnh sửa đơn nghỉ' : 'Xem đơn nghỉ'}
        size="lg"
      >
        {selectedRequest ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Trạng thái xử lý</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(selectedRequest.statusCode)}`}>
                {selectedRequest.statusText}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Mã đơn</p>
                <p className="font-medium text-gray-900">{selectedRequest.requestCode}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ngày tạo đơn</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.createdAt
                    ? new Date(selectedRequest.createdAt).toLocaleDateString('vi-VN')
                    : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Mã nhân viên</p>
                <p className="font-medium text-gray-900">{selectedRequest.employeeCode}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Tên nhân viên</p>
                <p className="font-medium text-gray-900">{selectedRequest.employeeName}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Loại nghỉ</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.leaveType} 
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Số ngày nghỉ</p>
                <p className="font-medium text-gray-900">{selectedRequest.days} ngày</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Từ ngày</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.startDate
                    ? new Date(selectedRequest.startDate).toLocaleDateString('vi-VN')
                    : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Đến ngày</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.endDate
                    ? new Date(selectedRequest.endDate).toLocaleDateString('vi-VN')
                    : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-500">Ngày nghỉ việc (nếu là đơn nghỉ việc)</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.resignationDate
                    ? new Date(selectedRequest.resignationDate).toLocaleDateString('vi-VN')
                    : '-'}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Lý do xin nghỉ</p>
              <p className="text-gray-900">{selectedRequest.reason || '-'}</p>
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Ghi chú duyệt</p>
              {detailMode === 'edit' ? (
                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  rows={4}
                  placeholder="Nhập ghi chú duyệt hoặc lý do từ chối..."
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
              ) : (
                <p className="mt-1 text-gray-900">{selectedRequest.reviewerNote || '-'}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Đóng
              </button>
              {detailMode === 'edit' && Number(selectedRequest.statusCode) === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => submitDecision(2)}
                    disabled={savingDecision}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {savingDecision ? 'Đang lưu...' : 'Từ chối'}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitDecision(1)}
                    disabled={savingDecision}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingDecision ? 'Đang lưu...' : 'Duyệt'}
                  </button>
                </>
              ) : null}
              {detailMode === 'edit' && [1, 2].includes(Number(selectedRequest.statusCode)) ? (
                <button
                  type="button"
                  onClick={saveReviewerNote}
                  disabled={savingDecision}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingDecision ? 'Đang lưu...' : 'Lưu ghi chú'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
