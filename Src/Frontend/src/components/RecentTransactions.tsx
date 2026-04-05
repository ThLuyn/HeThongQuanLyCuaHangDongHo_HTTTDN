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
        key: 'supplier',
        label: 'Nhà cung cấp',
    },
    {
        key: 'total',
        label: 'Tổng tiền',
        render: (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`,
    },
    {
        key: 'status',
        label: 'Trạng thái',
    },
    {
        key: 'time',
        label: 'Thời gian',
        render: (_value, row) => row.timeText,
    },
];
export function RecentTransactions({ data }) {
    const transactionData = data.slice(0, 10).map((item) => {
        const date = new Date(item.time);
        const normalizedId = normalizeTransactionId(item.id, item.type);
        return {
            id: normalizedId,
            type: item.type || '-',
            supplier: item.customer || '-',
            total: Number(item.total || 0),
            status: item.status || '-',
            time: Number.isNaN(date.getTime())
                ? String(item.time || '')
                : date.toISOString(),
            timeText: Number.isNaN(date.getTime())
                ? String(item.time || '')
                : date.toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }),
        };
    });
    return (<DataTable
        title="Giao dịch gần đây"
        columns={transactionColumns}
        data={transactionData}
        searchPlaceholder="Tìm mã giao dịch, nhà cung cấp, thời gian..."
        advancedFilterKeys={['id', 'type', 'supplier', 'total', 'status', 'time']}
        forceSelectFilterKeys={['supplier', 'type', 'status']}
        rangeFilterKeys={[
            {
                key: 'total',
                inputType: 'number',
                minPlaceholder: 'Từ tổng tiền',
                maxPlaceholder: 'Đến tổng tiền',
            },
            {
                key: 'time',
                inputType: 'date',
                minPlaceholder: 'Từ ngày',
                maxPlaceholder: 'Đến ngày',
            },
        ]}
    />);
}
