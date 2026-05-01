// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { usePermission } from '../components/PermissionContext';
import { loadAuthSession } from '../utils/authStorage';
import { createImportReceiptApi, cancelImportReceiptApi, getImportReceiptDetailApi, getImportReceiptsApi, getProductsApi, getSuppliersApi, } from '../utils/backendApi';
const STATUS_LABEL = {
  0: 'Đã hủy',
  1: 'Hoàn thành',
};
const VND = new Intl.NumberFormat('vi-VN');
const columns = [
  { key: 'id', label: 'Mã phiếu' },
  {
    key: 'date',
    label: 'Ngày nhập',
    render: (value) => new Date(value).toLocaleString('vi-VN'),
  },
  { key: 'supplier', label: 'Nhà cung cấp' },
  { key: 'employee', label: 'Nhân viên' },
  { key: 'productCount', label: 'Số dòng SP' },
  { key: 'qtyTotal', label: 'Tổng SL' },
  {
    key: 'total',
    label: 'Tổng tiền',
    render: (value) => `${VND.format(Number(value || 0))} đ`,
  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (val) => (<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${val === 'Hoàn thành'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700'}`}>
      {val}
    </span>),
  },
];
export function StockReceipts() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ type: 'success', message: '' });
  const showNotice = (message, type = 'success') => {
    if (!message) return;
    setNotice({ type, message: String(message) });
  };
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mncc, setMncc] = useState('');
  const [items, setItems] = useState([{ msp: '', sl: 1, tienNhap: 0 }]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // { row, reason }

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [receiptRows, supplierRows, productRows] = await Promise.all([
        getImportReceiptsApi(100),
        can('nhacungcap', 'view') ? getSuppliersApi().catch(() => []) : Promise.resolve([]),
        can('sanpham', 'view') ? getProductsApi().catch(() => []) : Promise.resolve([]),
      ]);
      setReceipts(receiptRows);
      setSuppliers(supplierRows.filter((x) => Number(x.TT) === 1));
      setProducts(productRows.filter((x) => Number(x.TT) === 1));
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải dữ liệu phiếu nhập';
      setError(message);
    }
    finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAll();
  }, []);
  useEffect(() => {
    if (!notice.message) return;
    const timer = window.setTimeout(() => setNotice((prev) => ({ ...prev, message: '' })), 8000);
    return () => window.clearTimeout(timer);
  }, [notice.message]);
  const viewRows = useMemo(() => {
    return receipts.map((row) => ({
      mpn: Number(row.MPN),
      id: `PNK${String(row.MPN).padStart(4, '0')}`,
      date: row.TG,
      supplier: row.TENNHACUNGCAP || `NCC #${row.MNCC}`,
      employee: row.TENNHANVIEN || '-',
      productCount: Number(row.SO_DONG_SANPHAM || 0),
      qtyTotal: Number(row.TONG_SO_LUONG || 0),
      total: Number(row.TIEN || 0),
      status: STATUS_LABEL[Number(row.TT)] || 'Không xác định',
      statusCode: Number(row.TT),
      reason: row.LYDOHUY || '',
    }));
  }, [receipts]);
  const resetForm = () => {
    setMncc('');
    setItems([{ msp: '', sl: 1, tienNhap: 0 }]);
  };
  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };
  const closeCreate = () => {
    setModalOpen(false);
    resetForm();
  };
  const addLine = () => {
    setItems((prev) => [...prev, { msp: '', sl: 1, tienNhap: 0 }]);
  };
  const removeLine = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };
  const updateLine = (index, patch) => {
    setItems((prev) => prev.map((line, idx) => (idx === index ? { ...line, ...patch } : line)));
  };
  const computedTotal = useMemo(() => {
    return items.reduce((sum, line) => sum + Number(line.sl || 0) * Number(line.tienNhap || 0), 0);
  }, [items]);
  const filteredProducts = useMemo(() => {
    if (!mncc)
      return [];
    return products.filter((product) => Number(product.MNCC) === Number(mncc));
  }, [products, mncc]);
  const availableProducts = useMemo(() => {
    if (!mncc)
      return products;
    return filteredProducts;
  }, [products, filteredProducts, mncc]);
  useEffect(() => {
    if (!mncc) {
      return;
    }
    setItems((prev) => prev.map((line) => {
      if (!line.msp)
        return line;
      const matched = filteredProducts.some((product) => Number(product.MSP) === Number(line.msp));
      return matched ? line : { ...line, msp: '' };
    }));
  }, [mncc, filteredProducts]);
  const validateForm = () => {
    if (items.length === 0) {
      setError('Phiếu nhập cần ít nhất 1 sản phẩm.');
      return false;
    }
    const invalid = items.some((line) => line.msp === '' || !Number.isInteger(Number(line.sl)) || Number(line.sl) <= 0 || !Number.isInteger(Number(line.tienNhap)) || Number(line.tienNhap) <= 0);
    if (invalid) {
      setError('Mỗi dòng phải chọn sản phẩm, số lượng và giá nhập phải là số nguyên dương.');
      return false;
    }

    const selectedProducts = items
      .map((line) => products.find((product) => Number(product.MSP) === Number(line.msp)))
      .filter(Boolean);
    if (selectedProducts.length !== items.length) {
      setError('Có sản phẩm không hợp lệ trong phiếu nhập.');
      return false;
    }
    const supplierIds = Array.from(new Set(selectedProducts.map((product) => Number(product.MNCC))));
    if (supplierIds.length !== 1) {
      setError('Một phiếu nhập chỉ được chứa sản phẩm của cùng một nhà cung cấp.');
      return false;
    }

    return true;
  };
  const saveReceipt = async () => {
    if (!validateForm())
      return;
    setSaving(true);
    setError('');
    try {
      const session = loadAuthSession();
      const inferredSupplierId = Number(mncc || products.find((product) => Number(product.MSP) === Number(items[0]?.msp))?.MNCC || 0);
      if (!inferredSupplierId) {
        setError('Không xác định được nhà cung cấp cho phiếu nhập.');
        return;
      }
      await createImportReceiptApi({
        mnv: session?.mnv,
        mncc: inferredSupplierId,
        items: items.map((line) => ({
          msp: Number(line.msp),
          sl: Number(line.sl),
          tienNhap: Number(line.tienNhap),
        })),
      });
      closeCreate();
      await loadAll();
      showNotice('Tạo phiếu nhập kho thành công', 'success');
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tạo phiếu nhập kho';
      showNotice(message, 'error');
    }
    finally {
      setSaving(false);
    }
  };
  const openDetail = async (row) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    try {
      const detailData = await getImportReceiptDetailApi(Number(row.mpn));
      setDetail(detailData);
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải chi tiết phiếu nhập';
      setError(message);
    }
    finally {
      setDetailLoading(false);
    }
  };
  const executeCancelReceipt = async (row, reason) => {
    try {
      await cancelImportReceiptApi(Number(row.mpn), { reason: reason.trim() });
      await loadAll();
      if (detailOpen && detail && Number(detail.MPN) === Number(row.mpn)) {
        const refreshed = await getImportReceiptDetailApi(Number(row.mpn));
        setDetail(refreshed);
      }
      showNotice('Đã hủy phiếu nhập thành công', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể hủy phiếu nhập';
      showNotice(message, 'error');
    }
  };

  const isWithin24h = (dateStr) => {
    if (!dateStr) return false;
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff <= 24 * 60 * 60 * 1000;
  };

  const rowActions = [
    {
      key: 'view',
      label: 'Xem',
      onClick: openDetail,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
    },
    ...(can('phieunhap', 'delete') ? [
      {
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
        hidden: (row) => Number(row.statusCode) !== 1,
      },
    ] : []),
  ];
  return (<>
    {error && (<div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
      {error}
    </div>)}
    {loading && (<div className="mb-3 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      Đang tải dữ liệu phiếu nhập...
    </div>)}

    <DataTable title="Phiếu nhập kho" columns={columns} data={viewRows} searchPlaceholder="Tìm kiếm..." defaultSortBy="id" defaultSortDirection="desc" advancedFilterKeys={["supplier", "employee", "status", "date", "total", "productCount", "qtyTotal"]} forceSelectFilterKeys={["supplier", "employee", "status"]} rangeFilterKeys={[
      { key: 'total', minPlaceholder: 'Tổng tiền từ', maxPlaceholder: 'Tổng tiền đến', inputType: 'number' },
      { key: 'date', minPlaceholder: 'Ngày nhập từ', maxPlaceholder: 'Ngày nhập đến', inputType: 'date' },
      { key: 'productCount', minPlaceholder: 'Số dòng SP từ', maxPlaceholder: 'Số dòng SP đến', inputType: 'number' },
      { key: 'qtyTotal', minPlaceholder: 'Tổng SL từ', maxPlaceholder: 'Tổng SL đến', inputType: 'number' },
    ]} {...(can('phieunhap', 'create') ? { onAdd: openCreate, addLabel: 'Tạo phiếu nhập' } : {})} rowActions={rowActions} emptyState={<div>
      <p className="font-medium text-gray-500">Chưa có phiếu nhập nào</p>
      <p className="mt-1 text-xs text-gray-400">Tạo phiếu nhập đầu tiên để đồng bộ tồn kho với cơ sở dữ liệu.</p>
    </div>} />

    <Modal isOpen={modalOpen} onClose={closeCreate} title="Tạo phiếu nhập kho" size="xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nhà cung cấp *</label>
          <select value={mncc} onChange={(e) => setMncc(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
            <option value="">Chọn nhà cung cấp</option>
            {suppliers.map((s) => (<option key={s.MNCC} value={s.MNCC}>
              {s.TEN} ({s.MNCC})
            </option>))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Danh sách sản phẩm</p>
            <button type="button" onClick={addLine} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              + Thêm dòng
            </button>
          </div>

          {items.map((line, index) => {
            const selectedProduct = products.find((product) => Number(product.MSP) === Number(line.msp));
            const oldImportPrice = Number(selectedProduct?.GIANHAP || 0);
            return (<div key={index} className="grid grid-cols-12 gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="col-span-12 md:col-span-5">
                <label className="mb-1 block text-xs font-medium text-gray-600">Sản phẩm</label>
                <select value={line.msp} onChange={(e) => {
                  const nextMsp = e.target.value ? Number(e.target.value) : '';
                  const nextProduct = products.find((product) => Number(product.MSP) === Number(nextMsp));
                  updateLine(index, {
                    msp: nextMsp,
                    tienNhap: nextProduct ? Number(nextProduct.GIANHAP || 0) : line.tienNhap,
                  });
                  if (nextProduct && Number(nextProduct.MNCC) !== Number(mncc || 0)) {
                    setMncc(Number(nextProduct.MNCC));
                  }
                }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                  <option value="">Chọn sản phẩm</option>
                  {availableProducts.map((p) => (<option key={p.MSP} value={p.MSP}>
                    {p.TEN} (MSP: {p.MSP})
                  </option>))}
                </select>
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Số lượng</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={line.sl}
                  onChange={(e) => {
                    const val = Math.floor(Math.abs(Number(e.target.value) || 0));
                    updateLine(index, { sl: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Giá nhập</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={line.tienNhap}
                  onChange={(e) => {
                    const val = Math.floor(Math.abs(Number(e.target.value) || 0));
                    updateLine(index, { tienNhap: val });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="mb-1 block whitespace-nowrap text-xs font-medium text-gray-600">Giá nhập cũ</label>
                <div className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 flex items-center">
                  {oldImportPrice > 0 ? `${VND.format(oldImportPrice)} đ` : '-'}
                </div>
              </div>

              <div className="col-span-12 md:col-span-1 md:flex md:items-end">
                <button type="button" onClick={() => removeLine(index)} disabled={items.length === 1} className="w-full rounded-lg border border-red-200 px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Xóa
                </button>
              </div>
            </div>);
          })}
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Tổng tiền dự kiến: <span className="font-semibold">{VND.format(computedTotal)} đ</span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={closeCreate} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50" type="button">
            Hủy
          </button>
          <button onClick={saveReceipt} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="button">
            {saving ? 'Đang tạo...' : 'Tạo phiếu'}
          </button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết phiếu nhập kho" size="xl">
      {detailLoading ? (<div className="py-8 text-center text-sm text-gray-500">Đang tải chi tiết phiếu...</div>) : detail ? (<div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Mã phiếu</p>
            <p className="font-semibold text-gray-900">PNK{String(detail.MPN).padStart(4, '0')}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Nhân viên</p>
            <p className="font-semibold text-gray-900">{detail.TENNHANVIEN || '-'}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Nhà cung cấp</p>
            <p className="font-semibold text-gray-900">{detail.TENNHACUNGCAP || `NCC #${detail.MNCC}`}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Trạng thái</p>
            <p className="font-semibold text-gray-900">{STATUS_LABEL[Number(detail.TT)] || 'Không xác định'}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Số dòng sản phẩm</p>
            <p className="font-semibold text-gray-900">{Number(detail.SO_DONG_SANPHAM || 0)}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Tổng số lượng</p>
            <p className="font-semibold text-gray-900">{Number(detail.TONG_SO_LUONG || 0)}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Ngày nhập</p>
            <p className="font-semibold text-gray-900">{new Date(detail.TG).toLocaleString('vi-VN')}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-600">Tổng tiền</p>
            <p className="font-semibold text-blue-800">{VND.format(Number(detail.TIEN || 0))} đ</p>
          </div>
        </div>

        {detail.LYDOHUY ? (<div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          Lý do hủy: {detail.LYDOHUY}
        </div>) : null}

        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">STT</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Mã SP</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Sản phẩm</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">SL</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Đơn giá nhập</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {detail.ITEMS.map((item, index) => (<tr key={`${item.MSP}-${index}`}>
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">SP{String(item.MSP).padStart(3, '0')}</td>
                <td className="px-3 py-2">{item.TENSP}</td>
                <td className="px-3 py-2 text-right">{item.SL}</td>
                <td className="px-3 py-2 text-right">{VND.format(Number(item.TIENNHAP || 0))} đ</td>
                <td className="px-3 py-2 text-right font-medium">{VND.format(Number(item.THANHTIEN || 0))} đ</td>
              </tr>))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setDetailOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            Đóng
          </button>
        </div>
      </div>) : (<div className="py-8 text-center text-sm text-gray-500">Không có dữ liệu chi tiết phiếu.</div>)}
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
                  Hủy phiếu nhập
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
    {/* Toast thông báo */}
    {notice.message && (
      <div
        className={`fixed bottom-5 right-5 z-[90] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
          notice.type === 'success' ? 'bg-green-500 text-white' : notice.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}
      >
        <span>{notice.type === 'success' ? '✓' : notice.type === 'error' ? '✕' : 'ℹ'}</span>
        <span>{notice.message}</span>
        <button onClick={() => setNotice((prev) => ({ ...prev, message: '' }))} className="ml-2 opacity-80 hover:opacity-100">×</button>
      </div>
    )}
  </>);
}