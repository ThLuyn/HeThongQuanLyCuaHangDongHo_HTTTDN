// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { loadAuthSession } from '../utils/authStorage';
import { createImportReceiptApi, getImportReceiptsApi, getProductsApi, getSuppliersApi, } from '../utils/backendApi';
const STATUS_LABEL = {
    0: 'Đã hủy',
    1: 'Đã duyệt',
};
const VND = new Intl.NumberFormat('vi-VN');
const columns = [
    { key: 'id', label: 'Mã phiếu' },
    { key: 'date', label: 'Ngày nhập' },
    { key: 'supplier', label: 'Nhà cung cấp' },
    { key: 'employee', label: 'Nhân viên' },
    { key: 'total', label: 'Tổng tiền' },
    {
        key: 'status',
        label: 'Trạng thái',
        render: (val) => (<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${val === 'Đã duyệt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {val}
      </span>),
    },
];
export function StockReceipts() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receipts, setReceipts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mncc, setMncc] = useState('');
    const [items, setItems] = useState([{ msp: '', sl: 1, tienNhap: 0 }]);
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
    const viewRows = useMemo(() => {
        return receipts.map((row) => ({
            id: `PNK${String(row.MPN).padStart(4, '0')}`,
            date: new Date(row.TG).toLocaleString('vi-VN'),
            supplier: row.TENNHACUNGCAP || `NCC #${row.MNCC}`,
            employee: row.TENNHANVIEN || '-',
            total: `${VND.format(Number(row.TIEN || 0))} đ`,
            status: STATUS_LABEL[Number(row.TT)] || 'Không xác định',
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
    const validateForm = () => {
        if (mncc === '') {
            setError('Vui lòng chọn nhà cung cấp.');
            return false;
        }
        if (items.length === 0) {
            setError('Phiếu nhập cần ít nhất 1 sản phẩm.');
            return false;
        }
        const invalid = items.some((line) => line.msp === '' || Number(line.sl) <= 0 || Number(line.tienNhap) <= 0);
        if (invalid) {
            setError('Mỗi dòng phải chọn sản phẩm, số lượng > 0 và giá nhập > 0.');
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
            await createImportReceiptApi({
                mnv: session?.mnv,
                mncc: Number(mncc),
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
    return (<>
      {error && (<div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {error}
        </div>)}

      {loading ? (<div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">
          Đang tải dữ liệu phiếu nhập...
        </div>) : (<DataTable title="Phiếu nhập kho" columns={columns} data={viewRows} searchPlaceholder="Tìm phiếu nhập..." onAdd={openCreate} addLabel="Tạo phiếu nhập" emptyState={<div>
              <p className="font-medium text-gray-500">Chưa có phiếu nhập nào</p>
              <p className="mt-1 text-xs text-gray-400">Tạo phiếu nhập đầu tiên để đồng bộ tồn kho với cơ sở dữ liệu.</p>
            </div>}/>)}

      <Modal isOpen={modalOpen} onClose={closeCreate} title="Tạo phiếu nhập kho" size="lg">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nhà cung cấp *</label>
            <select value={mncc} onChange={(e) => setMncc(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
              <option value="">-- Chọn nhà cung cấp --</option>
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

            {items.map((line, index) => (<div key={index} className="grid grid-cols-12 gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="col-span-12 md:col-span-5">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Sản phẩm</label>
                  <select value={line.msp} onChange={(e) => updateLine(index, { msp: e.target.value ? Number(e.target.value) : '' })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((p) => (<option key={p.MSP} value={p.MSP}>
                        {p.TEN} (MSP: {p.MSP})
                      </option>))}
                  </select>
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Số lượng</label>
                  <input type="number" min={1} value={line.sl} onChange={(e) => updateLine(index, { sl: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                </div>

                <div className="col-span-6 md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Giá nhập</label>
                  <input type="number" min={1} value={line.tienNhap} onChange={(e) => updateLine(index, { tienNhap: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                </div>

                <div className="col-span-12 md:col-span-2 md:flex md:items-end">
                  <button type="button" onClick={() => removeLine(index)} disabled={items.length === 1} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                    Xóa
                  </button>
                </div>
              </div>))}
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
    </>);
}
