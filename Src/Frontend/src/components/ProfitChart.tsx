// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
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
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        Tháng {label?.replace('T', '')}
      </p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {new Intl.NumberFormat('vi-VN').format(entry.value)} đ
        </p>
      ))}
    </div>
  );
}

// Wrapper skeleton dùng chung cho các trạng thái chờ / rỗng
function ChartShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Biểu đồ Lợi nhuận
      </h3>
      {children}
    </div>
  );
}

export function ProfitChart({ data }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // isReady: true khi ResizeObserver xác nhận container có kích thước > 0.
  // Tránh Recharts đọc width/height = -1 khi container chưa layout xong
  // (thường xảy ra khi render bên trong tab ẩn, flex chưa settle, hoặc
  //  component cha dùng display:none / overflow:hidden ban đầu).
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Nếu container đã có kích thước ngay lập tức (trường hợp thông thường)
    // thì set ready trong cùng frame — không delay UI.
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      setIsReady(true);
      return;
    }

    // Ngược lại, dùng ResizeObserver để chờ layout xong
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setIsReady(true);
        observer.disconnect(); // chỉ cần kích hoạt 1 lần
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Guard: data rỗng ────────────────────────────────────────────────────────
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <ChartShell>
        <div
          className="flex items-center justify-center"
          style={{ height: 320 }}
        >
          <span className="text-gray-400">Không có dữ liệu biểu đồ</span>
        </div>
      </ChartShell>
    );
  }

  return (
    <ChartShell>
      {/* ref đặt trên div này — ResizeObserver đo đúng vùng chart */}
      <div ref={containerRef} style={{ width: '100%', height: 320, minWidth: 0 }}>
        {/* Chỉ mount ResponsiveContainer khi container đã có kích thước thực.
            Điều này loại bỏ hoàn toàn cảnh báo width/height = -1 của Recharts. */}
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={formatVND}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="rect" wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#c8a45e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Lợi nhuận" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          // Placeholder giữ đúng chiều cao trong lúc chờ layout
          <div style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </ChartShell>
  );
}