// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { createMyLeaveRequestApi, getMyLeaveRequestsApi } from '../utils/backendApi';
import { resolveImageSource } from '../utils/imageSource';

const LEAVE_TYPE_LABEL = {
  0: 'Phép năm',
  1: 'Không lương',
  2: 'Chế độ',
  3: 'Nghỉ việc',
};

const STATUS_LABEL = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Từ chối',
};

function getStatusBadgeClass(status) {
  if (Number(status) === 1) return 'bg-emerald-100 text-emerald-700';
  if (Number(status) === 2) return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export function MyLeaveRequests() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formExpanded, setFormExpanded] = useState(true);
  const [rows, setRows] = useState([]);
  const [tableResetSignal, setTableResetSignal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [form, setForm] = useState({
    type: 0,
    startDate: '',
    endDate: '',
    resignationDate: '',
    reason: '',
  });

  const loadMyRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyLeaveRequestsApi();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải đơn nghỉ của tôi';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, []);

  useEffect(() => {
    setTableResetSignal((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(''), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const tableRows = useMemo(
    () =>
      rows.map((item) => {
        const leaveType = LEAVE_TYPE_LABEL[Number(item.LOAI)] || 'Khác';
        const startDate = item.NGAYNGHI || null;
        const endDate = Number(item.LOAI) === 3
          ? item.NGAY_NGHIVIEC || item.NGAYNGHI || null
          : item.NGAYKETTHUC || item.NGAYNGHI || null;

        return {
          id: Number(item.MDN),
          code: `DON${String(item.MDN).padStart(4, '0')}`,
          leaveType,
          startDate,
          endDate,
          reason: item.LYDO || '-',
          statusCode: Number(item.TRANGTHAI),
          statusText: STATUS_LABEL[Number(item.TRANGTHAI)] || 'Không xác định',
          createdAt: item.NGAYTAO || null,
          reviewerNote: item.GHICHU || '-',
          evidence: item.MINHCHUNG || null,
        };
      }),
    [rows],
  );

  const columns = [
    { key: 'code', label: 'Mã đơn' },
    { key: 'leaveType', label: 'Loại nghỉ' },
    {
      key: 'startDate',
      label: 'Ngày bắt đầu',
      render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-'),
    },
    {
      key: 'endDate',
      label: 'Ngày kết thúc',
      render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-'),
    },
    { key: 'reason', label: 'Lý do' },
    {
      key: 'statusText',
      label: 'Trạng thái',
      render: (_value, row) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(row.statusCode)}`}>
          {row.statusText}
        </span>
      ),
    },
    { key: 'reviewerNote', label: 'Ghi chú duyệt' },
  ];

  const openDetail = (row) => {
    setSelectedRow(row);
    setDetailOpen(true);
  };

  const submitRequest = async () => {
    const type = Number(form.type);
    const startDate = String(form.startDate || '').trim();
    const endDate = String(form.endDate || '').trim();
    const resignationDate = String(form.resignationDate || '').trim();
    const reason = String(form.reason || '').trim();

    if (![0, 1, 2, 3].includes(type)) {
      setError('Loại nghỉ không hợp lệ');
      return;
    }

    if (!startDate) {
      setError('Vui lòng chọn ngày bắt đầu');
      return;
    }

    if (type === 3) {
      if (!resignationDate) {
        setError('Vui lòng chọn ngày nghỉ việc chính thức');
        return;
      }
    } else if (!endDate) {
      setError('Vui lòng chọn ngày kết thúc');
      return;
    }

    if (!reason) {
      setError('Vui lòng nhập lý do');
      return;
    }

    if ([0, 2].includes(type) && evidenceFile && evidenceFile.size > 8 * 1024 * 1024) {
      setError('Minh chứng tối đa 8MB');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createMyLeaveRequestApi({
        type,
        startDate,
        endDate: type === 3 ? undefined : endDate,
        resignationDate: type === 3 ? resignationDate : undefined,
        reason,
        evidenceFile: [0, 2].includes(type) ? evidenceFile : null,
      });

      setSuccess('Nộp đơn thành công');
      setForm({
        type: 0,
        startDate: '',
        endDate: '',
        resignationDate: '',
        reason: '',
      });
      setEvidenceFile(null);
      await loadMyRequests();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể nộp đơn';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">Nộp đơn xin nghỉ</h2>
          <button
            type="button"
            onClick={() => setFormExpanded((prev) => !prev)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {formExpanded ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>

        {formExpanded ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Loại nghỉ</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value={0}>Phép năm</option>
              <option value={1}>Không lương</option>
              <option value={2}>Chế độ (ốm đau/thai sản)</option>
              <option value={3}>Nghỉ việc</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>

          {Number(form.type) === 3 ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ngày nghỉ việc chính thức</label>
              <input
                type="date"
                value={form.resignationDate}
                onChange={(e) => setForm((prev) => ({ ...prev, resignationDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ngày kết thúc</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Lý do</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              placeholder="Nhập lý do nghỉ..."
            />
          </div>

          {[0, 2].includes(Number(form.type)) ? (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Minh chứng (ảnh/PDF)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setEvidenceFile(file);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
              <p className="mt-1 text-xs text-gray-500">Chỉ áp dụng cho Phép năm và Chế độ, tối đa 8MB.</p>
            </div>
          ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setForm({
                type: 0,
                startDate: '',
                endDate: '',
                resignationDate: '',
                reason: '',
              });
              setEvidenceFile(null);
            }}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={submitRequest}
            disabled={saving}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-60"
          >
            {saving ? 'Đang gửi...' : 'Nộp đơn'}
          </button>
            </div>
          </>
        ) : null}
      </section>

      {loading ? (
        <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">Đang tải danh sách đơn của bạn...</div>
      ) : null}

      <DataTable
        resetSignal={tableResetSignal}
        title="Đơn xin nghỉ của tôi"
        columns={columns}
        data={tableRows}
        searchPlaceholder="Tìm đơn nghỉ..."
        pageSize={5}
        defaultSortBy="createdAt"
        defaultSortDirection="desc"
        rowActions={[
          {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: openDetail,
            className: 'p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors',
          },
        ]}
      />

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết đơn xin nghỉ" size="lg">
        {selectedRow ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Mã đơn</p>
                <p className="font-medium text-gray-900">{selectedRow.code}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Loại nghỉ</p>
                <p className="font-medium text-gray-900">{selectedRow.leaveType}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ngày bắt đầu</p>
                <p className="font-medium text-gray-900">{selectedRow.startDate ? new Date(selectedRow.startDate).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ngày kết thúc</p>
                <p className="font-medium text-gray-900">{selectedRow.endDate ? new Date(selectedRow.endDate).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Ngày tạo</p>
                <p className="font-medium text-gray-900">{selectedRow.createdAt ? new Date(selectedRow.createdAt).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Trạng thái</p>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(selectedRow.statusCode)}`}>
                  {selectedRow.statusText}
                </span>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-500">Lý do</p>
                <p className="font-medium text-gray-900">{selectedRow.reason || '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-500">Ghi chú duyệt</p>
                <p className="font-medium text-gray-900">{selectedRow.reviewerNote || '-'}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-gray-500">Minh chứng</p>
                {selectedRow.evidence ? (
                  <a
                    href={resolveImageSource(selectedRow.evidence)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 underline"
                  >
                    Xem minh chứng
                  </a>
                ) : (
                  <p className="font-medium text-gray-900">-</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
