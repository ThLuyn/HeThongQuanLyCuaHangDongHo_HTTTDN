const VND = new Intl.NumberFormat('vi-VN');

export function formatMoney(value: number): string {
  return `${VND.format(Number(value || 0))} đ`;
}

function readTriple(number: number): string {
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const hundreds = Math.floor(number / 100);
  const tensUnits = number % 100;
  const tens = Math.floor(tensUnits / 10);
  const units = tensUnits % 10;
  let result = '';

  if (hundreds > 0) {
    result += `${digits[hundreds]} trăm`;
    if (tensUnits > 0) {
      result += ' ';
    }
  }

  if (tens > 1) {
    result += `${digits[tens]} mươi`;
    if (units === 1) {
      result += ' mốt';
    } else if (units === 4) {
      result += ' tư';
    } else if (units === 5) {
      result += ' lăm';
    } else if (units > 0) {
      result += ` ${digits[units]}`;
    }
  } else if (tens === 1) {
    result += 'mười';
    if (units === 5) {
      result += ' lăm';
    } else if (units > 0) {
      result += ` ${digits[units]}`;
    }
  } else if (units > 0) {
    if (hundreds > 0) {
      result += `lẻ ${digits[units]}`;
    } else {
      result += digits[units];
    }
  }

  return result.trim();
}

