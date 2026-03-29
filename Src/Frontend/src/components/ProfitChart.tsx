import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
const chartData = [
  {
    month: 'T1',
    revenue: 25000000,
    profit: 8000000,
  },
  {
    month: 'T2',
    revenue: 30000000,
    profit: 10000000,
  },
  {
    month: 'T3',
    revenue: 35000000,
    profit: 12000000,
  },
  {
    month: 'T4',
    revenue: 42000000,
    profit: 15000000,
  },
  {
    month: 'T5',
    revenue: 48000000,
    profit: 18000000,
  },
  {
    month: 'T6',
    revenue: 55000000,
    profit: 22000000,
  },
  {
    month: 'T7',
    revenue: 65000000,
    profit: 28000000,
  },
  {
    month: 'T8',
    revenue: 80000000,
    profit: 35000000,
  },
  {
    month: 'T9',
    revenue: 95000000,
    profit: 42000000,
  },
  {
    month: 'T10',
    revenue: 110000000,
    profit: 50000000,
  },
  {
    month: 'T11',
    revenue: 130000000,
    profit: 58000000,
  },
  {
    month: 'T12',
    revenue: 150000000,
    profit: 68000000,
  },
]
function formatVND(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}tr`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
  return String(value)
}
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        Tháng {label?.replace('T', '')}
      </p>
      {payload.map((entry: any, idx: number) => (
        <p
          key={idx}
          className="text-sm"
          style={{
            color: entry.color,
          }}
        >
          {entry.name}: {new Intl.NumberFormat('vi-VN').format(entry.value)} đ
        </p>
      ))}
    </div>
  )
}
export function ProfitChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Biểu đồ Lợi nhuận
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="rect"
              wrapperStyle={{
                fontSize: 13,
                paddingTop: 8,
              }}
            />
            <Bar
              dataKey="revenue"
              name="Doanh thu"
              fill="#c8a45e"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="profit"
              name="Lợi nhuận"
              fill="#2dd4bf"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
