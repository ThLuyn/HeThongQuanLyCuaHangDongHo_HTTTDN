// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { createPositionSalaryApi, getEmployeesApi, getPositionSalaryApi, getPositionWorkHistoryApi, transferEmployeePositionApi, updatePositionSalaryApi } from '../utils/backendApi';

function formatMoney(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
}

export function PositionSalaryManagement() {
  const [rows, setRows] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    positionName: '',
    baseSalary: 0,
    commissionRate: 0,
    status: 1,
  });
  const [transferForm, setTransferForm] = useState({
    employeeId: '',
    newPositionId: '',
    effectiveDate: '',
    note: '',
  });
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [selectedHistoryRow, setSelectedHistoryRow] = useState(null);
  const [effectiveDateRange, setEffectiveDateRange] = useState({ from: '', to: '' });
  const [endDateRange, setEndDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPositionSalaryApi();
        setRows(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Không thể tải danh sách chức vụ';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await getPositionWorkHistoryApi();
        setHistoryRows(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Không thể tải lịch sử công tác';
        setError(message);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployeesApi();
        setEmployees((data || []).filter((emp) => Number(emp.TT) === 1));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Không thể tải danh sách nhân viên';
        setError(message);
      }
    };

    loadEmployees();
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'positionName',
        label: 'Chức vụ',
      },
      {
        key: 'baseSalary',
        label: 'Lương cơ bản',
        render: (val) => <span className="font-semibold text-gray-800">{formatMoney(val)}</span>,
      },
      {
        key: 'commissionRate',
        label: 'Tỷ lệ hoa hồng',
        render: (val) => `${Number(val || 0)}%`,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (val) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              Number(val) === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {Number(val) === 1 ? 'Đang áp dụng' : 'Ngưng áp dụng'}
          </span>
        ),
      },
    ],
    [],
  );

  const historyColumns = useMemo(
    () => [
      {
        key: 'employeeSearchText',
        label: 'Nhân viên',
        render: (val) => val || '-',
      },
      {
        key: 'newPositionName',
        label: 'Chức vụ mới',
        render: (val) => val || 'Chưa cập nhật',
      },
      {
        key: 'effectiveDate',
        label: 'Ngày hiệu lực',
        render: (val) => {
          if (!val) {
            return '-';
          }
          return new Date(val).toLocaleDateString('vi-VN');
        },
      },
      {
        key: 'endDate',
        label: 'Ngày kết thúc',
        render: (val) => {
          if (!val) {
            return '-';
          }
          return new Date(val).toLocaleDateString('vi-VN');
        },
      },
      {
        key: 'note',
        label: 'Ghi chú',
        render: (val) => val || '-',
      },
    ],
    [],
  );

  const historyTableData = useMemo(
    () =>
      (historyRows || []).map((row) => ({
        ...row,
        employeeSearchText: `NV${String(row.employeeId).padStart(3, '0')} - ${row.employeeName || ''}`,
      })),
    [historyRows],
  );

  const filteredHistoryTableData = useMemo(() => {
    const fromEffective = effectiveDateRange.from ? new Date(`${effectiveDateRange.from}T00:00:00`).getTime() : null;
    const toEffective = effectiveDateRange.to ? new Date(`${effectiveDateRange.to}T23:59:59.999`).getTime() : null;
    const fromEnd = endDateRange.from ? new Date(`${endDateRange.from}T00:00:00`).getTime() : null;
    const toEnd = endDateRange.to ? new Date(`${endDateRange.to}T23:59:59.999`).getTime() : null;

    return historyTableData.filter((row) => {
      const effectiveTime = row.effectiveDate ? new Date(row.effectiveDate).getTime() : NaN;
      const endTime = row.endDate ? new Date(row.endDate).getTime() : NaN;

      if (fromEffective != null && (Number.isNaN(effectiveTime) || effectiveTime < fromEffective)) {
        return false;
      }
      if (toEffective != null && (Number.isNaN(effectiveTime) || effectiveTime > toEffective)) {
        return false;
      }

      if (fromEnd != null && (Number.isNaN(endTime) || endTime < fromEnd)) {
        return false;
      }
      if (toEnd != null && (Number.isNaN(endTime) || endTime > toEnd)) {
        return false;
      }

      return true;
    });
  }, [historyTableData, effectiveDateRange, endDateRange]);

  const hasExternalHistoryDateFilters =
    Boolean(effectiveDateRange.from) ||
    Boolean(effectiveDateRange.to) ||
    Boolean(endDateRange.from) ||
    Boolean(endDateRange.to);

  const clearExternalHistoryDateFilters = () => {
    setEffectiveDateRange({ from: '', to: '' });
    setEndDateRange({ from: '', to: '' });
  };

  const openHistoryDetail = (row) => {
    setSelectedHistoryRow(row);
    setHistoryDetailOpen(true);
  };

  const openEdit = (row) => {
    setIsCreating(false);
    setEditingRow(row);
    setError('');
    setForm({
      positionName: row.positionName,
      baseSalary: Number(row.baseSalary || 0),
      commissionRate: Number(row.commissionRate || 0),
      status: Number(row.status) === 1 ? 1 : 0,
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setIsCreating(true);
    setEditingRow(null);
    setError('');
    setForm({
      positionName: '',
      baseSalary: 0,
      commissionRate: 0,
      status: 1,
    });
    setModalOpen(true);
  };

  const handleSoftDelete = async (row) => {
    if (!confirm(`Ngưng áp dụng chức vụ?`)) {
      return;
    }

    try {
      await updatePositionSalaryApi(row.id, {
        baseSalary: Number(row.baseSalary || 0),
        commissionRate: Number(row.commissionRate || 0),
        status: 0,
      });

      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                status: 0,
              }
            : item,
        ),
      );
      setError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể ngưng áp dụng chức vụ';
      setError(message);
    }
  };

  const handleSave = async () => {
    if (!String(form.positionName || '').trim()) {
      setError('Tên chức vụ là bắt buộc.');
      return;
    }

    if (Number(form.baseSalary) <= 0) {
      setError('Lương cơ bản phải lớn hơn 0.');
      return;
    }
    if (Number(form.commissionRate) < 0 || Number(form.commissionRate) > 100) {
      setError('Tỷ lệ hoa hồng phải nằm trong khoảng từ 0 đến 100%.');
      return;
    }

    const normalizedStatus = Number(form.status) === 1 ? 1 : 0;

    try {
      if (isCreating) {
        const created = await createPositionSalaryApi({
          positionName: String(form.positionName).trim(),
          baseSalary: Number(form.baseSalary),
          commissionRate: Number(form.commissionRate),
          status: normalizedStatus,
        });

        setRows((prev) => [
          ...prev,
          {
            id: Number(created.id),
            positionName: String(form.positionName).trim(),
            baseSalary: Number(form.baseSalary),
            commissionRate: Number(form.commissionRate),
            status: normalizedStatus,
          },
        ]);
      } else {
        await updatePositionSalaryApi(editingRow.id, {
          baseSalary: Number(form.baseSalary),
          commissionRate: Number(form.commissionRate),
          status: normalizedStatus,
        });

        setRows((prev) =>
          prev.map((row) =>
            row.id === editingRow.id
              ? {
                  ...row,
                  baseSalary: Number(form.baseSalary),
                  commissionRate: Number(form.commissionRate),
                  status: normalizedStatus,
                }
              : row,
          ),
        );
      }

      setModalOpen(false);
      setError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : isCreating ? 'Không thể thêm chức vụ' : 'Không thể cập nhật chức vụ';
      setError(message);
    }
  };

  const openTransferModal = () => {
    const now = new Date();
    const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setError('');
    setTransferForm({
      employeeId: '',
      newPositionId: '',
      effectiveDate: dateText,
      note: '',
    });
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    const employeeId = Number(transferForm.employeeId);
    const newPositionId = Number(transferForm.newPositionId);
    const effectiveDate = String(transferForm.effectiveDate || '').trim();
    const note = String(transferForm.note || '').trim();

    if (!employeeId) {
      setError('Vui lòng chọn nhân viên cần chuyển công tác.');
      return;
    }

    if (!newPositionId) {
      setError('Vui lòng chọn chức vụ mới.');
      return;
    }

    if (!effectiveDate) {
      setError('Vui lòng nhập ngày bắt đầu.');
      return;
    }

    const targetDate = new Date(`${effectiveDate}T00:00:00`);
    if (Number.isNaN(targetDate.getTime())) {
      setError('Ngày bắt đầu không hợp lệ.');
      return;
    }

    const hasTransferInSameMonth = (historyRows || []).some((item) => {
      if (Number(item.employeeId) !== employeeId) {
        return false;
      }
      const itemDate = new Date(String(item.effectiveDate || '').slice(0, 10));
      if (Number.isNaN(itemDate.getTime())) {
        return false;
      }
      return (
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getFullYear() === targetDate.getFullYear()
      );
    });

    if (hasTransferInSameMonth) {
      setError('Mỗi nhân viên chỉ được chuyển công tác 1 lần trong cùng một tháng.');
      return;
    }

    try {
      await transferEmployeePositionApi({
        employeeId,
        newPositionId,
        effectiveDate,
        note,
      });

      const [historyData, employeeData] = await Promise.all([getPositionWorkHistoryApi(), getEmployeesApi()]);
      setHistoryRows(historyData || []);
      setEmployees((employeeData || []).filter((emp) => Number(emp.TT) === 1));
      setTransferModalOpen(false);
      setError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể chuyển công tác';
      setError(message);
    }
  };

  return (
    <div className="space-y-5">
      <DataTable
        title="Danh sách chức vụ"
        columns={columns}
        data={rows}
        onAdd={openAdd}
        addLabel="Thêm chức vụ"
        searchPlaceholder="Tìm kiếm..."
        noHorizontalScroll
        pageSize={5}
        emptyState={loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}
        rowActions={[
          {
            key: 'edit',
            label: 'Sửa',
            onClick: openEdit,
            className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
          },
          {
            key: 'delete',
            label: 'Ngưng áp dụng',
            onClick: handleSoftDelete,
            className: 'p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors',
          },
        ]}
      />

      <DataTable
        title="Lịch sử công tác"
        columns={historyColumns}
        data={filteredHistoryTableData}
        defaultSortBy="effectiveDate"
        defaultSortDirection="desc"
        onAdd={openTransferModal}
        addLabel="Chuyển công tác"
        searchPlaceholder="Tìm kiếm..."
        advancedFilterKeys={['employeeSearchText', 'newPositionName', 'note']}
        externalHasActiveFilters={hasExternalHistoryDateFilters}
        onClearExternalFilters={clearExternalHistoryDateFilters}
        customAdvancedFilters={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ngày hiệu lực</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={effectiveDateRange.from}
                  onChange={(e) => setEffectiveDateRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
                <input
                  type="date"
                  value={effectiveDateRange.to}
                  onChange={(e) => setEffectiveDateRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ngày kết thúc</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={endDateRange.from}
                  onChange={(e) => setEndDateRange((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
                <input
                  type="date"
                  value={endDateRange.to}
                  onChange={(e) => setEndDateRange((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
              </div>
            </div>
          </div>
        }
        pageSize={5}
        emptyState={historyLoading ? 'Đang tải lịch sử công tác...' : 'Chưa có dữ liệu lịch sử công tác'}
        rowActions={[
          {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: openHistoryDetail,
            className: 'p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors',
          },
        ]}
      />

      <Modal isOpen={historyDetailOpen} onClose={() => setHistoryDetailOpen(false)} title="Chi tiết lịch sử chức vụ" size="lg">
        {selectedHistoryRow ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Mã lịch sử</p>
                <p className="font-medium text-gray-900">{selectedHistoryRow.id}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Nhân viên</p>
                <p className="font-medium text-gray-900">
                  NV{String(selectedHistoryRow.employeeId).padStart(3, '0')} - {selectedHistoryRow.employeeName || '-'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ngày hiệu lực</p>
                <p className="font-medium text-gray-900">
                  {selectedHistoryRow.effectiveDate ? new Date(selectedHistoryRow.effectiveDate).toLocaleDateString('vi-VN') : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ngày kết thúc</p>
                <p className="font-medium text-gray-900">
                  {selectedHistoryRow.endDate ? new Date(selectedHistoryRow.endDate).toLocaleDateString('vi-VN') : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Chức vụ cũ</p>
                <p className="font-medium text-gray-900">{selectedHistoryRow.oldPositionName || '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Chức vụ mới</p>
                <p className="font-medium text-gray-900">{selectedHistoryRow.newPositionName || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Lương chức vụ cũ</p>
                <p className="font-medium text-gray-900">{formatMoney(selectedHistoryRow.oldBaseSalary || 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Lương chức vụ mới</p>
                <p className="font-medium text-gray-900">{formatMoney(selectedHistoryRow.newBaseSalary || 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-500">Người duyệt</p>
                <p className="font-medium text-gray-900">
                  {selectedHistoryRow.approverId
                    ? `NV${String(selectedHistoryRow.approverId).padStart(3, '0')} - ${selectedHistoryRow.approverName || 'Chưa cập nhật'}`
                    : 'Chưa cập nhật'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-500">Ghi chú</p>
                <p className="font-medium text-gray-900">{selectedHistoryRow.note || '-'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryDetailOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isCreating ? 'Thêm chức vụ mới' : 'Cập nhật chức vụ & lương'}>
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Chức vụ</label>
            <input
              value={form.positionName}
              disabled={!isCreating}
              onChange={(e) => setForm((prev) => ({ ...prev, positionName: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${isCreating ? 'border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400/50' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Lương cơ bản</label>
              <input
                type="number"
                min={0}
                step={100000}
                value={form.baseSalary}
                onChange={(e) => setForm((prev) => ({ ...prev, baseSalary: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tỷ lệ hoa hồng (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.commissionRate}
                onChange={(e) => setForm((prev) => ({ ...prev, commissionRate: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value={1}>Đang áp dụng</option>
              <option value={0}>Ngưng áp dụng</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button onClick={handleSave} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 transition-colors">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Chuyển công tác">
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nhân viên</label>
            <select
              value={transferForm.employeeId}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, employeeId: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value="">Chọn nhân viên</option>
              {employees.filter((emp) => Number(emp.TT) === 1).map((emp) => (
                <option key={emp.MNV} value={emp.MNV}>
                  {`NV${String(emp.MNV).padStart(3, '0')} - ${emp.HOTEN} (${emp.TENCHUCVU || 'Chưa có chức vụ'})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Chức vụ mới</label>
            <select
              value={transferForm.newPositionId}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, newPositionId: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value="">Chọn chức vụ mới</option>
              {rows.map((position) => (
                <option key={position.id} value={position.id}>
                  {`${position.positionName} (${formatMoney(position.baseSalary)}${Number(position.status) === 0 ? ' - Ngưng áp dụng' : ''})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
            <input
              type="date"
              value={transferForm.effectiveDate}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, effectiveDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Lý do chuyển</label>
            <textarea
              rows={3}
              value={transferForm.note}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Nhập ghi chú chuyển công tác..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setTransferModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button onClick={handleTransfer} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 transition-colors">
              Xác nhận chuyển công tác
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
