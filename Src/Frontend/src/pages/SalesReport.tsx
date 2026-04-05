// @ts-nocheck
import { BarChart3Icon, CalendarDaysIcon, DollarSignIcon, PackageIcon, PrinterIcon, TrendingUpIcon, } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DataTable } from '../components/DataTable';
import { StatCard } from '../components/StatCard';
import { getSalesReportApi } from '../utils/backendApi';

function formatCurrency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
}

function getLastDateOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function pad2(num) {
    return String(num).padStart(2, '0');
}

function normalizeDateKey(value) {
    if (!value)
        return '';

    const raw = String(value).trim();
    const isoLike = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoLike)
        return isoLike[1];

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
        const yyyy = parsed.getFullYear();
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd = String(parsed.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    return raw;
}

function buildDateRange(periodType, month, quarter, year) {
    const y = Number(year);

    if (periodType === 'month') {
        const m = Number(month);
        const lastDay = getLastDateOfMonth(y, m);
        return {
            fromDate: `${y}-${pad2(m)}-01`,
            toDate: `${y}-${pad2(m)}-${pad2(lastDay)}`,
            label: `Tháng ${m}/${y}`,
        };
    }

    if (periodType === 'quarter') {
        const q = Number(quarter);
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = startMonth + 2;
        const lastDay = getLastDateOfMonth(y, endMonth);
        return {
            fromDate: `${y}-${pad2(startMonth)}-01`,
            toDate: `${y}-${pad2(endMonth)}-${pad2(lastDay)}`,
            label: `Quý ${q}/${y}`,
        };
    }

    return {
        fromDate: `${y}-01-01`,
        toDate: `${y}-12-31`,
        label: `Năm ${y}`,
    };
}

