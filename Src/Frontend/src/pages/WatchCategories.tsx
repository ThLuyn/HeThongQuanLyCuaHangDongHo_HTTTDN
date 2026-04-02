// @ts-nocheck
import { AlertTriangleIcon, CircleAlertIcon, FileTextIcon, ImageOffIcon, LayoutGridIcon, ListIcon, PackageSearchIcon, RefreshCcwIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { loadAuthSession } from '../utils/authStorage';
import { createDisplayLocationApi, createProductApi, deleteDisplayLocationApi, deleteProductApi, getDisplayLocationsApi, getInventoryReportApi, getProductsApi, getSuppliersApi, updateDisplayLocationApi, updateProductApi, } from '../utils/backendApi';
const productImageModules = import.meta.glob('../assets/img_products/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});
const numberFormatter = new Intl.NumberFormat('vi-VN');
function formatMoney(value) {
    return `${numberFormatter.format(value || 0)} đ`;
}
function normalizeKeyword(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function WatchCategories({ lowStockOnly = false, onClearLowStockFilter }) {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [displayLocations, setDisplayLocations] = useState([]);
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
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [locationForm, setLocationForm] = useState({ name: '', note: '' });
    const [locationViewMode, setLocationViewMode] = useState('table');
    const [isLowStockMode, setIsLowStockMode] = useState(Boolean(lowStockOnly));
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
      const isSellPriceLowerThanImport = Number(form.sellPrice || 0) < Number(form.importPrice || 0);
    const supplierNameMap = useMemo(() => {
        const map = new Map();
        suppliers.forEach((s) => map.set(Number(s.MNCC), s.TEN));
        return map;
    }, [suppliers]);
    const productImageList = useMemo(() => {
      return Object.entries(productImageModules).map(([path, src]) => {
        const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
        return {
          src: String(src || ''),
          fileName,
          normalizedName: normalizeKeyword(fileName),
        };
      });
    }, []);
    const getProductImageSrc = (product) => {
      if (!product)
        return '';
      const normalizedProductName = normalizeKeyword(product.name || '');
      const normalizedBrand = normalizeKeyword(product.brand || '');
      if (!normalizedProductName)
        return '';
      let best = { score: 0, src: '' };
      for (const image of productImageList) {
        const imageTokens = image.normalizedName.split(' ').filter(Boolean);
        let score = 0;
        for (const token of imageTokens) {
          if (token.length < 3)
            continue;
          if (normalizedProductName.includes(token)) {
            score += 2;
          }
          if (normalizedBrand && normalizedBrand.includes(token)) {
            score += 1;
          }
        }
        if (score > best.score) {
          best = { score, src: image.src };
        }
      }
      return best.score > 0 ? best.src : '';
    };
    const columns = [
        { key: 'id', label: 'Mã SP' },
      {
        key: 'name',
        label: 'Tên sản phẩm',
        render: (val) => (<span className="block whitespace-normal break-words">{val}</span>),
      },
      {
        key: 'brand',
        label: 'Thương hiệu',
        render: (val) => (<span className="block whitespace-normal break-words">{val}</span>),
      },
      {
        key: 'supplier',
        label: 'Nhà cung cấp',
        render: (val) => (<span className="block whitespace-normal break-words">{val}</span>),
      },
      {
        key: 'displayPosition',
        label: 'Vị trí trưng bày',
        render: (val) => (<span className="block whitespace-normal break-words">{val}</span>),
      },
        {
            key: 'importPrice',
          label: (<span className="inline-flex items-center gap-1">
            <span>Giá nhập</span>
            <span className="group relative inline-flex">
              <CircleAlertIcon className="w-3.5 h-3.5 text-amber-500" aria-label="Giá nhập mới nhất"/>
              <span className="pointer-events-none absolute top-6 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] normal-case font-medium text-white shadow-lg group-hover:block">
                Giá nhập mới nhất
              </span>
            </span>
            </span>),
            render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>,
        },
        {
            key: 'sellPrice',
            label: 'Giá bán',
            render: (val, row) => (<span className="inline-flex items-center gap-1.5 text-gray-700">
              <span>{formatMoney(val)}</span>
              {Number(val || 0) < Number(row?.importPrice || 0) ? (<span className="group relative inline-flex">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" aria-label="Giá bán thấp hơn giá nhập"/>
                  <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                    Giá bán đang nhỏ hơn giá nhập
                  </span>
                </span>) : null}
            </span>),
        },
        {
            key: 'stock',
            label: 'Tồn kho',
            render: (val, row) => (<span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
              <span>{val}</span>
              {Number(val || 0) <= 3 && row?.status === 'Hoạt động' ? (<span className="group relative inline-flex">
                  <AlertTriangleIcon className="h-4 w-4 text-amber-500" aria-label="Sản phẩm tồn thấp"/>
                  <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                    Tồn kho thấp (≤ 3)
                  </span>
                </span>) : null}
            </span>),
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
    const locationColumns = [
      { key: 'id', label: 'Mã vị trí' },
      { key: 'name', label: 'Tên vị trí' },
      {
        key: 'note',
        label: 'Ghi chú',
        render: (val) => val || 'Không có',
      },
    ];
    const locationRowActions = [
      {
        key: 'edit',
        label: 'Sửa',
        onClick: (row) => openEditLocation(row),
        className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
      },
      {
        key: 'delete',
        label: 'Xóa',
        onClick: (row) => handleDeleteLocation(row),
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
        const [productRows, supplierRows, locationRows] = await Promise.all([getProductsApi(), getSuppliersApi(), getDisplayLocationsApi()]);
            setSuppliers(supplierRows);
        setDisplayLocations(locationRows);
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
      setIsLowStockMode(Boolean(lowStockOnly));
    }, [lowStockOnly]);
    useEffect(() => {
        loadReport();
    }, [reportMonth, reportYear]);
    const openAdd = () => {
        setEditing(null);
        setForm({
            name: '',
            supplierId: Number(suppliers[0]?.MNCC || 0),
            brand: '',
        displayPosition: displayLocations[0]?.TEN || '',
            importPrice: 0,
            sellPrice: 0,
            stock: 0,
            productionYear: null,
            status: 'Hoạt động',
        });
        setModalOpen(true);
    };
      const openAddLocation = () => {
        setEditingLocation(null);
        setLocationForm({ name: '', note: '' });
        setLocationModalOpen(true);
      };
      const openEditLocation = (row) => {
        setEditingLocation(row);
        setLocationForm({
          name: row.name,
          note: row.note || '',
        });
        setLocationModalOpen(true);
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
      const handleSaveLocation = async () => {
        if (!locationForm.name.trim()) {
          alert('Vui lòng nhập tên vị trí trưng bày');
          return;
        }
        const payload = {
          name: locationForm.name.trim(),
          note: locationForm.note.trim() || undefined,
        };
        try {
          if (editingLocation) {
            await updateDisplayLocationApi(editingLocation.mvt, payload);
          }
          else {
            await createDisplayLocationApi(payload);
          }
          setLocationModalOpen(false);
          await loadProductsAndSuppliers();
        }
        catch (e) {
          alert(e instanceof Error ? e.message : 'Không thể lưu vị trí trưng bày');
        }
      };
      const handleDeleteLocation = async (row) => {
        if (!confirm(`Xóa vị trí trưng bày?`))
          return;
        try {
          await deleteDisplayLocationApi(row.mvt);
          await loadProductsAndSuppliers();
        }
        catch (e) {
          alert(e instanceof Error ? e.message : 'Không thể xóa vị trí trưng bày. Vị trí có thể đang được sản phẩm sử dụng.');
        }
      };
      const locationRows = useMemo(() => displayLocations.map((item) => ({
        mvt: Number(item.MVT),
        id: `VT${String(item.MVT).padStart(3, '0')}`,
        name: item.TEN,
        note: item.GHICHU || '',
        productCount: Number(item.PRODUCT_COUNT || 0),
      })), [displayLocations]);
    const visibleProducts = useMemo(() => {
        if (!isLowStockMode)
            return products;
      return products.filter((item) => item.status === 'Hoạt động' && Number(item.stock || 0) <= 3);
    }, [products, isLowStockMode]);
    const clearLowStockMode = () => {
        setIsLowStockMode(false);
        if (typeof onClearLowStockFilter === 'function') {
            onClearLowStockFilter();
        }
    };
    const handlePrintInventoryReport = () => {
      if (!reportData) {
        alert('Chưa có dữ liệu thống kê để in báo cáo.');
        return;
      }

      const periodLabel = reportMonth
        ? `Tháng ${reportMonth} Năm ${reportYear}`
        : `Năm ${reportYear}`;
      const createdAt = new Date();
      const createdAtLabel = createdAt.toLocaleString('vi-VN');
      const session = loadAuthSession();
      const reportCreator = session?.fullName || session?.username || 'Chưa xác định';

      const reportRows = (reportData.products || []).map((item, index) => {
        const tonDauKy = Number(item.TON_DAU_KY || 0);
        const nhapTrongKy = Number(item.NHAP_TRONG_KY || 0);
        const xuatTrongKy = Number(item.XUAT_TRONG_KY || 0);
        const tonCuoiKy = Number(item.SOLUONG || 0);
        const giaTriTonKho = tonCuoiKy * Number(item.GIANHAP || 0);

        return {
          stt: index + 1,
          maSp: `SP${String(item.MSP || 0).padStart(3, '0')}`,
          tenSp: item.TEN || '-',
          tonDauKy,
          nhapTrongKy,
          xuatTrongKy,
          tonCuoiKy,
          giaTriTonKho,
        };
      });

      const topSellingRows = [...reportRows]
        .filter((item) => item.xuatTrongKy > 0)
        .sort((a, b) => b.xuatTrongKy - a.xuatTrongKy)
        .slice(0, 5);

      const lowStockRows = reportRows.filter((item) => item.tonCuoiKy < 5);

      const tableRowsHtml = reportRows.length === 0
        ? '<tr><td colspan="8" style="text-align:center; padding:12px; color:#6b7280;">Không có dữ liệu</td></tr>'
        : reportRows
            .map((item) => `
              <tr>
                <td>${item.stt}</td>
                <td>${escapeHtml(item.maSp)}</td>
                <td>${escapeHtml(item.tenSp)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.tonDauKy)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.nhapTrongKy)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.xuatTrongKy)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.tonCuoiKy)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.giaTriTonKho)} đ</td>
              </tr>
            `)
            .join('');

      const topSellingTableHtml = topSellingRows.length === 0
        ? '<tr><td colspan="4" style="text-align:center; padding:10px; color:#6b7280;">Không có dữ liệu bán trong kỳ.</td></tr>'
        : topSellingRows
            .map((item, index) => `
              <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${escapeHtml(item.maSp)}</td>
                <td>${escapeHtml(item.tenSp)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.xuatTrongKy)}</td>
              </tr>
            `)
            .join('');

      const lowStockTableHtml = lowStockRows.length === 0
        ? '<tr><td colspan="4" style="text-align:center; padding:10px; color:#6b7280;">Không có sản phẩm tồn cuối kỳ dưới 5.</td></tr>'
        : lowStockRows
            .map((item, index) => `
              <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${escapeHtml(item.maSp)}</td>
                <td>${escapeHtml(item.tenSp)}</td>
                <td style="text-align:right;">${numberFormatter.format(item.tonCuoiKy)}</td>
              </tr>
            `)
            .join('');

      const printableHtml = `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Báo cáo thống kê biến động kho hàng</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { text-align: center; font-size: 20px; margin: 0 0 12px 0; letter-spacing: .3px; }
      .meta { margin-bottom: 14px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; background: #fafafa; }
      .meta p { margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
      th { background: #f3f4f6; text-align: center; }
      .section-title { margin-top: 18px; margin-bottom: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; color: #374151; }
      .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 6px; }
      .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; background: #fff; }
      .summary-card .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
      .summary-card .value { font-size: 14px; font-weight: 700; color: #111827; }
      .signatures { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .sign-box { text-align: center; min-height: 140px; }
      .sign-label { font-weight: 700; margin-bottom: 6px; }
      .sign-note { color: #6b7280; font-size: 12px; margin-top: 80px; }
    </style>
  </head>
  <body>
    <h1>BÁO CÁO THỐNG KÊ BIẾN ĐỘNG KHO HÀNG</h1>
    <div class="meta">
      <p><strong>Thời gian báo cáo:</strong> ${escapeHtml(periodLabel)}</p>
      <p><strong>Ngày lập báo cáo:</strong> ${escapeHtml(createdAtLabel)}</p>
    </div>

    <div class="section-title">Nội dung thống kê chi tiết</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã SP</th>
          <th>Tên Sản Phẩm</th>
          <th>Tồn đầu kỳ</th>
          <th>Nhập trong kỳ</th>
          <th>Xuất trong kỳ</th>
          <th>Tồn cuối kỳ</th>
          <th>Giá trị tồn kho</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <div class="section-title">2. Tổng hợp và nhận xét</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Tổng số sản phẩm hoạt động</div>
        <div class="value">${numberFormatter.format(Number(reportData.summary.SANPHAM_HOATDONG || 0))} sản phẩm</div>
      </div>
      <div class="summary-card">
        <div class="label">Tổng vốn nhập hàng trong tháng</div>
        <div class="value">${numberFormatter.format(Number(reportData.imports.TONG_GIA_TRI_NHAP || 0))} đ</div>
      </div>
    </div>

    <div class="section-title" style="margin-top:12px;">Danh sách sản phẩm bán chạy (Top 3-5)</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã SP</th>
          <th>Tên sản phẩm</th>
          <th>Số lượng xuất</th>
        </tr>
      </thead>
      <tbody>
        ${topSellingTableHtml}
      </tbody>
    </table>

    <div class="section-title" style="margin-top:12px;">Cảnh báo hàng tồn kho (Tồn cuối kỳ &lt; 5)</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã SP</th>
          <th>Tên sản phẩm</th>
          <th>Tồn cuối kỳ</th>
        </tr>
      </thead>
      <tbody>
        ${lowStockTableHtml}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sign-box">
        <div class="sign-label">Người lập biểu</div>
        <div>${escapeHtml(reportCreator)}</div>
        <div class="sign-note">(Ký và ghi rõ họ tên)</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">Quản lý cửa hàng</div>
        <div class="sign-note">(Ký duyệt)</div>
      </div>
    </div>
  </body>
</html>
      `;

      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        alert('Không thể mở cửa sổ in. Vui lòng kiểm tra trình duyệt có chặn popup hay không.');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(printableHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    };
    return (<div className="space-y-4">
      {error && (<div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Không tải được dữ liệu backend: {error}
        </div>)}

      {isLowStockMode ? (<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Đang hiển thị danh sách sản phẩm tồn thấp (tồn kho nhỏ hơn hoặc bằng 3).
          </p>
          <button type="button" onClick={clearLowStockMode} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100">
            Xem tất cả sản phẩm
          </button>
        </div>) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-gold-600"/>
            Thống kê sản phẩm
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
            <button onClick={handlePrintInventoryReport} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gold-300 bg-gold-50 text-gold-700 rounded-lg hover:bg-gold-100">
              <FileTextIcon className="w-4 h-4"/>
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

      <DataTable
        title={loading ? 'Sản phẩm (đang tải...)' : 'Sản phẩm'}
        columns={columns}
        data={visibleProducts}
        searchPlaceholder="Tìm sản phẩm..."
        onAdd={openAdd}
        rowActions={rowActions}
        advancedFilterKeys={[
          'brand',
          'supplier',
          'displayPosition',
          'importPrice',
          'sellPrice',
          'stock',
          'status',
        ]}
        forceSelectFilterKeys={['brand', 'supplier']}
        rangeFilterKeys={[
          { key: 'importPrice', minPlaceholder: 'Giá nhập từ', maxPlaceholder: 'Giá nhập đến' },
          { key: 'sellPrice', minPlaceholder: 'Giá bán từ', maxPlaceholder: 'Giá bán đến' },
          { key: 'stock', minPlaceholder: 'Tồn kho từ', maxPlaceholder: 'Tồn kho đến' },
        ]}
        emptyState={emptyState}
        addLabel="Thêm sản phẩm"
        pageSize={10}
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-gray-900">Vị trí trưng bày</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocationViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${locationViewMode === 'table'
                ? 'border-gold-400 bg-gold-50 text-gold-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <ListIcon className="w-4 h-4" />
              Bảng
            </button>
            <button
              type="button"
              onClick={() => setLocationViewMode('card')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${locationViewMode === 'card'
                ? 'border-gold-400 bg-gold-50 text-gold-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <LayoutGridIcon className="w-4 h-4" />
              Thẻ
            </button>
          </div>
        </div>

        {locationViewMode === 'table' ? (
          <DataTable
            title="Danh sách vị trí trưng bày"
            columns={locationColumns}
            data={locationRows}
            searchPlaceholder="Tìm vị trí trưng bày..."
            onAdd={openAddLocation}
            rowActions={locationRowActions}
            addLabel="Thêm vị trí"
            pageSize={10}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={openAddLocation}
                className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg"
              >
                Thêm vị trí
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {locationRows.map((row) => (
                <div key={row.mvt} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">{row.id}</p>
                      <h4 className="text-base font-semibold text-gray-900">{row.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditLocation(row)}
                        className="px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(row)}
                        className="px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium text-gray-900">Tên vị trí:</span> {row.name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Ghi chú/Mô tả:</span> {row.note || 'Không có'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {locationRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Chưa có vị trí trưng bày nào.
              </div>
            ) : null}
          </div>
        )}
      </div>

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
                <option value={0}>Chọn NCC</option>
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
              <select value={form.displayPosition} onChange={(e) => setForm((prev) => ({ ...prev, displayPosition: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">Chọn vị trí</option>
                {displayLocations.map((location) => (<option key={location.MVT} value={location.TEN}>
                    {location.TEN}
                  </option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Năm sản xuất</label>
              <input type="number" value={form.productionYear ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, productionYear: e.target.value ? Number(e.target.value) : null }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập</label>
              <input
                type="number"
                value={form.importPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, importPrice: Number(e.target.value) || 0 }))}
                disabled={Boolean(editing)}
                className={`w-full px-3 py-2 text-sm border rounded-lg ${editing
                    ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'border-gray-200'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
              <input type="number" value={form.sellPrice} onChange={(e) => setForm((prev) => ({ ...prev, sellPrice: Number(e.target.value) || 0 }))} className={`w-full px-3 py-2 text-sm border rounded-lg ${isSellPriceLowerThanImport ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'}`}/>
              {isSellPriceLowerThanImport ? (<p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                  <AlertTriangleIcon className="h-3.5 w-3.5"/>
                  Giá bán đang nhỏ hơn giá nhập.
                </p>) : null}
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

      <Modal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} title={editingLocation ? 'Sửa vị trí trưng bày' : 'Thêm vị trí trưng bày'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên vị trí *</label>
            <input value={locationForm.name} onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={locationForm.note} onChange={(e) => setLocationForm((prev) => ({ ...prev, note: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" rows={3}/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setLocationModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Hủy
            </button>
            <button onClick={handleSaveLocation} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg">
              Lưu
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Chi tiết ${viewingProduct?.name || ''}`} size="xl">
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            {getProductImageSrc(viewingProduct) ? (<img src={getProductImageSrc(viewingProduct)} alt={viewingProduct?.name || 'Ảnh sản phẩm'} className="h-64 w-full rounded-xl border border-gray-200 object-cover bg-white"/>) : (<div className="h-64 w-full rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400">
                <ImageOffIcon className="h-8 w-8"/>
                <p className="mt-2 text-xs">Chưa có ảnh phù hợp</p>
              </div>)}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tên sản phẩm</p>
              <h4 className="mt-1 text-lg font-semibold text-gray-900">{viewingProduct?.name || '-'}</h4>
              <div className="mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700">
                {viewingProduct?.id || '---'}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Thương hiệu</p>
                <p className="mt-1 font-medium text-gray-900">{viewingProduct?.brand || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Nhà cung cấp</p>
                <p className="mt-1 font-medium text-gray-900">{viewingProduct ? supplierNameMap.get(viewingProduct.supplierId) || viewingProduct.supplier : '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Vị trí trưng bày</p>
                <p className="mt-1 font-medium text-gray-900">{viewingProduct?.displayPosition || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Năm sản xuất</p>
                <p className="mt-1 font-medium text-gray-900">{viewingProduct?.productionYear || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-600">Giá nhập</p>
                <p className="mt-1 font-semibold text-blue-800">{formatMoney(viewingProduct?.importPrice || 0)}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">Giá bán</p>
                <p className="mt-1 font-semibold text-emerald-800">{formatMoney(viewingProduct?.sellPrice || 0)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Tồn kho</p>
                <p className="mt-1 font-semibold text-gray-900">{viewingProduct?.stock || 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Trạng thái</p>
                <p className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${viewingProduct?.status === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                  {viewingProduct?.status || 'Không xác định'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>);
}
