// @ts-nocheck
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
function formatVND(value) {
    if (value >= 1000000)
        return `${(value / 1000000).toFixed(0)}tr`;
    if (value >= 1000)
        return `${(value / 1000).toFixed(0)}k`;
    return String(value);
}
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload)
        return null;
    return (<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        Tháng {label?.replace('T', '')}
      </p>
      {payload.map((entry, idx) => (<p key={idx} className="text-sm" style={{
                color: entry.color,
            }}>
          {entry.name}: {new Intl.NumberFormat('vi-VN').format(entry.value)} đ
        </p>))}
    </div>);
}
export function ProfitChart({ data }) {
    return (<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Biểu đồ Lợi nhuận
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
            fontSize: 12,
            fill: '#6b7280',
        }}/>
            <YAxis axisLine={false} tickLine={false} tick={{
            fontSize: 11,
            fill: '#6b7280',
        }} tickFormatter={formatVND}/>
            <Tooltip content={<CustomTooltip />}/>
            <Legend iconType="rect" wrapperStyle={{
            fontSize: 13,
            paddingTop: 8,
        }}/>
            <Bar dataKey="revenue" name="Doanh thu" fill="#c8a45e" radius={[4, 4, 0, 0]}/>
            <Bar dataKey="profit" name="Lợi nhuận" fill="#2dd4bf" radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>);
}
