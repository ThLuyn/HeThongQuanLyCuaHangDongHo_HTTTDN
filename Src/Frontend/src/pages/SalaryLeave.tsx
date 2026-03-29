import { useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { getSalaryApi } from '../utils/backendApi'

type SalaryRow = {
  id: string
  name: string
  baseSalary: string
  allowance: string
  leaveRemaining: number
}

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

const initialData = [
  {
    id: 'NV001',
    name: 'Nguyễn Văn An',
    baseSalary: '15.000.000 đ',
    allowance: '3.000.000 đ',
    leaveRemaining: 12,
  },
  {
    id: 'NV002',
    name: 'Trần Thị Bình',
    baseSalary: '10.000.000 đ',
    allowance: '2.000.000 đ',
    leaveRemaining: 10,
  },
  {
    id: 'NV003',
    name: 'Lê Hoàng Cường',
    baseSalary: '12.000.000 đ',
    allowance: '2.500.000 đ',
    leaveRemaining: 8,
  },
  {
    id: 'NV004',
    name: 'Phạm Minh Dũng',
    baseSalary: '9.000.000 đ',
    allowance: '1.500.000 đ',
    leaveRemaining: 5,
  },
  {
    id: 'NV005',
    name: 'Võ Thanh Hà',
    baseSalary: '10.000.000 đ',
    allowance: '2.000.000 đ',
    leaveRemaining: 11,
  },
  {
    id: 'NV006',
    name: 'Đỗ Quang Huy',
    baseSalary: '8.000.000 đ',
    allowance: '1.000.000 đ',
    leaveRemaining: 12,
  },
]
const columns = [
  {
    key: 'id',
    label: 'Mã NV',
  },
  {
    key: 'name',
    label: 'Họ tên',
  },
  {
    key: 'baseSalary',
    label: 'Lương cơ bản',
  },
  {
    key: 'allowance',
    label: 'Phụ cấp',
  },
  {
    key: 'leaveRemaining',
    label: 'Ngày nghỉ còn lại',
    render: (val: number) => (
      <span
        className={`font-medium ${val <= 5 ? 'text-red-600' : 'text-green-600'}`}
      >
        {val} ngày
      </span>
    ),
  },
]
export function SalaryLeave() {
  const [data, setData] = useState<SalaryRow[]>(initialData)
  const [month, setMonth] = useState('3')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSalary = async () => {
      try {
        setError('')
        const year = new Date().getFullYear()
        const records = await getSalaryApi(Number(month), year)
        const mapped: SalaryRow[] = records.map((row) => ({
          id: `NV${String(row.MNV).padStart(3, '0')}`,
          name: row.HOTEN,
          baseSalary: formatMoney(Number(row.LUONGCOBAN || 0)),
          allowance: formatMoney(Number(row.PHUCAP || 0)),
          leaveRemaining: Math.max(0, 12 - Math.round(Number(row.NGAYCONG || 0) / 2)),
        }))
        if (mapped.length > 0) {
          setData(mapped)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Khong the tai du lieu luong'
        setError(message)
      }
    }

    loadSalary()
  }, [month])

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Không tải được dữ liệu backend: {error}
        </div>
      )}
      <div className="flex items-center gap-4 bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100">
        <label className="text-sm font-medium text-gray-700">Tháng:</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
        >
          {Array.from(
            {
              length: 12,
            },
            (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Tháng {i + 1}
              </option>
            ),
          )}
        </select>
        <span className="text-sm text-gray-500">/ 2026</span>
      </div>
      <DataTable
        title={`Tính lương & Nghỉ phép - Tháng ${month}/2026`}
        columns={columns}
        data={data}
        searchPlaceholder="Tìm nhân viên..."
        onEdit={(row) => alert(`Chỉnh sửa lương cho ${row.name}`)}
      />
    </div>
  )
}
