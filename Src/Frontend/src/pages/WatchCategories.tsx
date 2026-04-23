// @ts-nocheck
import { AlertTriangleIcon, CircleAlertIcon, ClockIcon, FileTextIcon, ImageOffIcon, LayoutGridIcon, ListIcon, PackageSearchIcon, RefreshCcwIcon, TrendingUpIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { loadAuthSession } from '../utils/authStorage';
import { createDisplayLocationApi, createImportReceiptApi, createProductApi, decideImportReceiptApi, deleteDisplayLocationApi, deleteProductApi, getDisplayLocationsApi, getInventoryReportApi, getProductImportHistoryApi, getProductsApi, getSuppliersApi, updateDisplayLocationApi, updateProductApi, uploadProductImageApi, } from '../utils/backendApi';
import { buildInventoryReportDocument, exportInventoryReportPdf, printInventoryReportDocument } from '../utils/inventoryReportExport';
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
export function WatchCategories({ lowStockOnly = false, targetLowStockProductId = null, onConsumeTargetLowStock, onClearLowStockFilter }) {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [displayLocations, setDisplayLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState({ type: 'info', message: '' });
    const showNotice = (message, type = 'info') => {
      if (!message) return;
      setNotice({ type, message: String(message) });
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [editing, setEditing] = useState(null);
    const now = new Date();
    const storeOpenYear = 2024;
    const currentYear = now.getFullYear();
    const yearOptions = Array.from({ length: Math.max(1, currentYear - storeOpenYear + 1) }, (_, index) => storeOpenYear + index);
    const [reportYear, setReportYear] = useState(now.getFullYear());
    const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [locationForm, setLocationForm] = useState({ name: '', note: '' });
    const [locationViewMode, setLocationViewMode] = useState('table');
    const [isLowStockMode, setIsLowStockMode] = useState(Boolean(lowStockOnly));
    const [selectedLowStockIds, setSelectedLowStockIds] = useState([]);
    const [prioritizedLowStockProductId, setPrioritizedLowStockProductId] = useState(null);
    const [quickImportOpen, setQuickImportOpen] = useState(false);
    const [quickImportSaving, setQuickImportSaving] = useState(false);
    const [quickImportLines, setQuickImportLines] = useState([]);
    const [quickImportConfirmOpen, setQuickImportConfirmOpen] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    // Modal xác nhận xóa
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'product'|'location', row }

    // Lịch sử nhập hàng
    const [importHistoryOpen, setImportHistoryOpen] = useState(false);
    const [importHistoryProduct, setImportHistoryProduct] = useState(null);
    const [importHistoryData, setImportHistoryData] = useState(null);
    const [importHistoryLoading, setImportHistoryLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
      image: '',
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
      const explicitImage = String(product.image || '').trim();
      if (explicitImage) {
        if (/^(https?:\/\/|data:|blob:|\/)/i.test(explicitImage)) {
          return explicitImage;
        }
        const normalizedExplicit = normalizeKeyword(explicitImage.replace(/\.[^.]+$/, ''));
        const matchedByName = productImageList.find((image) => image.normalizedName === normalizedExplicit);
        if (matchedByName) {
          return matchedByName.src;
        }
      }
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
            key: 'history',
            label: 'Lịch sử nhập hàng',
            onClick: (row) => openImportHistory(row),
            className: 'p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors',
            render: () => <ClockIcon className="w-4 h-4" />,
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
              image: item.HINHANH || '',
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

    const openImportHistory = async (row) => {
      setImportHistoryProduct(row);
      setImportHistoryData(null);
      setImportHistoryOpen(true);
      setImportHistoryLoading(true);
      try {
        const data = await getProductImportHistoryApi(row.msp);
        setImportHistoryData(data);
      } catch (e) {
        setImportHistoryData(null);
      } finally {
        setImportHistoryLoading(false);
      }
    };

    const openAdd = () => {
        setEditing(null);
        setForm({
            name: '',
          image: '',
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
          image: row.image || '',
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
        if (form.productionYear && Number(form.productionYear) > new Date().getFullYear()) {
            showNotice('Năm sản xuất không được là năm tương lai.', 'error');
            return;
        }
        const payload = {
            name: form.name.trim(),
          image: form.image.trim() || undefined,
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
            showNotice(editing ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công', 'success');
        }
        catch (e) {
            showNotice(e instanceof Error ? e.message : 'Không thể lưu sản phẩm', 'error');
        }
    };
    const handleUploadImageFromDevice = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file)
        return;
      setImageUploading(true);
      try {
        const uploaded = await uploadProductImageApi(file);
        setForm((prev) => ({
          ...prev,
          image: uploaded.imageUrl,
        }));
      }
      catch (e) {
        alert(e instanceof Error ? e.message : 'Không thể tải ảnh từ máy lên');
      }
      finally {
        setImageUploading(false);
      }
    };
    const handleDelete = (row) => {
        setDeleteConfirm({ type: 'product', row });
    };
    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        const { type, row } = deleteConfirm;
        setDeleteConfirm(null);
        try {
            if (type === 'product') {
                await deleteProductApi(row.msp);
                await loadProductsAndSuppliers();
                await loadReport();
            } else if (type === 'location') {
                await deleteDisplayLocationApi(row.mvt);
                await loadProductsAndSuppliers();
            }
        }
        catch (e) {
            showNotice(e instanceof Error ? e.message : 'Không thể xóa', 'error');
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
      const handleDeleteLocation = (row) => {
        setDeleteConfirm({ type: 'location', row });
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
      const filtered = products.filter((item) => item.status === 'Hoạt động' && Number(item.stock || 0) <= 3);
      const targetId = Number(prioritizedLowStockProductId);
      if (!Number.isInteger(targetId) || targetId <= 0)
        return filtered;
      const foundIndex = filtered.findIndex((item) => Number(item.msp) === targetId);
      if (foundIndex <= 0)
        return filtered;
      const reordered = [...filtered];
      const [targetRow] = reordered.splice(foundIndex, 1);
      return [targetRow, ...reordered];
    }, [products, isLowStockMode, prioritizedLowStockProductId]);
    const lowStockCount = useMemo(() => {
      return products.filter((item) => item.status === 'Hoạt động' && Number(item.stock || 0) <= 3).length;
    }, [products]);
    const allVisibleLowStockIds = useMemo(() => visibleProducts.map((item) => Number(item.msp)), [visibleProducts]);
    const selectedLowStockProducts = useMemo(() => {
      const selectedSet = new Set(selectedLowStockIds.map((id) => Number(id)));
      return products.filter((item) => selectedSet.has(Number(item.msp)));
    }, [products, selectedLowStockIds]);
    const productColumns = useMemo(() => {
      if (!isLowStockMode) {
        return columns;
      }
      const allChecked = allVisibleLowStockIds.length > 0 && allVisibleLowStockIds.every((id) => selectedLowStockIds.includes(id));
      return [
        {
          key: '__pick',
          label: (<input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedLowStockIds(allVisibleLowStockIds);
              }
              else {
                setSelectedLowStockIds([]);
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
            aria-label="Chọn tất cả sản phẩm sắp hết hàng"
          />),
          render: (_val, row) => (<input
            type="checkbox"
            checked={selectedLowStockIds.includes(Number(row.msp))}
            onChange={(e) => {
              const msp = Number(row.msp);
              setSelectedLowStockIds((prev) => e.target.checked
                ? Array.from(new Set([...prev, msp]))
                : prev.filter((id) => Number(id) !== msp));
            }}
            className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
            aria-label={`Chọn ${row.name}`}
          />),
        },
        ...columns,
      ];
    }, [isLowStockMode, columns, allVisibleLowStockIds, selectedLowStockIds]);
    const clearLowStockMode = () => {
        setIsLowStockMode(false);
        setSelectedLowStockIds([]);
        if (typeof onClearLowStockFilter === 'function') {
            onClearLowStockFilter();
        }
    };
    const openQuickImport = () => {
      if (selectedLowStockProducts.length === 0) {
        alert('Vui lòng chọn ít nhất 1 sản phẩm cần nhập nhanh.');
        return;
      }
      setQuickImportLines(selectedLowStockProducts.map((item) => ({
        msp: Number(item.msp),
        name: item.name,
        supplier: item.supplier,
        supplierId: Number(item.supplierId),
        stock: Number(item.stock || 0),
        qty: Math.max(1, 5 - Number(item.stock || 0)),
        tienNhap: Number(item.importPrice || 0),
      })));
      setQuickImportOpen(true);
    };
    const saveQuickImport = async () => {
      if (quickImportLines.length === 0) {
        showNotice('Không có sản phẩm để nhập kho.', 'error');
        return;
      }
      const hasInvalid = quickImportLines.some(
        (line) => Math.floor(Number(line.qty)) <= 0 || Number(line.tienNhap) <= 0
      );
      if (hasInvalid) {
        showNotice('Vui lòng nhập số lượng và giá nhập hợp lệ (> 0).', 'error');
        return;
      }
      const groupedBySupplier = quickImportLines.reduce((acc, line) => {
        const key = Number(line.supplierId);
        if (!acc[key]) acc[key] = [];
        acc[key].push(line);
        return acc;
      }, {});
      setQuickImportSaving(true);
      setError('');
      try {
        const session = loadAuthSession();
        for (const supplierId of Object.keys(groupedBySupplier)) {
          const lines = groupedBySupplier[supplierId];
          const created = await createImportReceiptApi({
            mnv: session?.mnv,
            mncc: Number(supplierId),
            items: lines.map((line) => ({
              msp: Number(line.msp),
              sl: Math.floor(Number(line.qty)),
              tienNhap: Math.floor(Number(line.tienNhap)),
            })),
          });
          await decideImportReceiptApi(Number(created.importReceiptId), { action: 'approve' });
        }
        setQuickImportOpen(false);
        setSelectedLowStockIds([]);
        await loadProductsAndSuppliers();
        await loadReport();
        showNotice('Nhập kho nhanh thành công', 'success');
      }
      catch (e) {
        showNotice(e instanceof Error ? e.message : 'Không thể nhập kho nhanh', 'error');
      }
      finally {
        setQuickImportSaving(false);
      }
    };
    useEffect(() => {
      if (!isLowStockMode) {
        setSelectedLowStockIds([]);
      }
    }, [isLowStockMode]);
    useEffect(() => {
      const allowedIds = new Set(allVisibleLowStockIds.map((id) => Number(id)));
      setSelectedLowStockIds((prev) => prev.filter((id) => allowedIds.has(Number(id))));
    }, [allVisibleLowStockIds]);
    useEffect(() => {
      if (!isLowStockMode || loading)
        return;
      const targetId = Number(targetLowStockProductId);
      if (!Number.isInteger(targetId) || targetId <= 0)
        return;
      if (!allVisibleLowStockIds.includes(targetId))
        return;
      setPrioritizedLowStockProductId(targetId);
      setSelectedLowStockIds([targetId]);
      if (typeof onConsumeTargetLowStock === 'function') {
        onConsumeTargetLowStock();
      }
    }, [targetLowStockProductId, isLowStockMode, loading, allVisibleLowStockIds, onConsumeTargetLowStock]);

    useEffect(() => {
      if (!isLowStockMode) {
        setPrioritizedLowStockProductId(null);
      }
    }, [isLowStockMode]);
    useEffect(() => {
      if (!notice.message) return;
      const timer = window.setTimeout(() => setNotice((prev) => ({ ...prev, message: '' })), 5000);
      return () => window.clearTimeout(timer);
    }, [notice.message]);
    const buildInventoryReportData = () => {
      const session = loadAuthSession();
      const reportCreator = session?.fullName || session?.username || 'Chưa xác định';
      return buildInventoryReportDocument(reportData, reportMonth, reportYear, reportCreator, new Date());
    };

    const handlePrintInventoryReport = () => {
      if (!reportData) {
        alert('Chưa có dữ liệu thống kê để in báo cáo.');
        return;
      }

      const reportDoc = buildInventoryReportData();
      if (!reportDoc) {
        return;
      }

      const printed = printInventoryReportDocument(reportDoc);
      if (!printed) {
        alert('Không thể mở cửa sổ in. Vui lòng kiểm tra trình duyệt có chặn popup hay không.');
      }
    };

    const handleDownloadInventoryReport = () => {
      if (!reportData) {
        alert('Chưa có dữ liệu thống kê để xuất báo cáo PDF.');
        return;
      }

      exportInventoryReportPdf(reportData, reportMonth, reportYear);
    };
    return (<div className="space-y-4">
      {notice.message ? (
        <div className="fixed right-4 top-4 z-[70] w-[min(92vw,420px)]">
          <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
            <p className="leading-relaxed">{notice.message}</p>
            <button type="button" onClick={() => setNotice((prev) => ({ ...prev, message: '' }))} className="rounded-md px-2 py-0.5 text-sm font-semibold leading-none hover:bg-black/5" aria-label="Đóng thông báo">×</button>
          </div>
        </div>
      ) : null}
      {error && (<div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {error}
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
            <select value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg">
              {yearOptions.map((year) => (<option key={year} value={year}>
                  {year}
                </option>))}
            </select>
            <button onClick={loadReport} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCcwIcon className="w-4 h-4"/>
              Làm mới
            </button>
            <button onClick={handlePrintInventoryReport} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gold-300 bg-gold-50 text-gold-700 rounded-lg hover:bg-gold-100">
              <FileTextIcon className="w-4 h-4"/>
              In báo cáo
            </button>
            <button onClick={handleDownloadInventoryReport} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              <FileTextIcon className="w-4 h-4"/>
              Xuất file báo cáo
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

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isLowStockMode}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsLowStockMode(checked);
                if (!checked && typeof onClearLowStockFilter === 'function') {
                  onClearLowStockFilter();
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
            />
            <span className="font-medium">Sản phẩm sắp hết hàng (≤3)</span>
          </label>
          <div className="flex items-center gap-2">
            {isLowStockMode ? (<button
                type="button"
                onClick={openQuickImport}
                disabled={selectedLowStockIds.length === 0}
                className="inline-flex items-center rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Nhập kho ({selectedLowStockIds.length})
              </button>) : null}
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Cần nhập gấp: {lowStockCount}
            </span>
          </div>
        </div>
      </div>

      <DataTable
        title={loading ? 'Sản phẩm (đang tải...)' : 'Sản phẩm'}
        columns={productColumns}
        data={visibleProducts}
        searchPlaceholder="Tìm kiếm..."
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
        pageSize={5}
        defaultSortBy="id"
        defaultSortDirection="desc"
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
            searchPlaceholder="Tìm kiếm..."
            onAdd={openAddLocation}
            rowActions={locationRowActions}
            addLabel="Thêm vị trí"
            pageSize={5}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (URL hoặc tên file)</label>
            <input value={form.image} onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))} placeholder="VD: https://... hoặc rolex_sub.jpg" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"/>
            <div className="mt-2 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={handleUploadImageFromDevice} className="hidden"/>
                Chọn ảnh từ máy
              </label>
              {imageUploading ? <span className="text-xs text-blue-700">Đang tải ảnh...</span> : null}
            </div>
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
              <input type="number" value={form.productionYear ?? ''} max={new Date().getFullYear()} onChange={(e) => { const val = e.target.value ? Number(e.target.value) : null; setForm((prev) => ({ ...prev, productionYear: val })); }} className={'w-full px-3 py-2 text-sm border rounded-lg ' + (form.productionYear && form.productionYear > new Date().getFullYear() ? 'border-red-300 bg-red-50/40' : 'border-gray-200')}/>
              {form.productionYear && form.productionYear > new Date().getFullYear() ? (<p className="mt-1 text-xs text-red-600">Năm sản xuất không được là năm tương lai.</p>) : null}
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

      <Modal isOpen={quickImportOpen} onClose={() => setQuickImportOpen(false)} title="Nhập kho nhanh sản phẩm sắp hết hàng" size="xl">
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Mã SP</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Tên sản phẩm</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Nhà cung cấp</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Tồn hiện tại</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Số lượng nhập</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Giá nhập</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {quickImportLines.map((line, index) => (<tr key={line.msp}>
                    <td className="px-3 py-2">SP{String(line.msp).padStart(3, '0')}</td>
                    <td className="px-3 py-2">{line.name}</td>
                    <td className="px-3 py-2">{line.supplier}</td>
                    <td className="px-3 py-2 text-right">{line.stock}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={line.qty}
                        onChange={(e) => {
                          const val = Math.floor(Math.abs(Number(e.target.value) || 0));
                          setQuickImportLines((prev) => prev.map((item, idx) => idx === index ? { ...item, qty: val } : item));
                        }}
                        onKeyDown={(e) => { if (['.', ',', '-', 'e'].includes(e.key)) e.preventDefault(); }}
                        className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={line.tienNhap}
                        onChange={(e) => {
                          const val = Math.floor(Math.abs(Number(e.target.value) || 0));
                          setQuickImportLines((prev) => prev.map((item, idx) => idx === index ? { ...item, tienNhap: val } : item));
                        }}
                        onKeyDown={(e) => { if (['.', ',', '-', 'e'].includes(e.key)) e.preventDefault(); }}
                        className="w-32 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm"
                      />
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setQuickImportOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              Hủy
            </button>
            <button type="button" onClick={() => setQuickImportConfirmOpen(true)} disabled={quickImportSaving} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60">
              Xác nhận nhập kho
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận nhập kho nhanh */}
      <Modal isOpen={quickImportConfirmOpen} onClose={() => setQuickImportConfirmOpen(false)} title="" size="sm">
        <div className="flex flex-col items-center text-center px-2 pb-2 space-y-4">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 8-4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h2m0 0V6a1 1 0 011-1h12a1 1 0 011 1v4m-14 0h14m0 0v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8" />
            </svg>
          </div>

          {/* Title & description */}
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận nhập kho</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Xác nhận nhập kho cho sản phẩm này?<br />
            </p>
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-3 pt-1">
            <button
              type="button"
              onClick={() => setQuickImportConfirmOpen(false)}
              disabled={quickImportSaving}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={async () => {
                setQuickImportConfirmOpen(false);
                await saveQuickImport();
              }}
              disabled={quickImportSaving}
              className="flex-1 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {quickImportSaving ? 'Đang nhập...' : 'Nhập kho'}
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
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
                <p className="text-xs text-gray-500">Đường dẫn hình ảnh</p>
                <p className="mt-1 break-all font-medium text-gray-900">{viewingProduct?.image || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Năm sản xuất</p>
                <p className="mt-1 font-medium text-gray-900">{viewingProduct?.productionYear || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-600">Giá nhập mới nhất</p>
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

      {/* Modal lịch sử nhập hàng */}
      <Modal isOpen={importHistoryOpen} onClose={() => setImportHistoryOpen(false)} title={`Lịch sử nhập hàng — ${importHistoryProduct?.name || ''}`} size="xl">
        {importHistoryLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">Đang tải lịch sử nhập hàng...</div>
        ) : importHistoryData ? (
          <div className="space-y-4">
            {/* Tóm tắt WAC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm">
                <p className="text-xs text-blue-600">Giá nhập mới nhất</p>
                <p className="mt-1 font-semibold text-blue-800">
                  {importHistoryData.history.length > 0
                    ? formatMoney(Number(importHistoryData.history[0].TIENNHAP || 0))
                    : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm">
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <TrendingUpIcon className="h-3 w-3" />
                  Giá bình quân gia quyền (WAC)
                </p>
                <p className="mt-1 font-semibold text-purple-800">{formatMoney(importHistoryData.wac)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="text-xs text-gray-500">Số đợt nhập</p>
                <p className="mt-1 font-semibold text-gray-900">{importHistoryData.history.length} đợt</p>
              </div>
            </div>

            {/* Bảng lịch sử */}
            {importHistoryData.history.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Chưa có lịch sử nhập hàng được duyệt.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Phiếu nhập</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Ngày nhập</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Nhà cung cấp</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Nhân viên</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">SL</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Đơn giá nhập</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {importHistoryData.history.map((row, index) => {
                      const isLatest = index === 0;
                      const prevPrice = index < importHistoryData.history.length - 1
                        ? Number(importHistoryData.history[index + 1].TIENNHAP || 0)
                        : null;
                      const currPrice = Number(row.TIENNHAP || 0);
                      const priceUp = prevPrice !== null && currPrice > prevPrice;
                      const priceDown = prevPrice !== null && currPrice < prevPrice;

                      return (
                        <tr key={`${row.MPN}-${index}`} className={isLatest ? 'bg-blue-50/40' : ''}>
                          <td className="px-3 py-2 font-medium text-gray-700">
                            PNK{String(row.MPN).padStart(4, '0')}
                            {isLatest ? <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">Mới nhất</span> : null}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {new Date(row.TG).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{row.TENNHACUNGCAP || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{row.TENNHANVIEN || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{row.SL}</td>
                          <td className="px-3 py-2 text-right">
                            <span className="font-semibold text-gray-900">{formatMoney(currPrice)}</span>
                            {priceUp ? <span className="ml-1 text-[10px] text-red-500">▲</span> : null}
                            {priceDown ? <span className="ml-1 text-[10px] text-green-500">▼</span> : null}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatMoney(Number(row.THANHTIEN || 0))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={() => setImportHistoryOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500">Không thể tải lịch sử nhập hàng.</div>
        )}
      </Modal>

      {/* Modal xác nhận xóa */}
      {deleteConfirm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
                <p className="text-sm text-gray-500">
                  {deleteConfirm.type === 'product'
                    ? <>Xóa sản phẩm <span className="font-semibold text-gray-700">&ldquo;{deleteConfirm.row.name}&rdquo;</span>?</>
                    : <>Xóa vị trí trưng bày <span className="font-semibold text-gray-700">&ldquo;{deleteConfirm.row.name}&rdquo;</span>?</>}
                </p>
              </div>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>);
}