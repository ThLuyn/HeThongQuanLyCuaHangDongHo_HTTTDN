import { DataTable } from './DataTable'

const transactionData = [
  {
    id: 'HD001',
    customer: 'Nguyễn Văn A',
    total: '7.500.000 đ',
    time: '10:00 AM',
  },
  {
    id: 'HD002',
    customer: 'Trần Thị B',
    total: '12.300.000 đ',
    time: '09:45 AM',
  },
  {
    id: 'HD003',
    customer: 'Lê Hoàng C',
    total: '5.200.000 đ',
    time: '09:30 AM',
  },
  {
    id: 'HD004',
    customer: 'Phạm Minh D',
    total: '18.900.000 đ',
    time: '09:15 AM',
  },
  {
    id: 'HD005',
    customer: 'Võ Thanh E',
    total: '9.800.000 đ',
    time: '08:50 AM',
  },
]

const transactionColumns = [
  {
    key: 'id',
    label: 'Mã hóa đơn',
  },
  {
    key: 'customer',
    label: 'Khách hàng',
  },
  {
    key: 'total',
    label: 'Tổng tiền',
  },
  {
    key: 'time',
    label: 'Thời gian',
  },
]

export function RecentTransactions() {
  return (
    <DataTable
      title="Giao dịch gần đây"
      columns={transactionColumns}
      data={transactionData}
      searchPlaceholder="Tìm mã hóa đơn, khách hàng, thời gian..."
    />
  )
}
