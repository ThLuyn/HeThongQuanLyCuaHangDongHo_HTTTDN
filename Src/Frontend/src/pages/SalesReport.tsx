import {
    CalendarDaysIcon,
    DollarSignIcon,
    FileTextIcon,
    PercentIcon,
    ShoppingCartIcon,
    TrendingUpIcon,
} from 'lucide-react'
import { useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { DataTable } from '../components/DataTable'
import { StatCard } from '../components/StatCard'

type SalesEntry = {
  date: string
  revenue: number
  orders: number
  cost: number
  category: string
}

type CategoryBreakdown = {
  name: string
  value: number
}

type MonthlyBreakdown = {
  month: string
  sales: number
  orders: number
}

type ProductBreakdown = {
  productName: string
  category: string
  units: number
  revenue: number
  cost: number
}

type ProductPerformance = {
  productName: string
  category: string
  units: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

type GeneratedReport = {
  id: string
  reportName: string
  fromDate: string
  toDate: string
  createdAt: string
  revenue: number
  orders: number
  growth: number
  profitMargin: number
  totalCost: number
  grossProfit: number
  topProductName: string
  topProductUnits: number
  slowProductName: string
  slowProductUnits: number
  categoryData: CategoryBreakdown[]
  monthlySales: MonthlyBreakdown[]
  productRows: ProductPerformance[]
}

const salesEntries: SalesEntry[] = [
  {
    date: '2026-01-05',
    revenue: 120000000,
    orders: 62,
    cost: 80500000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-01-18',
    revenue: 108000000,
    orders: 55,
    cost: 74200000,
    category: 'Nữ cao cấp',
  },
  {
    date: '2026-02-10',
    revenue: 135000000,
    orders: 74,
    cost: 91200000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-02-22',
    revenue: 124000000,
    orders: 66,
    cost: 85100000,
    category: 'Thông minh',
  },
  {
    date: '2026-03-08',
    revenue: 150000000,
    orders: 81,
    cost: 102500000,
    category: 'Nữ cao cấp',
  },
  {
    date: '2026-03-20',
    revenue: 143000000,
    orders: 78,
    cost: 96900000,
    category: 'Thể thao',
  },
  {
    date: '2026-04-12',
    revenue: 142000000,
    orders: 77,
    cost: 95400000,
    category: 'Đồng hồ cơ',
  },
  {
    date: '2026-04-26',
    revenue: 129000000,
    orders: 69,
    cost: 88200000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-05-09',
    revenue: 168000000,
    orders: 94,
    cost: 113600000,
    category: 'Thông minh',
  },
  {
    date: '2026-05-24',
    revenue: 156000000,
    orders: 88,
    cost: 107300000,
    category: 'Nữ cao cấp',
  },
  {
    date: '2026-06-11',
    revenue: 175000000,
    orders: 98,
    cost: 119000000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-06-28',
    revenue: 161000000,
    orders: 89,
    cost: 109800000,
    category: 'Thông minh',
  },
  {
    date: '2026-07-07',
    revenue: 190000000,
    orders: 103,
    cost: 130200000,
    category: 'Nữ cao cấp',
  },
  {
    date: '2026-07-21',
    revenue: 173000000,
    orders: 95,
    cost: 118400000,
    category: 'Thể thao',
  },
  {
    date: '2026-08-04',
    revenue: 210000000,
    orders: 114,
    cost: 143500000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-08-19',
    revenue: 194000000,
    orders: 106,
    cost: 132200000,
    category: 'Thông minh',
  },
  {
    date: '2026-09-10',
    revenue: 195000000,
    orders: 105,
    cost: 133500000,
    category: 'Đồng hồ cơ',
  },
  {
    date: '2026-09-23',
    revenue: 182000000,
    orders: 98,
    cost: 124800000,
    category: 'Nữ cao cấp',
  },
  {
    date: '2026-10-08',
    revenue: 225000000,
    orders: 121,
    cost: 154000000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-10-27',
    revenue: 208000000,
    orders: 113,
    cost: 142500000,
    category: 'Thể thao',
  },
  {
    date: '2026-11-14',
    revenue: 240000000,
    orders: 130,
    cost: 163700000,
    category: 'Nam cao cấp',
  },
  {
    date: '2026-11-29',
    revenue: 219000000,
    orders: 118,
    cost: 150100000,
    category: 'Thông minh',
  },
  {
    date: '2026-12-06',
    revenue: 260000000,
    orders: 140,
    cost: 177300000,
    category: 'Nữ cao cấp',
  },
  {
    date: '2026-12-22',
    revenue: 248000000,
    orders: 133,
    cost: 169800000,
    category: 'Nam cao cấp',
  },
]

const COLORS = ['#c8a45e', '#2dd4bf', '#6366f1', '#f59e0b', '#ef4444']

const categoryProducts: Record<string, string[]> = {
  'Nam cao cấp': ['Rolex Datejust 41', 'Tissot PRX Powermatic 80', 'Seiko Presage Cocktail'],
  'Nữ cao cấp': ['Longines DolceVita', 'Citizen Eco-Drive EM0892', 'Fossil Carlie Mini'],
  'Thể thao': ['Casio G-Shock GA-2100', 'Garmin Forerunner 255', 'Seiko 5 Sports SRPD'],
  'Đồng hồ cơ': ['Orient Bambino Gen 2', 'Seiko 5 SNK809', 'Hamilton Khaki Field Auto'],
  'Thông minh': ['Apple Watch Series 10', 'Samsung Galaxy Watch 7', 'Xiaomi Watch S4'],
}

function formatVND(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}tr`
  return String(value)
}

function formatDateLabel(dateValue: string): string {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return dateValue
  return date.toLocaleDateString('vi-VN')
}

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

function toMonthKey(dateValue: string): string {
  const date = new Date(dateValue)
  return `T${date.getMonth() + 1}`
}

function splitEntryByProducts(entry: SalesEntry): ProductBreakdown[] {
  const products = categoryProducts[entry.category] || ['Sản phẩm khác A', 'Sản phẩm khác B', 'Sản phẩm khác C']
  const unitRatios = [0.45, 0.35, 0.2]
  const revenueRatios = [0.5, 0.3, 0.2]
  const costRatios = [0.48, 0.32, 0.2]

  let unitsLeft = entry.orders
  let revenueLeft = entry.revenue
  let costLeft = entry.cost

  return products.map((productName, idx) => {
    const isLast = idx === products.length - 1
    const units = isLast ? unitsLeft : Math.max(1, Math.round(entry.orders * unitRatios[idx]))
    const revenue = isLast ? revenueLeft : Math.max(1, Math.round(entry.revenue * revenueRatios[idx]))
    const cost = isLast ? costLeft : Math.max(1, Math.round(entry.cost * costRatios[idx]))

    unitsLeft -= units
    revenueLeft -= revenue
    costLeft -= cost

    return {
      productName,
      category: entry.category,
      units,
      revenue,
      cost,
    }
  })
}

function createReport(
  fromDate: string,
  toDate: string,
  reportName: string,
): GeneratedReport | null {
  const filtered = salesEntries.filter(
    (entry) => entry.date >= fromDate && entry.date <= toDate,
  )
  if (filtered.length === 0) return null

  const revenue = filtered.reduce((sum, item) => sum + item.revenue, 0)
  const orders = filtered.reduce((sum, item) => sum + item.orders, 0)
  const totalCost = filtered.reduce((sum, item) => sum + item.cost, 0)
  const grossProfit = revenue - totalCost
  const profitMargin = revenue === 0 ? 0 : ((revenue - totalCost) / revenue) * 100

  const pivotDate = filtered[Math.floor(filtered.length / 2)].date
  const firstHalfRevenue = filtered
    .filter((item) => item.date <= pivotDate)
    .reduce((sum, item) => sum + item.revenue, 0)
  const secondHalfRevenue = filtered
    .filter((item) => item.date > pivotDate)
    .reduce((sum, item) => sum + item.revenue, 0)
  const growth =
    firstHalfRevenue === 0 ? 0 : ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100

  const categoryRevenueMap = filtered.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.revenue
      return acc
    },
    {},
  )
  const categoryData = Object.entries(categoryRevenueMap)
    .map(([name, categoryRevenue]) => ({
      name,
      value: Number(((categoryRevenue / revenue) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value)

  const monthlyRevenueMap = filtered.reduce<Record<string, number>>((acc, item) => {
    const monthKey = toMonthKey(item.date)
    acc[monthKey] = (acc[monthKey] || 0) + item.revenue
    return acc
  }, {})
  const monthlyOrdersMap = filtered.reduce<Record<string, number>>((acc, item) => {
    const monthKey = toMonthKey(item.date)
    acc[monthKey] = (acc[monthKey] || 0) + item.orders
    return acc
  }, {})

  const monthlySales = Object.keys(monthlyRevenueMap)
    .sort((a, b) => Number(a.replace('T', '')) - Number(b.replace('T', '')))
    .map((month) => ({
      month,
      sales: monthlyRevenueMap[month],
      orders: monthlyOrdersMap[month] || 0,
    }))

  const productRowsMap = filtered
    .flatMap((entry) => splitEntryByProducts(entry))
    .reduce<Record<string, ProductBreakdown>>((acc, row) => {
      if (!acc[row.productName]) {
        acc[row.productName] = { ...row }
      } else {
        acc[row.productName].units += row.units
        acc[row.productName].revenue += row.revenue
        acc[row.productName].cost += row.cost
      }
      return acc
    }, {})

  const productRows = Object.values(productRowsMap)
    .map((item) => {
      const profit = item.revenue - item.cost
      return {
        ...item,
        profit,
        margin: item.revenue === 0 ? 0 : (profit / item.revenue) * 100,
      }
    })
    .sort((a, b) => b.units - a.units)

  const topProduct = productRows[0]
  const slowProduct = productRows[productRows.length - 1]

  return {
    id: `RPT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    reportName,
    fromDate,
    toDate,
    createdAt: new Date().toLocaleString('vi-VN'),
    revenue,
    orders,
    growth,
    profitMargin,
    totalCost,
    grossProfit,
    topProductName: topProduct?.productName || '-',
    topProductUnits: topProduct?.units || 0,
    slowProductName: slowProduct?.productName || '-',
    slowProductUnits: slowProduct?.units || 0,
    categoryData,
    monthlySales,
    productRows,
  }
}

