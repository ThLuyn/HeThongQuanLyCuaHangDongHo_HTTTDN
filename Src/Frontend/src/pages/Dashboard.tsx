// @ts-nocheck
import { FileTextIcon, PackageIcon, TrendingUpIcon, UsersIcon, } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProfitChart } from '../components/ProfitChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { StatCard } from '../components/StatCard';
import { getDashboardOverviewApi } from '../utils/backendApi';
const EMPTY_OVERVIEW = {
    year: new Date().getFullYear(),
    summary: {
        doanhThu: 0,
        hoaDonMoi: 0,
        sanPhamTonThap: 0,
        nhanSu: 0,
    },
    chart: Array.from({ length: 12 }, (_, i) => ({
        month: `T${i + 1}`,
        revenue: 0,
        profit: 0,
    })),
    recentTransactions: [],
};
export function Dashboard({ onOpenLowStockProducts, onOpenExportReceipts }) {
  const storeOpenYear = 2024;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: Math.max(1, currentYear - storeOpenYear + 1) }, (_, index) => String(storeOpenYear + index));
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
    const [overview, setOverview] = useState(EMPTY_OVERVIEW);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const year = Number(selectedYear);
        if (!Number.isInteger(year) || year < 1900 || year > 9999) {
            return;
        }
        const loadOverview = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getDashboardOverviewApi(year);
                setOverview(data);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : 'Không tải được dữ liệu tổng quan';
                setError(message);
            }
            finally {
                setLoading(false);
            }
        };
        loadOverview();
    }, [selectedYear]);
    const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
    return (<div className="space-y-6">
      {error && (<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Không tải được dữ liệu dashboard: {error}
        </div>)}

      {/* System Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Tổng quan hệ thống
          </h2>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 bg-white">
            {yearOptions.map((year) => (<option key={year} value={year}>
                {year}
              </option>))}
          </select>
        </div>
        {loading && (<p className="mb-4 text-sm text-gray-500">Đang tải dữ liệu tổng quan...</p>)}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUpIcon} label={`Doanh thu`} value={formatVnd(overview.summary.doanhThu)}/>
          <StatCard icon={FileTextIcon} label="Phiếu xuất đã bán" value={String(overview.summary.hoaDonMoi)} onClick={onOpenExportReceipts}/>
          <StatCard icon={PackageIcon} label="Sản phẩm tồn thấp" value={String(overview.summary.sanPhamTonThap)} onClick={onOpenLowStockProducts}/>
          <StatCard icon={UsersIcon} label="Nhân sự" value={String(overview.summary.nhanSu)}/>
        </div>
      </div>

      {/* Profit chart full width + transactions below */}
      <div className="space-y-6">
        <ProfitChart data={overview.chart}/>
        <RecentTransactions data={overview.recentTransactions}/>
      </div>
    </div>);
}
