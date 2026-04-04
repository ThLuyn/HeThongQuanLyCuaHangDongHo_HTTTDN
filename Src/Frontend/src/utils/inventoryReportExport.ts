// @ts-nocheck
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const numberFormatter = new Intl.NumberFormat('vi-VN');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPeriodLabel(reportMonth, reportYear) {
  return reportMonth ? `Tháng ${reportMonth} Năm ${reportYear}` : `Năm ${reportYear}`;
}

function getSafePeriodLabel(reportMonth, reportYear) {
  return reportMonth ? `thang-${reportMonth}-${reportYear}` : `nam-${reportYear}`;
}

function buildReportRows(reportData) {
  return (reportData?.products || []).map((item, index) => {
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
}

export function buildInventoryReportDocument(reportData, reportMonth, reportYear, reportCreator, createdAt = new Date()) {
  const periodLabel = getPeriodLabel(reportMonth, reportYear);
  const createdAtLabel = createdAt.toLocaleString('vi-VN');
  const safePeriodLabel = getSafePeriodLabel(reportMonth, reportYear);

  const reportRows = buildReportRows(reportData);
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
        <div class="value">${numberFormatter.format(Number(reportData?.summary?.SANPHAM_HOATDONG || 0))} sản phẩm</div>
      </div>
      <div class="summary-card">
        <div class="label">Tổng vốn nhập hàng trong tháng</div>
        <div class="value">${numberFormatter.format(Number(reportData?.imports?.TONG_GIA_TRI_NHAP || 0))} đ</div>
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
        <div>${escapeHtml(reportCreator || 'Chưa xác định')}</div>
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

  return {
    html: printableHtml,
    fileName: `bao-cao-thong-ke-bien-dong-kho-${safePeriodLabel}.html`,
  };
}

export function printInventoryReportDocument(reportDoc) {
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(reportDoc.html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

export function exportInventoryReportPdf(reportData, reportMonth, reportYear) {
  const periodLabel = reportMonth
    ? `Tháng ${reportMonth}/${reportYear}`
    : `Năm ${reportYear}`;

  const rows = buildReportRows(reportData).map((item) => ([
    item.stt,
    item.maSp,
    String(item.tenSp || '-'),
    numberFormatter.format(item.tonDauKy),
    numberFormatter.format(item.nhapTrongKy),
    numberFormatter.format(item.xuatTrongKy),
    numberFormatter.format(item.tonCuoiKy),
    `${numberFormatter.format(item.giaTriTonKho)} đ`,
  ]));

  const safePeriodLabel = getSafePeriodLabel(reportMonth, reportYear);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BAO CAO THONG KE BIEN DONG KHO HANG', 148, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Ky bao cao: ${periodLabel}`, 14, 20);
  doc.text(`Tong san pham hoat dong: ${numberFormatter.format(Number(reportData?.summary?.SANPHAM_HOATDONG || 0))}`, 14, 26);
  doc.text(`Tong ton kho: ${numberFormatter.format(Number(reportData?.summary?.TONG_TON_KHO || 0))}`, 120, 26);
  doc.text(`Tong gia tri nhap: ${numberFormatter.format(Number(reportData?.imports?.TONG_GIA_TRI_NHAP || 0))} đ`, 210, 26, { align: 'right' });

  autoTable(doc, {
    startY: 30,
    head: [['STT', 'Ma SP', 'Ten san pham', 'Ton dau ky', 'Nhap trong ky', 'Xuat trong ky', 'Ton cuoi ky', 'Gia tri ton kho']],
    body: rows.length > 0 ? rows : [['', '', 'Khong co du lieu', '', '', '', '', '']],
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 82 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 34 },
    },
    margin: { left: 12, right: 12 },
  });

  doc.save(`bao-cao-thong-ke-bien-dong-kho-${safePeriodLabel}.pdf`);
}
