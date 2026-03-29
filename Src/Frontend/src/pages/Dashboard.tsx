import {
  FileTextIcon,
  PackageIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { ProfitChart } from '../components/ProfitChart'
import { RecentTransactions } from '../components/RecentTransactions'
import { StatCard } from '../components/StatCard'
export function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  )
  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Tổng quan hệ thống
          </h2>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            placeholder="Nhập năm"
            min="1900"
            max="9999"
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 bg-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUpIcon}
            label={`Doanh thu`}
            value="150.000.000 đ"
          />
          <StatCard icon={FileTextIcon} label="Hóa đơn mới" value="12" />
          <StatCard icon={PackageIcon} label="Sản phẩm tồn thấp" value="5" />
          <StatCard icon={UsersIcon} label="Nhân sự" value="8" />
        </div>
      </div>

      {/* Profit chart full width + transactions below */}
      <div className="space-y-6">
        <ProfitChart />
        <RecentTransactions />
      </div>
    </div>
  )
}
