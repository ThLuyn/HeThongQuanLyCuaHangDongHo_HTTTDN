// @ts-nocheck
import React, { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
const initialReceipts = [
    {
        id: 'PXH001',
        date: '22/03/2026',
        customer: 'Nguyễn Văn A',
        total: '7.500.000 đ',
        status: 'Hoàn thành',
    },
    {
        id: 'PXH002',
        date: '21/03/2026',
        customer: 'Trần Thị B',
        total: '12.300.000 đ',
        status: 'Hoàn thành',
    },
    {
        id: 'PXH003',
        date: '20/03/2026',
        customer: 'Lê Hoàng C',
        total: '5.200.000 đ',
        status: 'Đang giao',
    },
    {
        id: 'PXH004',
        date: '19/03/2026',
        customer: 'Phạm Minh D',
        total: '18.900.000 đ',
        status: 'Hoàn thành',
    },
    {
        id: 'PXH005',
        date: '18/03/2026',
        customer: 'Võ Thanh E',
        total: '9.800.000 đ',
        status: 'Đã hủy',
    },
];
const columns = [
    {
        key: 'id',
        label: 'Mã phiếu',
    },
    {
        key: 'date',
        label: 'Ngày xuất',
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
        key: 'status',
        label: 'Trạng thái',
        render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Hoàn thành' ? 'bg-green-100 text-green-700' : val === 'Đang giao' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
        {val}
      </span>),
    },
];
export function ExportReceipts() {
    const [receipts, setReceipts] = useState(initialReceipts);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        id: '',
        date: '',
        customer: '',
        total: '',
        status: 'Đang giao',
    });
    const openAdd = () => {
        setForm({
            id: `PXH${String(receipts.length + 1).padStart(3, '0')}`,
            date: '23/03/2026',
            customer: '',
            total: '',
            status: 'Đang giao',
        });
        setModalOpen(true);
    };
    const handleSave = () => {
        if (!form.customer || !form.total)
            return;
        setReceipts((prev) => [
            ...prev,
            {
                ...form,
            },
        ]);
        setModalOpen(false);
    };
    const handleDelete = (r) => {
        if (confirm(`Xóa phiếu xuất ${r.id}?`)) {
            setReceipts((prev) => prev.filter((x) => x.id !== r.id));
        }
    };
    return (<>
      <DataTable title="Phiếu xuất hàng" columns={columns} data={receipts} searchPlaceholder="Tìm phiếu xuất..." onAdd={openAdd} onDelete={handleDelete} addLabel="Tạo phiếu xuất"/>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tạo phiếu xuất hàng">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã phiếu
              </label>
              <input value={form.id} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày xuất
              </label>
              <input value={form.date} onChange={(e) => setForm({
            ...form,
            date: e.target.value,
        })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khách hàng *
            </label>
            <input value={form.customer} onChange={(e) => setForm({
            ...form,
            customer: e.target.value,
        })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tổng tiền *
            </label>
            <input value={form.total} onChange={(e) => setForm({
            ...form,
            total: e.target.value,
        })} placeholder="VD: 10.000.000 đ" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors">
              Tạo phiếu
            </button>
          </div>
        </div>
      </Modal>
    </>);
}
