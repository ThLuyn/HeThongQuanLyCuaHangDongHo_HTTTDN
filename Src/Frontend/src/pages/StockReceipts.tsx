// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { loadAuthSession } from '../utils/authStorage';
import { createImportReceiptApi, decideImportReceiptApi, getImportReceiptDetailApi, getImportReceiptsApi, getProductsApi, getSuppliersApi, } from '../utils/backendApi';
const STATUS_LABEL = {
  0: 'Đã hủy',
  1: 'Hoàn thành',
  2: 'Chờ duyệt',
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
      : val === 'Đã hủy'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700'}`}>
      {val}
    </span>),
  },
];
export function StockReceipts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [receiptRows, supplierRows, productRows] = await Promise.all([
        getImportReceiptsApi(100),
        getSuppliersApi(),
        getProductsApi(),
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
    if (!successMessage)
      return;
    const timer = setTimeout(() => setSuccessMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [successMessage]);
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
    const invalid = items.some((line) => line.msp === '' || Number(line.sl) <= 0 || Number(line.tienNhap) <= 0);
    if (invalid) {
      setError('Mỗi dòng phải chọn sản phẩm, số lượng > 0 và giá nhập > 0.');
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
    setSuccessMessage('');
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
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tạo phiếu nhập kho';
      setError(message);
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
    setSuccessMessage('');
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
  const decideReceipt = async (row, action) => {
    if (Number(row.statusCode) !== 2) {
      setError('Phiếu này đã được xử lý trước đó.');
      return;
    }
    const reason = action === 'reject'
      ? window.prompt(`Lý do từ chối phiếu ${row.id} (có thể để trống):`, '') || ''
      : '';
    setError('');
    setSuccessMessage('');
    try {
      await decideImportReceiptApi(Number(row.mpn), {
        action,
        reason: reason.trim() || undefined,
      });
      if (action === 'approve') {
        setSuccessMessage('Đã duyệt phiếu nhập thành công');
      }
      await loadAll();
      if (detailOpen && detail && Number(detail.MPN) === Number(row.mpn)) {
        const refreshed = await getImportReceiptDetailApi(Number(row.mpn));
        setDetail(refreshed);
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể cập nhật trạng thái phiếu nhập';
      setError(message);
    }
  };
  const rowActions = [
    {
      key: 'view',
      label: 'Xem',
      onClick: openDetail,
      className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
    },
    {
      key: 'approve',
      label: 'Duyệt',
      onClick: (row) => decideReceipt(row, 'approve'),
      className: 'p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors',
      hidden: (row) => Number(row.statusCode) !== 2,
    },
    {
      key: 'reject',
      label: 'Từ chối',
      onClick: (row) => decideReceipt(row, 'reject'),
      className: 'p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
      hidden: (row) => Number(row.statusCode) !== 2,
    },
  ];
  return (<>
    {error && (<div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
      {error}
    </div>)}
    {successMessage && (<div className="mb-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
      {successMessage}
    </div>)}

    {loading && (<div className="mb-3 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      Đang tải dữ liệu phiếu nhập...
    </div>)}

    <DataTable title="Phiếu nhập kho" columns={columns} data={viewRows} searchPlaceholder="Tìm kiếm..." advancedFilterKeys={["supplier", "employee", "status", "date", "total", "productCount", "qtyTotal"]} forceSelectFilterKeys={["supplier", "employee", "status"]} rangeFilterKeys={[
      { key: 'total', minPlaceholder: 'Tổng tiền từ', maxPlaceholder: 'Tổng tiền đến', inputType: 'number' },
      { key: 'date', minPlaceholder: 'Ngày nhập từ', maxPlaceholder: 'Ngày nhập đến', inputType: 'date' },
      { key: 'productCount', minPlaceholder: 'Số dòng SP từ', maxPlaceholder: 'Số dòng SP đến', inputType: 'number' },
      { key: 'qtyTotal', minPlaceholder: 'Tổng SL từ', maxPlaceholder: 'Tổng SL đến', inputType: 'number' },
    ]} onAdd={openCreate} addLabel="Tạo phiếu nhập" rowActions={rowActions} emptyState={<div>
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
                <input type="number" min={1} value={line.sl} onChange={(e) => updateLine(index, { sl: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50" />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Giá nhập</label>
                <input type="number" min={1} value={line.tienNhap} onChange={(e) => updateLine(index, { tienNhap: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50" />
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
          Lý do từ chối/hủy: {detail.LYDOHUY}
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
  </>);
}
