// @ts-nocheck
import { FileTextIcon, PackageSearchIcon, PrinterIcon, RefreshCcwIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { createProductApi, deleteProductApi, getInventoryReportApi, getProductsApi, getSuppliersApi, updateProductApi, } from '../utils/backendApi';
const numberFormatter = new Intl.NumberFormat('vi-VN');
function formatMoney(value) {
    return `${numberFormatter.format(value || 0)} đ`;
}
export function WatchCategories() {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [editing, setEditing] = useState(null);
    const now = new Date();
    const [reportYear, setReportYear] = useState(now.getFullYear());
    const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        supplierId: 0,
        brand: '',
        displayPosition: '',
        importPrice: 0,
        sellPrice: 0,
        stock: 0,
        productionYear: null,
        status: 'Hoạt động',
    });
    const supplierNameMap = useMemo(() => {
        const map = new Map();
        suppliers.forEach((s) => map.set(Number(s.MNCC), s.TEN));
        return map;
    }, [suppliers]);
    const columns = [
        { key: 'id', label: 'Mã SP' },
        { key: 'name', label: 'Tên sản phẩm' },
        { key: 'brand', label: 'Thương hiệu' },
        { key: 'supplier', label: 'Nhà cung cấp' },
        { key: 'displayPosition', label: 'Vị trí trưng bày' },
        {
            key: 'importPrice',
            label: 'Giá nhập',
            render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>,
        },
        {
            key: 'sellPrice',
            label: 'Giá bán',
            render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>,
        },
        {
            key: 'stock',
            label: 'Tồn kho',
            render: (val) => <span className="font-semibold text-gray-900">{val}</span>,
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
          {val}
        </span>),
        },
    ];
    const rowActions = [
        {
            key: 'view',
            label: 'Xem chi tiết',
            onClick: (row) => {
                setViewingProduct(row);
                setDetailModalOpen(true);
            },
            className: 'p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors',
        },
        {
            key: 'edit',
            label: 'Sửa',
            onClick: (row) => openEdit(row),
            className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
        },
        {
            key: 'delete',
            label: 'Xóa',
            onClick: (row) => handleDelete(row),
            className: 'p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors',
        },
    ];
    const emptyState = (<div className="flex flex-col items-center gap-2 text-gray-400">
      <PackageSearchIcon className="w-8 h-8 text-gray-300"/>
      <p className="font-medium">Không tìm thấy sản phẩm nào</p>
      <p className="text-xs text-gray-400">Vui lòng thử từ khóa hoặc bộ lọc khác.</p>
    </div>);
    const loadProductsAndSuppliers = async () => {
        try {
            setLoading(true);
            setError('');
            const [productRows, supplierRows] = await Promise.all([getProductsApi(), getSuppliersApi()]);
            setSuppliers(supplierRows);
            const mappedProducts = productRows.map((item) => ({
                msp: Number(item.MSP),
                id: `SP${String(item.MSP).padStart(3, '0')}`,
                name: item.TEN,
                brand: item.THUONGHIEU || 'Chưa cập nhật',
                supplier: item.TENNHACUNGCAP,
                supplierId: Number(item.MNCC),
                displayPosition: item.TENVITRI || 'Chưa cập nhật',
                importPrice: Number(item.GIANHAP || 0),
                sellPrice: Number(item.GIABAN || 0),
                stock: Number(item.SOLUONG || 0),
                productionYear: item.NAMSANXUAT ? Number(item.NAMSANXUAT) : null,
                status: Number(item.TT) === 1 ? 'Hoạt động' : 'Tạm ẩn',
            }));
            setProducts(mappedProducts);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Khong the tai du lieu san pham';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    const loadReport = async () => {
        try {
            setReportLoading(true);
            const report = await getInventoryReportApi(reportMonth, reportYear);
            setReportData(report);
        }
        catch {
            setReportData(null);
        }
        finally {
            setReportLoading(false);
        }
    };
    useEffect(() => {
        loadProductsAndSuppliers();
    }, []);
    useEffect(() => {
        loadReport();
    }, [reportMonth, reportYear]);
    const openAdd = () => {
        setEditing(null);
        setForm({
            name: '',
            supplierId: Number(suppliers[0]?.MNCC || 0),
            brand: '',
            displayPosition: '',
            importPrice: 0,
            sellPrice: 0,
            stock: 0,
            productionYear: null,
            status: 'Hoạt động',
        });
        setModalOpen(true);
    };
    const openEdit = (row) => {
        setEditing(row);
        setForm({
            name: row.name,
            supplierId: row.supplierId,
            brand: row.brand === 'Chưa cập nhật' ? '' : row.brand,
            displayPosition: row.displayPosition === 'Chưa cập nhật' ? '' : row.displayPosition,
            importPrice: row.importPrice,
            sellPrice: row.sellPrice,
            stock: row.stock,
            productionYear: row.productionYear,
            status: row.status,
        });
        setModalOpen(true);
    };
    const handleSave = async () => {
        if (!form.name.trim() || !form.supplierId)
            return;
        const payload = {
            name: form.name.trim(),
            mncc: Number(form.supplierId),
            brand: form.brand.trim() || undefined,
            displayPosition: form.displayPosition.trim() || undefined,
            importPrice: Number(form.importPrice || 0),
            sellPrice: Number(form.sellPrice || 0),
            stock: Number(form.stock || 0),
            productionYear: form.productionYear || null,
            status: form.status === 'Hoạt động' ? 1 : 0,
        };
        try {
            if (editing) {
                await updateProductApi(editing.msp, payload);
            }
            else {
                await createProductApi(payload);
            }
            setModalOpen(false);
            await loadProductsAndSuppliers();
            await loadReport();
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'Khong the luu san pham');
        }
    };
    const handleDelete = async (row) => {
        if (!confirm(`Xóa sản phẩm "${row.name}"?`))
            return;
        try {
            await deleteProductApi(row.msp);
            await loadProductsAndSuppliers();
            await loadReport();
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'Khong the xoa san pham');
        }
    };
    return (<div className="space-y-4">
      {error && (<div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Không tải được dữ liệu backend: {error}
        </div>)}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-gold-600"/>
            Báo cáo thống kê sản phẩm theo tháng/năm
          </h3>
          <div className="flex items-center gap-2">
            <select value={reportMonth ?? ''} onChange={(e) => setReportMonth(e.target.value ? Number(e.target.value) : null)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="">Cả năm</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (<option key={month} value={month}>
                  Tháng {month}
                </option>))}
            </select>
            <input type="number" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value) || now.getFullYear())} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            <button onClick={loadReport} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCcwIcon className="w-4 h-4"/>
              Làm mới
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-gold-500 hover:bg-gold-600 rounded-lg">
              <PrinterIcon className="w-4 h-4"/>
              In báo cáo
            </button>
          </div>
        </div>

        {reportLoading ? (<p className="text-sm text-gray-500">Đang tải báo cáo...</p>) : reportData ? (<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 text-sm">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-gray-500">Tổng sản phẩm</p>
              <p className="font-semibold">{reportData.summary.TONG_SANPHAM || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-gray-500">Đang hoạt động</p>
              <p className="font-semibold">{reportData.summary.SANPHAM_HOATDONG || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-gray-500">Tổng tồn kho</p>
              <p className="font-semibold">{reportData.summary.TONG_TON_KHO || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-gray-500">Số phiếu nhập</p>
              <p className="font-semibold">{reportData.imports.SO_PHIEU_NHAP || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-gray-500">Số lượng nhập</p>
              <p className="font-semibold">{reportData.imports.SO_LUONG_NHAP || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-gray-500">Tổng giá trị nhập</p>
              <p className="font-semibold">{formatMoney(reportData.imports.TONG_GIA_TRI_NHAP || 0)}</p>
            </div>
          </div>) : (<p className="text-sm text-gray-500">Không có dữ liệu báo cáo.</p>)}
      </div>

      <DataTable title={loading ? 'Sản phẩm (đang tải...)' : 'Sản phẩm'} columns={columns} data={products} searchPlaceholder="Tìm sản phẩm..." onAdd={openAdd} rowActions={rowActions} advancedFilterKeys={['brand', 'supplier']} emptyState={emptyState} addLabel="Thêm sản phẩm"/>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp *</label>
              <select value={form.supplierId} onChange={(e) => setForm((prev) => ({ ...prev, supplierId: Number(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value={0}>-- Chọn NCC --</option>
                {suppliers.map((s) => (<option key={s.MNCC} value={s.MNCC}>
                    {s.TEN}
                  </option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
              <input value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí trưng bày</label>
              <input value={form.displayPosition} onChange={(e) => setForm((prev) => ({ ...prev, displayPosition: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Năm sản xuất</label>
              <input type="number" value={form.productionYear ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, productionYear: e.target.value ? Number(e.target.value) : null }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập</label>
              <input type="number" value={form.importPrice} onChange={(e) => setForm((prev) => ({ ...prev, importPrice: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
              <input type="number" value={form.sellPrice} onChange={(e) => setForm((prev) => ({ ...prev, sellPrice: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
              <input type="number" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm ẩn">Tạm ẩn</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg">
              Lưu
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Chi tiết ${viewingProduct?.name || ''}`}>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <p>
              <span className="font-medium">Mã:</span> {viewingProduct?.id}
            </p>
            <p>
              <span className="font-medium">Vị trí:</span> {viewingProduct?.displayPosition}
            </p>
            <p>
              <span className="font-medium">Thương hiệu:</span> {viewingProduct?.brand}
            </p>
            <p>
              <span className="font-medium">Nhà cung cấp:</span>{' '}
              {viewingProduct ? supplierNameMap.get(viewingProduct.supplierId) || viewingProduct.supplier : ''}
            </p>
            <p>
              <span className="font-medium">Giá nhập:</span> {formatMoney(viewingProduct?.importPrice || 0)}
            </p>
            <p>
              <span className="font-medium">Giá bán:</span> {formatMoney(viewingProduct?.sellPrice || 0)}
            </p>
            <p>
              <span className="font-medium">Tồn kho:</span> {viewingProduct?.stock || 0}
            </p>
            <p>
              <span className="font-medium">Trạng thái:</span> {viewingProduct?.status}
            </p>
          </div>
        </div>
      </Modal>
    </div>);
}