export function SalesReport() {
    const now = new Date();
    const [periodType, setPeriodType] = useState('month');
    const [month, setMonth] = useState(String(now.getMonth() + 1));
    const [quarter, setQuarter] = useState(String(Math.floor(now.getMonth() / 3) + 1));
    const [year, setYear] = useState(String(now.getFullYear()));
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const period = useMemo(() => buildDateRange(periodType, month, quarter, year), [periodType, month, quarter, year]);

    const fetchReport = async () => {
        setError('');
        try {
            setLoading(true);
            const data = await getSalesReportApi({
                fromDate: period.fromDate,
                toDate: period.toDate,
                reportName: `Báo cáo doanh số ${period.label}`,
            });
            setReport(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Không thể tải báo cáo doanh số');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const chartData = useMemo(() => {
        if (!report)
            return [];

        if (periodType === 'month') {
            const daily = report.dailySales || [];
            const dailyMap = new Map(daily.map((item) => [normalizeDateKey(item.date), Number(item.sales || 0)]));

            const from = new Date(`${period.fromDate}T00:00:00`);
            const to = new Date(`${period.toDate}T00:00:00`);
            const points = [];

            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const isoDate = `${yyyy}-${mm}-${dd}`;
                points.push({
                    label: `${dd}/${mm}`,
                    sales: Number(dailyMap.get(isoDate) || 0),
                });
            }

            return points;
        }

        const monthMap = new Map((report.monthlySales || []).map((item) => [item.month, Number(item.sales || 0)]));

        if (periodType === 'quarter') {
            const q = Number(quarter);
            const start = (q - 1) * 3 + 1;
            return [start, start + 1, start + 2].map((m) => ({
                label: `T${m}`,
                sales: Number(monthMap.get(`T${m}`) || 0),
            }));
        }

        return Array.from({ length: 12 }, (_, idx) => {
            const m = idx + 1;
            return {
                label: `T${m}`,
                sales: Number(monthMap.get(`T${m}`) || 0),
            };
        });
    }, [report, periodType, quarter, period.fromDate, period.toDate]);

    const productTableData = useMemo(() => {
        if (!report)
            return [];
        return [...(report.productRows || [])]
            .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
            .map((item, idx) => ({
                stt: idx + 1,
                productName: item.productName,
                units: Number(item.units || 0),
                revenue: Number(item.revenue || 0),
                profit: Number(item.profit || 0),
            }));
    }, [report]);

    const profitAnalysis = useMemo(() => {
        if (!report) {
            return {
                profitMargin: 0,
                growth: 0,
                grossProfit: 0,
                revenue: 0,
                totalCost: 0,
                averageProfitPerProduct: 0,
                topRevenueShare: 0,
                topProductName: '-',
            };
        }

        const rows = report.productRows || [];
        const revenue = Number(report.revenue || 0);
        const grossProfit = Number(report.grossProfit || 0);
        const totalCost = Number(report.totalCost || 0);
        const topProduct = [...rows].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0];
        const topRevenue = Number(topProduct?.revenue || 0);

        return {
            profitMargin: Number(report.profitMargin || 0),
            growth: Number(report.growth || 0),
            grossProfit,
            revenue,
            totalCost,
            averageProfitPerProduct: rows.length > 0 ? grossProfit / rows.length : 0,
            topRevenueShare: revenue > 0 ? (topRevenue / revenue) * 100 : 0,
            topProductName: topProduct?.productName || '-',
        };
    }, [report]);

    const productColumns = [
        { key: 'stt', label: 'STT' },
        { key: 'productName', label: 'Tên sản phẩm' },
        { key: 'units', label: 'Số lượng bán' },
        {
            key: 'revenue',
            label: 'Doanh thu',
            render: (value) => formatCurrency(value),
        },
        {
            key: 'profit',
            label: 'Lợi nhuận',
            render: (value) => formatCurrency(value),
        },
    ];

    const handlePrintReport = () => {
        if (!report) {
            setError('Chưa có dữ liệu để in báo cáo.');
            return;
        }

        const topProducts = [...(report.productRows || [])]
            .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
            .slice(0, 5);

        const printableHtml = `
            <html>
                <head>
                    <title>In báo cáo doanh số</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                        h1 { font-size: 22px; margin-bottom: 4px; }
                        h2 { font-size: 16px; margin: 20px 0 8px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                        th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 13px; text-align: left; }
                        th { background: #f9fafb; }
                        .muted { color: #6b7280; font-size: 12px; }
                        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
                        .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Báo cáo doanh số</h1>
                    <div class="muted">Kỳ báo cáo: ${period.label}</div>
                    <div class="muted">Khoảng ngày: ${period.fromDate} đến ${period.toDate}</div>
                    <div class="muted">Thời gian in: ${new Date().toLocaleString('vi-VN')}</div>

                    <h2>Tổng hợp doanh số</h2>
                    <div class="grid">
                        <div class="box">Tổng sản phẩm đã bán: <b>${new Intl.NumberFormat('vi-VN').format(Number(report.orders || 0))}</b></div>
                        <div class="box">Tổng doanh thu: <b>${formatCurrency(report.revenue)}</b></div>
                        <div class="box">Tổng vốn: <b>${formatCurrency(report.totalCost)}</b></div>
                        <div class="box">Lợi nhuận gộp: <b>${formatCurrency(report.grossProfit)}</b></div>
                    </div>

                    <h2>Nhóm/Sản phẩm doanh thu cao</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên sản phẩm</th>
                                <th>Số lượng bán</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topProducts.map((item, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${item.productName}</td>
                                    <td>${new Intl.NumberFormat('vi-VN').format(Number(item.units || 0))}</td>
                                    <td>${formatCurrency(item.revenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <h2>Phân tích lợi nhuận</h2>
                    <div class="box">
                        Tỷ suất lợi nhuận (Lợi nhuận/Doanh thu):
                        <b>${Number(report.profitMargin || 0).toFixed(1)}%</b>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow)
            return;
        printWindow.document.write(printableHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-gold-600" />
                    <p className="text-sm font-semibold text-gray-800">Bộ lọc báo cáo</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                        <label className="mb-1.5 block text-sm text-gray-600">Loại thời gian</label>
                        <select
                            value={periodType}
                            onChange={(e) => setPeriodType(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                        >
                            <option value="month">Tháng</option>
                            <option value="quarter">Quý</option>
                            <option value="year">Năm</option>
                        </select>
                    </div>

                    {periodType === 'month' ? (
                        <div>
                            <label className="mb-1.5 block text-sm text-gray-600">Tháng</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1)}>
                                        Tháng {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {periodType === 'quarter' ? (
                        <div>
                            <label className="mb-1.5 block text-sm text-gray-600">Quý</label>
                            <select
                                value={quarter}
                                onChange={(e) => setQuarter(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                            >
                                <option value="1">Quý 1</option>
                                <option value="2">Quý 2</option>
                                <option value="3">Quý 3</option>
                                <option value="4">Quý 4</option>
                            </select>
                        </div>
                    ) : null}

                    <div>
                        <label className="mb-1.5 block text-sm text-gray-600">Năm</label>
                        <input
                            type="number"
                            min="2000"
                            max="2100"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchReport}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600"
                            disabled={loading}
                        >
                            <BarChart3Icon className="h-4 w-4" />
                            {loading ? 'Đang thống kê...' : 'Thống kê'}
                        </button>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handlePrintReport}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            In báo cáo
                        </button>
                    </div>
                </div>

                {error ? (
                    <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                ) : null}
            </div>

            {report ? (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={PackageIcon} label="Tổng sản phẩm đã bán" value={new Intl.NumberFormat('vi-VN').format(Number(report.orders || 0))} />
                        <StatCard icon={DollarSignIcon} label="Tổng doanh thu" value={formatCurrency(report.revenue)} />
                        <StatCard icon={TrendingUpIcon} label="Tổng vốn" value={formatCurrency(report.totalCost)} />
                        <StatCard icon={DollarSignIcon} label="Lợi nhuận gộp" value={formatCurrency(report.grossProfit)} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">Biểu đồ cột doanh thu</h3>
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="label" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(Number(v || 0) / 1000000)}tr`} />
                                        <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                                        <Bar dataKey="sales" fill="#c8a45e" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white via-gold-50/20 to-emerald-50/30 p-4 shadow-sm">
                            <h3 className="mb-3 text-base font-semibold text-gray-900">Phân tích lợi nhuận</h3>
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-emerald-700">Tỷ suất LN</p>
                                    <p className="text-lg font-bold text-emerald-900">{profitAnalysis.profitMargin.toFixed(1)}%</p>
                                </div>
                                <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-sky-700">Tăng trưởng</p>
                                    <p className={`text-lg font-bold ${profitAnalysis.growth >= 0 ? 'text-sky-800' : 'text-red-700'}`}>
                                        {profitAnalysis.growth >= 0 ? '+' : ''}
                                        {profitAnalysis.growth.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-gray-600">
                                        <span>Biên lợi nhuận gộp</span>
                                        <span className="font-semibold text-gray-900">{profitAnalysis.profitMargin.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200">
                                        <div
                                            className="h-2 rounded-full bg-emerald-500 transition-all"
                                            style={{ width: `${Math.min(100, Math.max(0, profitAnalysis.profitMargin))}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-1 flex items-center justify-between text-gray-600">
                                        <span>Tỷ trọng top doanh thu</span>
                                        <span className="font-semibold text-gray-900">{profitAnalysis.topRevenueShare.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200">
                                        <div
                                            className="h-2 rounded-full bg-gold-500 transition-all"
                                            style={{ width: `${Math.min(100, Math.max(0, profitAnalysis.topRevenueShare))}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-gray-100 bg-white/80 px-3 py-2 text-gray-700">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Điểm nổi bật</p>
                                    <p>
                                        Sản phẩm dẫn đầu: <span className="font-semibold text-gray-900">{profitAnalysis.topProductName}</span>
                                    </p>
                                    <p>
                                        LN gộp bình quân/SP:{' '}
                                        <span className="font-semibold text-gray-900">{formatCurrency(profitAnalysis.averageProfitPerProduct)}</span>
                                    </p>
                                    <p>
                                        Tỷ lệ vốn/DT:{' '}
                                        <span className="font-semibold text-gray-900">
                                            {profitAnalysis.revenue > 0 ? ((profitAnalysis.totalCost / profitAnalysis.revenue) * 100).toFixed(1) : '0.0'}%
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        title={`Danh sách sản phẩm đã xuất - ${period.label}`}
                        columns={productColumns}
                        data={productTableData}
                        searchPlaceholder="Tìm theo tên sản phẩm..."
                        advancedFilterKeys={['productName', 'units', 'revenue', 'profit']}
                        rangeFilterKeys={[
                            {
                                key: 'units',
                                inputType: 'number',
                                minPlaceholder: 'Từ SL',
                                maxPlaceholder: 'Đến SL',
                            },
                            {
                                key: 'revenue',
                                inputType: 'number',
                                minPlaceholder: 'Từ doanh thu',
                                maxPlaceholder: 'Đến doanh thu',
                            },
                            {
                                key: 'profit',
                                inputType: 'number',
                                minPlaceholder: 'Từ lợi nhuận',
                                maxPlaceholder: 'Đến lợi nhuận',
                            },
                        ]}
                    />
                </>
            ) : null}
        </div>
    );
}