export function SalesReport() {
  const [fromDate, setFromDate] = useState('2026-01-01')
  const [toDate, setToDate] = useState('2026-12-31')
  const [error, setError] = useState('')

  const initialReport = createReport(
    '2026-01-01',
    '2026-12-31',
    'Báo cáo tổng quan năm 2026',
  )

  const [reports, setReports] = useState<GeneratedReport[]>(
    initialReport ? [initialReport] : [],
  )
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    initialReport?.id || null,
  )

  const activeReport =
    reports.find((item) => item.id === selectedReportId) || reports[0] || null

  const handleCreateReport = () => {
    setError('')

    if (!fromDate || !toDate) {
      setError('Vui lòng chọn đầy đủ Từ ngày và Đến ngày.')
      return
    }

    if (fromDate > toDate) {
      setError('Từ ngày không được lớn hơn Đến ngày.')
      return
    }

    const reportName = `BC ${formatDateLabel(fromDate)} - ${formatDateLabel(toDate)}`
    const created = createReport(fromDate, toDate, reportName)

    if (!created) {
      setError('Không có dữ liệu trong khoảng thời gian đã chọn.')
      return
    }

    setReports((prev) => [created, ...prev])
    setSelectedReportId(created.id)
  }

  if (!activeReport) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-gray-600">
        Không thể tạo báo cáo mặc định. Vui lòng kiểm tra dữ liệu đầu vào.
      </div>
    )
  }

  const monthlyTableData = activeReport.monthlySales.map((item, idx) => {
    const growth =
      idx === 0
        ? '0.0%'
        : `${(((item.sales - activeReport.monthlySales[idx - 1].sales) / activeReport.monthlySales[idx - 1].sales) * 100).toFixed(1)}%`

    return {
      ...item,
      revenueText: new Intl.NumberFormat('vi-VN').format(item.sales) + ' đ',
      orderEstimate: item.orders,
      growth,
    }
  })

  const monthlyColumns = [
    {
      key: 'month',
      label: 'Tháng',
    },
    {
      key: 'revenueText',
      label: 'Doanh thu',
    },
    {
      key: 'orderEstimate',
      label: 'Ước tính đơn',
    },
    {
      key: 'growth',
      label: 'Tăng trưởng',
      render: (val: string) => {
        const growthValue = Number(val.replace('%', ''))
        return (
          <span
            className={`font-medium ${growthValue > 0 ? 'text-green-600' : growthValue < 0 ? 'text-red-600' : 'text-gray-500'}`}
          >
            {val}
          </span>
        )
      },
    },
  ]

  const reportsColumns = [
    {
      key: 'reportName',
      label: 'Tên báo cáo',
    },
    {
      key: 'timeRange',
      label: 'Khoảng thời gian',
    },
    {
      key: 'revenueText',
      label: 'Doanh thu',
    },
    {
      key: 'ordersText',
      label: 'Đơn hàng',
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
    },
    {
      key: 'bestSellerText',
      label: 'Bán chạy nhất',
    },
    {
      key: 'slowSellerText',
      label: 'Bán ế nhất',
    },
  ]

  const reportTableData = reports.map((report) => ({
    ...report,
    timeRange: `${formatDateLabel(report.fromDate)} - ${formatDateLabel(report.toDate)}`,
    revenueText: formatCurrency(report.revenue),
    ordersText: new Intl.NumberFormat('vi-VN').format(report.orders),
    bestSellerText: `${report.topProductName} (${new Intl.NumberFormat('vi-VN').format(report.topProductUnits)} sp)`,
    slowSellerText: `${report.slowProductName} (${new Intl.NumberFormat('vi-VN').format(report.slowProductUnits)} sp)`,
  }))

  const productColumns = [
    {
      key: 'productName',
      label: 'Sản phẩm',
    },
    {
      key: 'category',
      label: 'Danh mục',
    },
    {
      key: 'unitsText',
      label: 'Số lượng bán',
    },
    {
      key: 'revenueText',
      label: 'Doanh thu',
    },
    {
      key: 'contributionText',
      label: 'Tỷ trọng',
    },
  ]

  const productTableData = activeReport.productRows.map((product) => ({
    ...product,
    unitsText: new Intl.NumberFormat('vi-VN').format(product.units),
    revenueText: formatCurrency(product.revenue),
    contributionText: `${((product.units / activeReport.orders) * 100).toFixed(1)}%`,
  }))

  const profitColumns = [
    {
      key: 'productName',
      label: 'Sản phẩm',
    },
    {
      key: 'revenueText',
      label: 'Doanh thu',
    },
    {
      key: 'costText',
      label: 'Giá vốn',
    },
    {
      key: 'profitText',
      label: 'Lợi nhuận',
      render: (val: string, row: ProductPerformance) => (
        <span className={row.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{val}</span>
      ),
    },
    {
      key: 'marginText',
      label: 'Biên lợi nhuận',
    },
  ]

  const profitTableData = [...activeReport.productRows]
    .sort((a, b) => b.profit - a.profit)
    .map((product) => ({
      ...product,
      revenueText: formatCurrency(product.revenue),
      costText: formatCurrency(product.cost),
      profitText: formatCurrency(product.profit),
      marginText: `${product.margin.toFixed(1)}%`,
    }))

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDaysIcon className="w-4 h-4 text-gold-600" />
          <p className="text-sm font-semibold text-gray-800">
            Tạo báo cáo theo thời gian
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreateReport}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors"
            >
              <FileTextIcon className="w-4 h-4" />
              Tạo báo cáo
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSignIcon}
          label="Tổng doanh thu"
          value={formatCurrency(activeReport.revenue)}
        />
        <StatCard
          icon={ShoppingCartIcon}
          label="Tổng đơn hàng"
          value={new Intl.NumberFormat('vi-VN').format(activeReport.orders)}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Tăng trưởng"
          value={`${activeReport.growth >= 0 ? '+' : ''}${activeReport.growth.toFixed(1)}%`}
        />
        <StatCard
          icon={PercentIcon}
          label="Tỷ lệ lợi nhuận"
          value={`${activeReport.profitMargin.toFixed(1)}%`}
        />
      </div>

      <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">1. Doanh thu theo thời gian</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Doanh số theo tháng ({formatDateLabel(activeReport.fromDate)} -{' '}
              {formatDateLabel(activeReport.toDate)})
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeReport.monthlySales}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 12,
                      fill: '#6b7280',
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#6b7280',
                    }}
                    tickFormatter={formatVND}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      new Intl.NumberFormat('vi-VN').format(value) + ' đ',
                      'Doanh số',
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Bar dataKey="sales" fill="#c8a45e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Theo danh mục
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeReport.categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activeReport.categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Tỷ lệ']}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-900">2. Sản phẩm bán chạy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700 font-medium">Sản phẩm bán chạy nhất</p>
            <p className="text-base text-emerald-900 font-semibold mt-1">{activeReport.topProductName}</p>
            <p className="text-sm text-emerald-700 mt-1">
              {new Intl.NumberFormat('vi-VN').format(activeReport.topProductUnits)} sản phẩm
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-700 font-medium">Sản phẩm bán ế nhất</p>
            <p className="text-base text-amber-900 font-semibold mt-1">{activeReport.slowProductName}</p>
            <p className="text-sm text-amber-700 mt-1">
              {new Intl.NumberFormat('vi-VN').format(activeReport.slowProductUnits)} sản phẩm
            </p>
          </div>
        </div>

        <DataTable
          title={`Hiệu suất sản phẩm trong báo cáo: ${activeReport.reportName}`}
          columns={productColumns}
          data={productTableData}
          searchPlaceholder="Tìm theo sản phẩm, danh mục..."
        />
      </div>

      <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-gray-900">3. Báo cáo lợi nhuận</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={DollarSignIcon} label="Doanh thu" value={formatCurrency(activeReport.revenue)} />
          <StatCard icon={ShoppingCartIcon} label="Giá vốn" value={formatCurrency(activeReport.totalCost)} />
          <StatCard icon={PercentIcon} label="Lợi nhuận gộp" value={formatCurrency(activeReport.grossProfit)} />
        </div>

        <DataTable
          title={`Chi tiết lợi nhuận theo sản phẩm: ${activeReport.reportName}`}
          columns={profitColumns}
          data={profitTableData}
          searchPlaceholder="Tìm theo sản phẩm, lợi nhuận..."
        />
      </div>

      <DataTable
        title="Danh sách báo cáo đã tạo"
        columns={reportsColumns}
        data={reportTableData}
        searchPlaceholder="Tìm theo tên báo cáo, khoảng thời gian..."
        rowActions={[
          {
            key: 'view',
            label: 'Xem',
            onClick: (row: GeneratedReport) => setSelectedReportId(row.id),
            className:
              'px-3 py-1.5 text-xs font-medium text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors',
          },
        ]}
      />

      <DataTable
        title={`Chi tiết doanh số của báo cáo: ${activeReport.reportName}`}
        columns={monthlyColumns}
        data={monthlyTableData}
        searchPlaceholder="Tìm theo tháng, doanh thu, tăng trưởng..."
      />
    </div>
  )
}