export function numberToVietnameseWords(value: number): string {
  const amount = Math.round(Number(value || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Không đồng';
  }

  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const chunks: number[] = [];
  let remaining = amount;

  while (remaining > 0) {
    chunks.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i -= 1) {
    const chunk = chunks[i];
    if (chunk === 0) {
      continue;
    }
    const unit = units[i % units.length];
    const scale = Math.floor(i / units.length);
    const scaleSuffix = scale > 0 ? ` ${'tỷ'.repeat(scale)}` : '';
    const part = `${readTriple(chunk)}${unit ? ` ${unit}` : ''}${scaleSuffix}`.trim();
    words.push(part);
  }

  const sentence = words.join(' ').replace(/\s+/g, ' ').trim();
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} đồng`;
}

export function openPrintWindow(title: string, html: string): void {
  const popup = window.open('', '_blank', 'width=1000,height=760');
  if (!popup) {
    return;
  }

  popup.document.open();
  popup.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>${title}</title></head><body>${html}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function buildMonthlyPayslipHtml(params: {
  employee: any;
  selectedMonth: number;
  selectedYear: number;
}): string {
  const { employee, selectedMonth, selectedYear } = params;
  const netSalaryText = formatMoney(employee.takeHome);
  const netSalaryWords = numberToVietnameseWords(employee.takeHome);

  return `
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #111827;
        background: #ffffff;
        margin: 0;
        padding: 0;
      }
      .sheet {
        width: 100%;
        max-width: 820px;
        margin: 0 auto;
        border: 1px solid #374151;
      }
      .brand {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 14px 16px;
        background: linear-gradient(135deg, #f8f5ee 0%, #f3efe5 100%);
        border-bottom: 1px solid #374151;
      }
      .brand-name { font-size: 15px; font-weight: 700; text-transform: uppercase; }
      .brand-sub { font-size: 12px; color: #4b5563; margin-top: 3px; }
      .doc-title { text-align: right; }
      .doc-title h1 { margin: 0; font-size: 22px; letter-spacing: 0.6px; text-transform: uppercase; }
      .doc-title p { margin: 4px 0 0; color: #4b5563; font-size: 12px; }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1px solid #374151;
      }
      .meta-item {
        padding: 8px 12px;
        border-right: 1px solid #374151;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
      }
      .meta-item:nth-child(2n) { border-right: none; }
      .meta-label { color: #6b7280; }
      .section-title {
        margin: 0;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        background: #f9fafb;
        border-bottom: 1px solid #374151;
      }
      .detail { width: 100%; border-collapse: collapse; }
      .detail th, .detail td {
        border: 1px solid #374151;
        border-left: none;
        border-right: none;
        padding: 8px 10px;
        font-size: 13px;
      }
      .detail th { background: #f3f4f6; font-weight: 700; }
      .right { text-align: right; }
      .net-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-top: 1px solid #374151;
        font-size: 15px;
        font-weight: 700;
        background: #ecfdf5;
        color: #065f46;
      }
      .spelled {
        padding: 9px 12px;
        border-top: 1px dashed #9ca3af;
        font-size: 12px;
        color: #374151;
      }
      .signature {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        padding: 20px 16px 24px;
      }
      .signature-block { text-align: center; font-size: 13px; }
      .signature-title { font-weight: 700; margin-bottom: 54px; }
    </style>
    <div class="sheet">
      <div class="brand">
        <div>
          <div class="brand-name">Cửa hàng đồng hồ GOLDEN TIME</div>
          <div class="brand-sub">Địa chỉ: 273 An Dương Vương, Phường Chợ Quán, TP. Hồ Chí Minh</div>
        </div>
        <div class="doc-title">
          <h1>Phiếu lương</h1>
          <p>Kỳ lương: Tháng ${selectedMonth} năm ${selectedYear}</p>
        </div>
      </div>

      <div class="meta">
        <div class="meta-item"><span class="meta-label">Mã nhân viên:</span> <strong>${employee.id}</strong></div>
        <div class="meta-item"><span class="meta-label">Lương đóng BHBB:</span> <strong>${formatMoney(employee.baseSalary)}</strong></div>
        <div class="meta-item"><span class="meta-label">Họ và tên:</span> <strong>${employee.name}</strong></div>
        <div class="meta-item"><span class="meta-label">Ngày công đi làm:</span> <strong>${employee.workingDays} ngày</strong></div>
        <div class="meta-item"><span class="meta-label">Chức vụ:</span> <strong>${employee.position}</strong></div>
        <div class="meta-item"><span class="meta-label">Ngày công chuẩn:</span> <strong>26 ngày</strong></div>
      </div>

      <p class="section-title">Các khoản thu nhập</p>
      <table class="detail">
        <thead>
          <tr>
            <th style="width:55%">Các khoản thu nhập</th>
            <th class="right" style="width:45%">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Lương chính</td><td class="right">${formatMoney(employee.baseSalary)}</td></tr>
          <tr><td>Hoa hồng</td><td class="right">${formatMoney(employee.allowance)}</td></tr>
          <tr><td>Doanh số</td><td class="right">${formatMoney(employee.revenue)}</td></tr>
          <tr><td><strong>Tổng thu nhập</strong></td><td class="right"><strong>${formatMoney(employee.baseSalary + employee.allowance)}</strong></td></tr>
        </tbody>
      </table>

      <p class="section-title">Các khoản trừ vào lương</p>
      <table class="detail">
        <thead>
          <tr>
            <th style="width:55%">Các khoản trừ vào lương</th>
            <th class="right" style="width:45%">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Bảo hiểm xã hội (8%)</td><td class="right">${formatMoney(employee.bhxh)}</td></tr>
          <tr><td>Bảo hiểm y tế (1.5%)</td><td class="right">${formatMoney(employee.bhyt)}</td></tr>
          <tr><td>Bảo hiểm thất nghiệp (1%)</td><td class="right">${formatMoney(employee.bhtn)}</td></tr>
          <tr><td>Khấu trừ khác</td><td class="right">${formatMoney(employee.khauTruKhac)}</td></tr>
          <tr><td><strong>Tổng các khoản trừ</strong></td><td class="right"><strong>${formatMoney(employee.deduction)}</strong></td></tr>
        </tbody>
      </table>

      <div class="net-row">
        <span>Tổng số tiền lương thực nhận</span>
        <span>${netSalaryText}</span>
      </div>
      <div class="spelled"><strong>Bằng chữ:</strong> ${netSalaryWords}</div>

      <div class="signature">
        <div class="signature-block">
          <div class="signature-title">Người lập phiếu</div>
          <div>Ký và ghi rõ họ tên</div>
        </div>
        <div class="signature-block">
          <div class="signature-title">Người nhận tiền</div>
          <div>Ký và ghi rõ họ tên</div>
        </div>
      </div>
    </div>
  `;
}

export function buildYearlyPayrollHtml(params: {
  employee: any;
  selectedYear: number;
  monthlyRows: Array<{ month: number; workDays: number; commission: number; deduction: number; takeHome: number }>;
  totalWorkDays: number;
  totalCommission: number;
  totalDeduction: number;
  totalTakeHome: number;
}): string {
  const {
    employee,
    selectedYear,
    monthlyRows,
    totalWorkDays,
    totalCommission,
    totalDeduction,
    totalTakeHome,
  } = params;

  const rowsHtml = monthlyRows
    .map(
      (item) => `
        <tr>
          <td>Tháng ${item.month}</td>
          <td class="right">${item.workDays}</td>
          <td class="right">${formatMoney(item.commission)}</td>
          <td class="right">${formatMoney(item.deduction)}</td>
          <td class="right"><strong>${formatMoney(item.takeHome)}</strong></td>
        </tr>
      `,
    )
    .join('');

  const totalTakeHomeWords = numberToVietnameseWords(totalTakeHome);

  return `
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 0; }
      .sheet { max-width: 900px; margin: 0 auto; border: 1px solid #374151; }
      .brand {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 14px 16px;
        border-bottom: 1px solid #374151;
        background: linear-gradient(135deg, #f8f5ee 0%, #f3efe5 100%);
      }
      .brand-name { font-size: 15px; font-weight: 700; text-transform: uppercase; }
      .brand-sub { font-size: 12px; color: #4b5563; margin-top: 3px; }
      .doc-title { text-align: right; }
      .doc-title h1 { margin: 0; font-size: 22px; letter-spacing: 0.6px; text-transform: uppercase; }
      .doc-title p { margin: 4px 0 0; color: #4b5563; font-size: 12px; }
      .head {
        padding: 14px 16px;
        border-bottom: 1px solid #374151;
        background: #ffffff;
      }
      .title { margin: 0; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .sub { margin-top: 6px; color: #374151; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #374151; padding: 8px 10px; text-align: left; font-size: 13px; }
      th { background: #f3f4f6; }
      .right { text-align: right; }
      .summary {
        padding: 12px 16px;
        border-top: 1px solid #374151;
        background: #fafaf9;
        font-size: 13px;
      }
      .summary p { margin: 6px 0; }
      .net-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-top: 1px solid #374151;
        font-size: 15px;
        font-weight: 700;
        background: #ecfdf5;
        color: #065f46;
      }
      .spelled {
        padding: 9px 12px;
        border-top: 1px dashed #9ca3af;
        font-size: 12px;
        color: #374151;
      }
      .signature {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        padding: 20px 16px 24px;
      }
      .signature-block { text-align: center; font-size: 13px; }
      .signature-title { font-weight: 700; margin-bottom: 54px; }
    </style>
    <div class="sheet">
      <div class="brand">
        <div>
          <div class="brand-name">Cửa hàng đồng hồ GOLDEN TIME</div>
          <div class="brand-sub">Địa chỉ: 273 An Dương Vương, Phường Chợ Quán, TP. Hồ Chí Minh</div>
        </div>
        <div class="doc-title">
          <h1>Phiếu lương</h1>
          <p>Kỳ lương: Năm ${selectedYear}</p>
        </div>
      </div>
      <div class="head">
        <h1 class="title">Bảng tổng hợp lương năm ${selectedYear}</h1>
        <div class="sub">Nhân sự: ${employee.name} (${employee.id})</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tháng</th>
            <th class="right">Ngày công</th>
            <th class="right">Hoa hồng</th>
            <th class="right">Khấu trừ</th>
            <th class="right">Thực lĩnh</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="summary">
        <p><strong>Tổng ngày công:</strong> ${totalWorkDays} ngày</p>
        <p><strong>Tổng hoa hồng:</strong> ${formatMoney(totalCommission)}</p>
        <p><strong>Tổng khấu trừ:</strong> ${formatMoney(totalDeduction)}</p>
      </div>
      <div class="net-row">
        <span>Tổng số tiền lương thực nhận</span>
        <span>${formatMoney(totalTakeHome)}</span>
      </div>
      <div class="spelled"><strong>Bằng chữ:</strong> ${totalTakeHomeWords}</div>

      <div class="signature">
        <div class="signature-block">
          <div class="signature-title">Người lập phiếu</div>
          <div>Ký và ghi rõ họ tên</div>
        </div>
        <div class="signature-block">
          <div class="signature-title">Người nhận tiền</div>
          <div>Ký và ghi rõ họ tên</div>
        </div>
      </div>
    </div>
  `;
}

export function buildAllEmployeesMonthlyHtml(params: {
  rows: any[];
  selectedMonth: number;
  selectedYear: number;
  totalBaseSalary: number;
  totalGross: number;
  totalDeduction: number;
  totalTakeHome: number;
}): string {
  const {
    rows,
    selectedMonth,
    selectedYear,
    totalBaseSalary,
    totalGross,
    totalDeduction,
    totalTakeHome,
  } = params;

  const rowsHtml = rows
    .map((item, index) => {
      const salaryByTime = Math.round((Number(item.baseSalary || 0) / 26) * Number(item.workingDays || 0));
      const gross = salaryByTime + Number(item.allowance || 0);
      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${item.name}</td>
          <td class="right">${formatMoney(item.baseSalary)}</td>
          <td class="center">${item.workingDays}</td>
          <td class="right">${formatMoney(salaryByTime)}</td>
          <td class="right">${formatMoney(item.allowance)}</td>
          <td class="right">${formatMoney(item.deduction)}</td>
          <td class="right">${formatMoney(gross)}</td>
          <td class="right"><strong>${formatMoney(item.takeHome)}</strong></td>
          <td></td>
        </tr>
      `;
    })
    .join('');

  return `
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Times New Roman', serif; color: #111827; margin: 0; padding: 0; }
      .sheet { border: 1px solid #1f2937; padding: 10px; }
      .head { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .head-left { font-size: 15px; line-height: 1.6; }
      .head-center { text-align: center; font-size: 14px; font-style: italic; }
      .head-right { text-align: right; font-size: 14px; }
      .title { text-align: center; margin: 8px 0 4px; font-size: 42px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .subtitle { text-align: center; margin: 0 0 10px; font-size: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #1f2937; padding: 6px 8px; font-size: 13px; }
      th { background: #dbeafe; font-weight: 700; text-align: center; }
      .center { text-align: center; }
      .right { text-align: right; }
      .total-row td { font-weight: 700; background: #f3f4f6; }
      .summary { margin-top: 8px; font-size: 14px; }
      .sign { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; }
      .sign-title { font-weight: 700; font-size: 14px; margin-bottom: 36px; }
    </style>
    <div class="sheet">
      <div class="head">
        <div class="head-left">
          <div><strong>Đơn vị:</strong> Cửa hàng đồng hồ GOLDEN TIME</div>
          <div><strong>Bộ phận:</strong> Nhân sự - Kế toán</div>
        </div>
      </div>

      <h1 class="title">Bảng thanh toán tiền lương</h1>
      <p class="subtitle">Tháng ${selectedMonth} năm ${selectedYear}</p>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:56px">STT</th>
            <th rowspan="2">Họ và tên</th>
            <th rowspan="2" style="width:150px">Lương cơ bản</th>
            <th colspan="2" style="width:230px">Lương thời gian</th>
            <th rowspan="2" style="width:140px">Hoa hồng</th>
            <th rowspan="2" style="width:140px">Khấu trừ</th>
            <th rowspan="2" style="width:170px">Tổng tiền lương tháng</th>
            <th rowspan="2" style="width:170px">Thực lĩnh</th>
            <th rowspan="2" style="width:110px">Ký nhận</th>
          </tr>
          <tr>
            <th style="width:90px">Ngày công</th>
            <th style="width:140px">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="total-row">
            <td colspan="7" class="right">Tổng cộng</td>
            <td class="right">${formatMoney(totalGross)}</td>
            <td class="right">${formatMoney(totalTakeHome)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <p><strong>Tổng lương cơ bản:</strong> ${formatMoney(totalBaseSalary)}</p>
        <p><strong>Tổng khấu trừ:</strong> ${formatMoney(totalDeduction)}</p>
        <p><strong>Tổng số tiền (viết bằng chữ):</strong> ${numberToVietnameseWords(totalTakeHome)}</p>
      </div>

      <div class="sign">
        <div>
          <div class="sign-title">Người lập biểu</div>
          <div>(Ký, họ tên)</div>
        </div>
        <div>
          <div class="sign-title">Kế toán trưởng</div>
          <div>(Ký, họ tên)</div>
        </div>
        <div>
          <div class="sign-title">Giám đốc</div>
          <div>(Ký, họ tên)</div>
        </div>
      </div>
    </div>
  `;
}
