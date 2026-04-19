// @ts-nocheck
import { Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { loadAuthSession } from '../utils/authStorage';
import {
  cancelExportReceiptApi,
  createExportReceiptApi,
  getCustomersApi,
  getExportReceiptDetailApi,
  getExportReceiptsApi,
  getSaleProductsApi,
} from '../utils/backendApi';

const STATUS_LABEL = {
  0: 'Đã hủy',
  1: 'Đã bán',
};

const VND = new Intl.NumberFormat('vi-VN');

const buildInvoiceHTML = (data) => {
  const receiptId = `PXK${String(data.MPX).padStart(4, '0')}`;
  const date = new Date(data.TG).toLocaleString('vi-VN');
  const items = (data.ITEMS || []);
  const total = Number(data.TIEN || 0);

  const rows = items.map((line) => `
    <tr>
      <td>${line.MSP}</td>
      <td>${line.TENSP}</td>
      <td style="text-align:right">${Number(line.SL || 0)}</td>
      <td style="text-align:right">${VND.format(Number(line.TIENXUAT || 0))} đ</td>
      <td style="text-align:right"><strong>${VND.format(Number(line.THANHTIEN || 0))} đ</strong></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Hóa đơn ${receiptId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 32px; }
    h2 { text-align: center; margin-bottom: 4px; font-size: 20px; }
    .subtitle { text-align: center; color: #555; margin-bottom: 20px; font-size: 13px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 20px; }
    .info-grid span { color: #555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f3f4f6; padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb; }
    td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
    .total-row { font-size: 15px; font-weight: bold; text-align: right; margin-top: 8px; }
    .footer { text-align: center; margin-top: 32px; color: #888; font-size: 12px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h2>GOLDEN TIME</h2>
  <div class="subtitle">HÓA ĐƠN BÁN HÀNG</div>
  <div class="info-grid">
    <div><span>Mã phiếu:</span> <strong>${receiptId}</strong></div>
    <div><span>Ngày bán:</span> ${date}</div>
    <div><span>Khách hàng:</span> ${data.TENKHACHHANG || `KH #${data.MKH}`}</div>
    <div><span>Nhân viên:</span> ${data.TENNHANVIEN || '-'}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Mã SP</th><th>Tên sản phẩm</th>
        <th style="text-align:right">SL</th>
        <th style="text-align:right">Đơn giá</th>
        <th style="text-align:right">Thành tiền</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total-row">Tổng cộng: ${VND.format(total)} đ</div>
  <div class="footer">Cảm ơn quý khách đã mua hàng tại Golden Time!</div>
</body>
</html>`;
};

const downloadInvoice = async (data) => {
  const receiptId = `PXK${String(data.MPX).padStart(4, '0')}`;
  const date = new Date(data.TG).toLocaleString('vi-VN');
  const items = data.ITEMS || [];
  const total = Number(data.TIEN || 0);

  // Load jsPDF từ CDN nếu chưa có
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GOLDEN TIME', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('HOA DON BAN HANG', pageW / 2, y, { align: 'center' });
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ma phieu:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptId, margin + 28, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Ngay ban:', pageW / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(date, pageW / 2 + 25, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Khach hang:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.TENKHACHHANG || `KH #${data.MKH}`, margin + 32, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Nhan vien:', pageW / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.TENNHANVIEN || '-', pageW / 2 + 25, y);
  y += 10;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, pageW - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Ma SP', margin + 2, y + 5.5);
  doc.text('Ten san pham', margin + 20, y + 5.5);
  doc.text('SL', margin + 95, y + 5.5);
  doc.text('Don gia', margin + 110, y + 5.5);
  doc.text('Thanh tien', margin + 135, y + 5.5);
  y += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  items.forEach((line, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageW - margin * 2, 7, 'F');
    }
    doc.text(String(line.MSP || ''), margin + 2, y + 5);
    const tensp = String(line.TENSP || '');
    doc.text(tensp.length > 35 ? tensp.slice(0, 35) + '...' : tensp, margin + 20, y + 5);
    doc.text(String(Number(line.SL || 0)), margin + 95, y + 5);
    doc.text(`${VND.format(Number(line.TIENXUAT || 0))}d`, margin + 105, y + 5);
    doc.text(`${VND.format(Number(line.THANHTIEN || 0))}d`, margin + 132, y + 5);
    y += 7;
  });

  // Total
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Tong cong: ${VND.format(total)}d`, pageW - margin, y, { align: 'right' });

  // Footer
  y += 14;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Cam on quy khach da mua hang tai Golden Time!', pageW / 2, y, { align: 'center' });

  doc.save(`HoaDon_${receiptId}.pdf`);
};

const printInvoice = (data) => {
  const html = buildInvoiceHTML(data);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
};

const columns = [
  {
    key: 'id',
    label: 'Mã phiếu',
  },
  {
    key: 'date',
    label: 'Ngày bán',
    render: (value) => new Date(value).toLocaleString('vi-VN'),
  },
  {
    key: 'customer',
    label: 'Khách hàng',
  },
  {
    key: 'employee',
    label: 'Nhân viên',
  },
  {
    key: 'productCount',
    label: 'Số dòng SP',
  },
  {
    key: 'qtyTotal',
    label: 'Tổng SL',
  },
  {
    key: 'total',
    label: 'Tổng tiền',
    render: (value) => `${VND.format(Number(value || 0))} đ`,
  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Đã bán' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {val}
    </span>),
  },
];

export function ExportReceipts() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState('');

  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mkh, setMkh] = useState('');
  const [items, setItems] = useState([{ msp: '', sl: 1, tienXuat: 0 }]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [receiptRows, customerRows, productRows] = await Promise.all([
        getExportReceiptsApi(100),
        getCustomersApi(),
        getSaleProductsApi(),
      ]);

      setReceipts(receiptRows);
      setCustomers(customerRows.filter((x) => Number(x.TT) === 1));
      setProducts(productRows.filter((x) => Number(x.TT) === 1));
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải dữ liệu phiếu xuất';
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

  const resetForm = () => {
    const firstCustomerId = orderedCustomers[0]?.MKH;
    setMkh(firstCustomerId ? Number(firstCustomerId) : '');
    setItems([{ msp: '', sl: 1, tienXuat: 0 }]);
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
    setItems((prev) => [...prev, { msp: '', sl: 1, tienXuat: 0 }]);
  };

  const removeLine = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateLine = (index, patch) => {
    setItems((prev) => prev.map((line, idx) => (idx === index ? { ...line, ...patch } : line)));
  };

  const saleProducts = useMemo(() => {
    return products.filter((product) => Number(product.SOLUONG || 0) > 0);
  }, [products]);

  const orderedCustomers = useMemo(() => {
    const activeCustomers = [...customers];
    const defaultCustomerIndex = activeCustomers.findIndex((customer) => String(customer.HOTEN || '').trim().toLowerCase() === 'mặc định');

    if (defaultCustomerIndex <= 0)
      return activeCustomers;

    const [defaultCustomer] = activeCustomers.splice(defaultCustomerIndex, 1);
    return [defaultCustomer, ...activeCustomers];
  }, [customers]);

  const computedTotal = useMemo(() => {
    return items.reduce((sum, line) => sum + Number(line.sl || 0) * Number(line.tienXuat || 0), 0);
  }, [items]);

  const viewRows = useMemo(() => {
    return receipts.map((row) => ({
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
    }));
  }, [receipts]);

  const openDetail = async (row) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const detailData = await getExportReceiptDetailApi(Number(row.mpx));
      setDetail(detailData);
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải chi tiết phiếu xuất';
      setError(message);
    }
    finally {
      setDetailLoading(false);
    }
  };

  const cancelReceipt = async (row) => {
    if (Number(row.statusCode) === 0) {
      setError('Phiếu xuất này đã hủy trước đó.');
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn hủy phiếu ${row.id} không?`);
    if (!confirmed)
      return;

    const reason = window.prompt(`Lý do hủy phiếu ${row.id} (có thể để trống):`, '') || '';
    setError('');
    setSuccessMessage('');
    try {
      await cancelExportReceiptApi(Number(row.mpx), reason.trim() || undefined);
      setSuccessMessage('Đã hủy phiếu xuất và cộng lại tồn kho thành công');
      await loadAll();
      if (detailOpen && detail && Number(detail.MPX) === Number(row.mpx)) {
        const refreshed = await getExportReceiptDetailApi(Number(row.mpx));
        setDetail(refreshed);
      }
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể hủy phiếu xuất';
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
      key: 'print',
      label: 'In',
      onClick: async (row) => {
        try {
          const invoiceData = await getExportReceiptDetailApi(Number(row.mpx));
          await downloadInvoice(invoiceData);
        } catch (e) {
          setError('Không thể tải dữ liệu để xuất hóa đơn PDF');
        }
      },
      hidden: (row) => Number(row.statusCode) === 0,
      className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
      render: () => <Printer className="w-4 h-4" />,
    },
    {
      key: 'delete',
      label: 'Xóa',
      onClick: cancelReceipt,
      className: 'p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
      hidden: (row) => Number(row.statusCode) === 0,
    },
  ];

  const validateForm = () => {
    if (mkh === '') {
      setError('Vui lòng chọn khách hàng.');
      return false;
    }
    if (items.length === 0) {
      setError('Phiếu xuất cần ít nhất 1 sản phẩm.');
      return false;
    } F

    const invalid = items.some((line) => {
      if (line.msp === '')
        return true;

      const selectedProduct = products.find((product) => Number(product.MSP) === Number(line.msp));
      if (!selectedProduct)
        return true;

      if (Number(line.sl) <= 0 || Number(line.tienXuat) <= 0)
        return true;

      return Number(line.sl) > Number(selectedProduct.SOLUONG || 0);
    });

    if (invalid) {
      setError('Mỗi dòng phải chọn sản phẩm, số lượng hợp lệ theo tồn kho và giá bán > 0.');
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
      const created = await createExportReceiptApi({
        mnv: session?.mnv,
        mkh: Number(mkh),
        items: items.map((line) => ({
          msp: Number(line.msp),
          sl: Number(line.sl),
          tienXuat: Number(line.tienXuat),
        })),
      });
      closeCreate();
      await loadAll();

      // Tự động tải hóa đơn sau khi tạo
      try {
        const newMpx = created?.exportReceiptId || created?.MPX || created?.mpx;
        if (newMpx) {
          const invoiceData = await getExportReceiptDetailApi(Number(newMpx));
          downloadInvoice(invoiceData);
          setToast('Tạo phiếu thành công!');
        } else {
          setToast('Tạo phiếu xuất thành công!');
        }
      } catch (_) {
        setToast('Tạo phiếu xuất thành công!');
      }

      setTimeout(() => setToast(''), 3500);
    }
    catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tạo phiếu xuất';
      setError(message);
    }
    finally {
      setSaving(false);
    }
  };
  return (<>
    {/* Toast góc trên phải */}
    {toast && (
      <div className="fixed top-5 right-5 z-50 flex items-center justify-between gap-4 rounded-xl border border-green-300 bg-green-50 px-5 py-3 text-sm font-medium text-green-800 shadow-lg">
        <span>{toast.replace('✅ ', '')}</span>
        <button onClick={() => setToast('')} className="text-green-400 hover:text-green-600 font-bold text-base leading-none">×</button>
      </div>
    )}
    {error && (<div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
      {error}
    </div>)}
    {loading ? (<div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">
      Đang tải dữ liệu phiếu xuất...
    </div>) : (<DataTable title="Phiếu xuất hàng" columns={columns} data={viewRows} searchPlaceholder="Tìm kiếm..." advancedFilterKeys={['customer', 'employee', 'status', 'date', 'total', 'productCount', 'qtyTotal']} forceSelectFilterKeys={['customer', 'employee', 'status']} rangeFilterKeys={[
      { key: 'total', minPlaceholder: 'Tổng tiền từ', maxPlaceholder: 'Tổng tiền đến', inputType: 'number' },
      { key: 'date', minPlaceholder: 'Ngày bán từ', maxPlaceholder: 'Ngày bán đến', inputType: 'date' },
      { key: 'productCount', minPlaceholder: 'Số dòng SP từ', maxPlaceholder: 'Số dòng SP đến', inputType: 'number' },
      { key: 'qtyTotal', minPlaceholder: 'Tổng SL từ', maxPlaceholder: 'Tổng SL đến', inputType: 'number' },
    ]} onAdd={openCreate} addLabel="Tạo phiếu xuất" rowActions={rowActions} emptyState={<div>
      <p className="font-medium text-gray-500">Chưa có phiếu xuất nào</p>
      <p className="mt-1 text-xs text-gray-400">Tạo phiếu xuất bán tại quầy đầu tiên để đồng bộ doanh thu và tồn kho.</p>
    </div>} />)}
    <Modal isOpen={modalOpen} onClose={closeCreate} title="Tạo phiếu xuất hàng" size="xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Khách hàng *
          </label>
          <select value={mkh} onChange={(e) => setMkh(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
            {orderedCustomers.map((customer) => (<option key={customer.MKH} value={customer.MKH}>
              {customer.HOTEN} ({customer.SDT || 'Không có SĐT'})
            </option>))}
          </select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Danh sách sản phẩm bán tại quầy</p>
            <button type="button" onClick={addLine} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              + Thêm dòng
            </button>
          </div>
          {items.map((line, index) => {
            const selectedProduct = products.find((product) => Number(product.MSP) === Number(line.msp));
            const stock = Number(selectedProduct?.SOLUONG || 0);
            const defaultPrice = Number(selectedProduct?.GIABAN || 0);
            return (<div key={index} className="grid grid-cols-12 gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="col-span-12 md:col-span-6">
                <label className="mb-1 block text-xs font-medium text-gray-600">Sản phẩm</label>
                <select value={line.msp} onChange={(e) => {
                  const productId = e.target.value ? Number(e.target.value) : '';
                  const nextProduct = products.find((product) => Number(product.MSP) === Number(productId));
                  updateLine(index, {
                    msp: productId,
                    tienXuat: Number(nextProduct?.GIABAN || 0),
                  });
                }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                  <option value="">Chọn sản phẩm</option>
                  {saleProducts.map((product) => (<option key={product.MSP} value={product.MSP}>
                    {product.TEN} (Tồn: {product.SOLUONG})
                  </option>))}
                </select>
              </div>
              <div className="col-span-6 md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Số lượng</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={line.sl}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*$/.test(value)) return;
                    updateLine(index, { sl: value === '' ? '' : Number(value) });
                  }}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData('text');
                    if (!/^\d+$/.test(paste)) e.preventDefault();
                  }}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">Giá niêm yết</label>
                <div className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 flex items-center">
                  {defaultPrice > 0 ? `${VND.format(defaultPrice)} đ` : '-'}
                </div>
              </div>
              <div className="col-span-6 md:col-span-1 md:flex md:items-end">
                <button type="button" onClick={() => removeLine(index)} disabled={items.length === 1} className="w-full h-10 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Xóa
                </button>
              </div>
            </div>);
          })}
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Tổng tiền phiếu xuất: <span className="font-semibold">{VND.format(computedTotal)} đ</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={closeCreate} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" type="button">
            Hủy
          </button>
          <button onClick={saveReceipt} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving} type="button">
            {saving ? 'Đang tạo...' : 'Tạo phiếu'}
          </button>
        </div>
      </div>
    </Modal>
    <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Chi tiết phiếu xuất hàng" size="xl">
      {detailLoading ? (<div className="py-8 text-center text-sm text-gray-500">Đang tải chi tiết phiếu...</div>) : detail ? (<div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Mã phiếu</p>
            <p className="font-semibold text-gray-900">PXK{String(detail.MPX).padStart(4, '0')}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Khách hàng</p>
            <p className="font-semibold text-gray-900">{detail.TENKHACHHANG || `KH #${detail.MKH}`}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Nhân viên</p>
            <p className="font-semibold text-gray-900">{detail.TENNHANVIEN || '-'}</p>
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
            <p className="text-xs text-gray-500">Ngày bán</p>
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
              {(detail.ITEMS || []).map((line) => (<tr key={`${line.MSP}-${line.TENSP}`}>
                <td className="px-3 py-2">{line.MSP}</td>
                <td className="px-3 py-2">{line.TENSP}</td>
                <td className="px-3 py-2 text-right">{Number(line.SL || 0)}</td>
                <td className="px-3 py-2 text-right">{VND.format(Number(line.TIENXUAT || 0))} đ</td>
                <td className="px-3 py-2 text-right font-medium">{VND.format(Number(line.THANHTIEN || 0))} đ</td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setDetailOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
            Đóng
          </button>
        </div>
      </div>) : (<div className="py-8 text-center text-sm text-gray-500">Không có dữ liệu chi tiết.</div>)}
    </Modal>
  </>);
}