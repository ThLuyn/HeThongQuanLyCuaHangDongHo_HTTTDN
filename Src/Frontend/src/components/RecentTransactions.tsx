// @ts-nocheck
import { DataTable } from './DataTable';

function normalizeTransactionId(rawId, type) {
    const id = String(rawId || '').trim();
    const upperId = id.toUpperCase();
    if (!upperId.startsWith('HD'))
        return id;

    const numeric = upperId.replace(/\D/g, '');
    if (!numeric)
        return id;

    const prefix = String(type || '').toLowerCase().includes('nhập') ? 'PNK' : 'PXK';
    return `${prefix}${numeric.padStart(4, '0')}`;
}

const transactionColumns = [
    {
        key: 'id',
        label: 'Mã giao dịch',
    },
    {
        key: 'type',
        label: 'Loại',
    },
    {
        key: 'customer',
        label: 'Đối tượng',
    },
    {
        key: 'total',
        label: 'Tổng tiền',
    },
    {
        key: 'status',
        label: 'Trạng thái',
    },
    {
        key: 'time',
        label: 'Thời gian',
    },
];
export function RecentTransactions({ data }) {
    const transactionData = data.slice(0, 10).map((item) => {
        const date = new Date(item.time);
        const normalizedId = normalizeTransactionId(item.id, item.type);
        return {
            id: normalizedId,
            type: item.type || '-',
            customer: item.customer,
            total: `${new Intl.NumberFormat('vi-VN').format(Number(item.total || 0))} đ`,
            status: item.status || '-',
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
    return (<DataTable title="Giao dịch gần đây" columns={transactionColumns} data={transactionData} searchPlaceholder="Tìm mã giao dịch, đối tượng, thời gian..."/>);
}
