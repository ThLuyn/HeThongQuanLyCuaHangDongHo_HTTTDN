// @ts-nocheck
import { DataTable } from './DataTable';
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
];
export function RecentTransactions({ data }) {
    const transactionData = data.slice(0, 10).map((item) => {
        const date = new Date(item.time);
        return {
            id: item.id,
            customer: item.customer,
            total: `${new Intl.NumberFormat('vi-VN').format(Number(item.total || 0))} đ`,
            time: Number.isNaN(date.getTime())
                ? String(item.time)
                : date.toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }),
        };
    });
    return (<DataTable title="Giao dịch gần đây" columns={transactionColumns} data={transactionData} searchPlaceholder="Tìm mã hóa đơn, khách hàng, thời gian..."/>);
}
