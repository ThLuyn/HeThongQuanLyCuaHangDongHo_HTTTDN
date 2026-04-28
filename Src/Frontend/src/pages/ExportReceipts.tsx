// @ts-nocheck
import { Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { POSPage } from './POSPage';
import {
  cancelExportReceiptApi,
  getExportReceiptDetailApi,
  getExportReceiptsApi,
} from '../utils/backendApi';
import { usePermission } from '../components/PermissionContext';

const STATUS_LABEL = {
  0: 'Đã hủy',
  1: 'Đã bán',
};

const VND = new Intl.NumberFormat('vi-VN');

// ─── Invoice print ─────────────────────────────────────────────────────────────
const buildInvoiceHTML = (data) => {
  const receiptId = `PXK${String(data.MPX).padStart(4, '0')}`;
  const date = new Date(data.TG).toLocaleString('vi-VN');
  const items = data.ITEMS || [];
  const total = Number(data.TIEN || 0);
  const rows = items.map((line) => `
    <tr>
      <td>${line.MSP}</td><td>${line.TENSP}</td>
      <td style="text-align:right">${Number(line.SL || 0)}</td>
      <td style="text-align:right">${VND.format(Number(line.TIENXUAT || 0))} đ</td>
      <td style="text-align:right"><strong>${VND.format(Number(line.THANHTIEN || 0))} đ</strong></td>
    </tr>`).join('');
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"/><title>Hóa đơn ${receiptId}</title>
<style>body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:32px}h2{text-align:center;margin-bottom:4px;font-size:20px}.subtitle{text-align:center;color:#555;margin-bottom:20px;font-size:13px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:20px}.info-grid span{color:#555}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f3f4f6;padding:8px;text-align:left;border-bottom:2px solid #e5e7eb}td{padding:7px 8px;border-bottom:1px solid #e5e7eb}.total-row{font-size:15px;font-weight:bold;text-align:right;margin-top:8px}.footer{text-align:center;margin-top:32px;color:#888;font-size:12px}@media print{body{margin:16px}}</style>
</head><body>
<h2>GOLDEN TIME</h2><div class="subtitle">HÓA ĐƠN BÁN HÀNG</div>
<div class="info-grid">
  <div><span>Mã phiếu:</span> <strong>${receiptId}</strong></div>
  <div><span>Ngày bán:</span> ${date}</div>
  <div><span>Khách hàng:</span> ${data.TENKHACHHANG || `KH #${data.MKH}`}</div>
  <div><span>Nhân viên:</span> ${data.TENNHANVIEN || '-'}</div>
</div>
<table><thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th style="text-align:right">SL</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="total-row">Tổng cộng: ${VND.format(total)} đ</div>
<div class="footer">Cảm ơn quý khách đã mua hàng tại Golden Time!</div>
</body></html>`;
};

const printInvoice = (data) => {
  const html = buildInvoiceHTML(data);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.open(); iframe.contentDocument.write(html); iframe.contentDocument.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
};

// ─── Table columns ─────────────────────────────────────────────────────────────
const columns = [
  { key: 'id', label: 'Mã phiếu' },
  { key: 'date', label: 'Ngày bán', render: (value) => new Date(value).toLocaleString('vi-VN') },
  { key: 'customer', label: 'Khách hàng' },
  { key: 'employee', label: 'Nhân viên' },
  { key: 'productCount', label: 'Số dòng SP' },
  { key: 'qtyTotal', label: 'Tổng SL' },
  { key: 'total', label: 'Tổng tiền', render: (value) => `${VND.format(Number(value || 0))} đ` },
  {
    key: 'status', label: 'Trạng thái',
    render: (val) => (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Đã bán' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {val}
      </span>
    ),
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export function ExportReceipts() {
  const { can } = usePermission();
  // 'list' | 'pos'
  const [view, setView] = useState('list');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [receipts, setReceipts] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // { row, reason }

  const loadReceipts = async () => {
    setLoading(true); setError('');
    try {
      const rows = await getExportReceiptsApi(100);
      setReceipts(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu phiếu xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReceipts(); }, []);

  const viewRows = useMemo(() =>
    receipts.map((row) => ({
      mpx: Number(row.MPX),
      id: `PXK${String(row.MPX).padStart(4, '0')}`,
      date: row.TG,
      customer: row.TENKHACHHANG || `KH #${row.MKH}`,
      employee: row.TENNHANVIEN || '-',
      productCount: Number(row.SO_DONG_SANPHAM || 0),
      qtyTotal: Number(row.TONG_SO_LUONG || 0),
      total: Number(row.TIEN || 0),
      status: STATUS_LABEL[Number(row.TT)] || 'Không xác định',
      statusCode: Number(row.TT),
      reason: row.LYDOHUY || '',
    })),
    [receipts]
  );

  const openDetail = async (row) => {
    setDetailOpen(true); setDetail(null); setDetailLoading(true); setError('');
    try {
      const data = await getExportReceiptDetailApi(Number(row.mpx));
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải chi tiết phiếu xuất');
    } finally {
      setDetailLoading(false);
    }
  };

  const isWithin24h = (dateStr) => {
    if (!dateStr) return false;
    return Date.now() - new Date(dateStr).getTime() <= 24 * 60 * 60 * 1000;
  };

  const executeCancelReceipt = async (row, reason) => {
    setError('');
    try {
      await cancelExportReceiptApi(Number(row.mpx), reason.trim());
      setToast('Đã hủy phiếu xuất thành công');
      setTimeout(() => setToast(''), 3500);
      await loadReceipts();
      if (detailOpen && detail && Number(detail.MPX) === Number(row.mpx)) {
        const refreshed = await getExportReceiptDetailApi(Number(row.mpx));
        setDetail(refreshed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hủy phiếu xuất');
    }
  };

  const rowActions = [
    {
      key: 'view', label: 'Xem', onClick: openDetail,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
    },
    {
      key: 'print', label: 'In',
      onClick: async (row) => {
        try {
          const invoiceData = await getExportReceiptDetailApi(Number(row.mpx));
          printInvoice(invoiceData);
        } catch (e) { setError('Không thể tải dữ liệu để in hóa đơn'); }
      },
      hidden: (row) => Number(row.statusCode) === 0,
      className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
      render: () => <Printer className="w-4 h-4" />,
    },
    ...(can('phieuxuat', 'delete') ? [{
      key: 'cancel',
      label: 'Hủy phiếu',
      render: (row) => (
        <span title={isWithin24h(row.date) ? 'Hủy phiếu' : 'Đã quá 24h, không thể hủy'}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </span>
      ),
      onClick: (row) => setCancelModal({ row, reason: '' }),
      disabled: (row) => !isWithin24h(row.date),
      className: 'p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors',
      hidden: (row) => Number(row.statusCode) === 0,
    }] : []),
  ];

  // ── Render POS page (thay thế toàn bộ nội dung) ──
  if (view === 'pos') {
    return (
      <POSPage
        onBack={() => {
          setView('list');
          loadReceipts(); // Reload để cập nhật tồn kho sau khi bán
        }}
      />
    );
  }

  // ── Render danh sách phiếu xuất ──
  return (
    <>
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center justify-between gap-4 rounded-xl border border-green-300 bg-green-50 px-5 py-3 text-sm font-medium text-green-800 shadow-lg">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-green-400 hover:text-green-600 font-bold text-base leading-none">×</button>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">
          Đang tải dữ liệu phiếu xuất...
        </div>
      ) : (
        <DataTable
          title="Phiếu xuất hàng"
          columns={columns}
          data={viewRows}
          searchPlaceholder="Tìm kiếm..."
          advancedFilterKeys={['customer', 'employee', 'status', 'date', 'total', 'productCount', 'qtyTotal']}
          forceSelectFilterKeys={['customer', 'employee', 'status']}
          rangeFilterKeys={[
            { key: 'total', minPlaceholder: 'Tổng tiền từ', maxPlaceholder: 'Tổng tiền đến', inputType: 'number' },
            { key: 'date', minPlaceholder: 'Ngày bán từ', maxPlaceholder: 'Ngày bán đến', inputType: 'date' },
            { key: 'productCount', minPlaceholder: 'Số dòng SP từ', maxPlaceholder: 'Số dòng SP đến', inputType: 'number' },
            { key: 'qtyTotal', minPlaceholder: 'Tổng SL từ', maxPlaceholder: 'Tổng SL đến', inputType: 'number' },
          ]}
          {...(can('phieuxuat', 'create') ? { onAdd: () => setView('pos'), addLabel: 'Tạo phiếu xuất' } : {})}
          rowActions={rowActions}
          defaultSortBy="id"
          defaultSortDirection="desc"
          emptyState={
            <div>
              <p className="font-medium text-gray-500">Chưa có phiếu xuất nào</p>
              <p className="mt-1 text-xs text-gray-400">Tạo phiếu xuất bán tại quầy đầu tiên để đồng bộ doanh thu và tồn kho.</p>
            </div>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết phiếu xuất hàng" size="xl">
        {detailLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">Đang tải chi tiết phiếu...</div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Mã phiếu', value: `PXK${String(detail.MPX).padStart(4, '0')}` },
                { label: 'Khách hàng', value: detail.TENKHACHHANG || `KH #${detail.MKH}` },
                { label: 'Nhân viên', value: detail.TENNHANVIEN || '-' },
                { label: 'Trạng thái', value: STATUS_LABEL[Number(detail.TT)] || 'Không xác định' },
                { label: 'Số dòng sản phẩm', value: Number(detail.SO_DONG_SANPHAM || 0) },
                { label: 'Tổng số lượng', value: Number(detail.TONG_SO_LUONG || 0) },
                { label: 'Ngày bán', value: new Date(detail.TG).toLocaleString('vi-VN') },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-600">Tổng tiền</p>
                <p className="font-semibold text-blue-800">{VND.format(Number(detail.TIEN || 0))} đ</p>
              </div>
            </div>
            {detail.LYDOHUY && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                Lý do hủy: {detail.LYDOHUY}
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Mã SP</th>
                    <th className="px-3 py-2 text-left font-medium">Tên sản phẩm</th>
                    <th className="px-3 py-2 text-right font-medium">SL</th>
                    <th className="px-3 py-2 text-right font-medium">Giá xuất</th>
                    <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(detail.ITEMS || []).map((line) => (
                    <tr key={`${line.MSP}-${line.TENSP}`}>
                      <td className="px-3 py-2">{line.MSP}</td>
                      <td className="px-3 py-2">{line.TENSP}</td>
                      <td className="px-3 py-2 text-right">{Number(line.SL || 0)}</td>
                      <td className="px-3 py-2 text-right">{VND.format(Number(line.TIENXUAT || 0))} đ</td>
                      <td className="px-3 py-2 text-right font-medium">{VND.format(Number(line.THANHTIEN || 0))} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setDetailOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">Không có dữ liệu chi tiết.</div>
        )}
      </Modal>

      {/* Modal hủy phiếu nhập */}
      {cancelModal && (() => {
        const hoursLeft = cancelModal.row.date
          ? Math.max(0, 24 - (Date.now() - new Date(cancelModal.row.date).getTime()) / 3600000)
          : 0;

        const canStillCancel = hoursLeft > 0;

        const hoursLeftStr = hoursLeft >= 1
          ? `${Math.floor(hoursLeft)} giờ ${Math.round((hoursLeft % 1) * 60)} phút`
          : `${Math.round(hoursLeft * 60)} phút`;

        const reasonTrimmed = cancelModal.reason.trim();

        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setCancelModal(null)}
            />

            {/* Modal */}
            <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 flex items-center gap-3 border-b">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Hủy phiếu xuất
                  </h3>
                  <p className="text-xs text-gray-500">{cancelModal.row.id}</p>
                </div>

                <button
                  onClick={() => setCancelModal(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Time */}
                {canStillCancel && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                    ⏳ Còn <b>{hoursLeftStr}</b> để hủy phiếu này
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Lý do hủy <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    autoFocus
                    rows={3}
                    value={cancelModal.reason}
                    onChange={(e) =>
                      setCancelModal((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none transition
              ${reasonTrimmed
                        ? 'border-gray-200 focus:ring-2 focus:ring-blue-400/40'
                        : 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-300/40'
                      }`}
                    maxLength={300}
                  />

                  <div className="flex justify-between mt-1 text-xs">
                    <span className={reasonTrimmed ? 'text-gray-400' : 'text-red-500'}>
                      {reasonTrimmed ? '' : 'Bắt buộc nhập lý do'}
                    </span>
                    <span className="text-gray-400">
                      {cancelModal.reason.length}/300
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setCancelModal(null)}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => {
                      if (!reasonTrimmed) return;
                      const { row, reason } = cancelModal;
                      setCancelModal(null);
                      executeCancelReceipt(row, reason);
                    }}
                    disabled={!reasonTrimmed || !canStillCancel}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
                  >
                    Xác nhận hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}