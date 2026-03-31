// @ts-nocheck
import React, { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
const initialUsers = [
    {
        username: 'admin',
        name: 'Quản trị viên',
        role: 'Admin',
        status: 'Hoạt động',
        createdAt: '01/01/2024',
    },
    {
        username: 'nguyenva',
        name: 'Nguyễn Văn An',
        role: 'Quản lý',
        status: 'Hoạt động',
        createdAt: '15/03/2024',
    },
    {
        username: 'trantb',
        name: 'Trần Thị Bình',
        role: 'Nhân viên',
        status: 'Hoạt động',
        createdAt: '20/05/2024',
    },
    {
        username: 'lehc',
        name: 'Lê Hoàng Cường',
        role: 'Kế toán',
        status: 'Hoạt động',
        createdAt: '10/07/2024',
    },
    {
        username: 'phammd',
        name: 'Phạm Minh Dũng',
        role: 'Nhân viên',
        status: 'Khóa',
        createdAt: '01/09/2024',
    },
];
const columns = [
    {
        key: 'username',
        label: 'Username',
    },
    {
        key: 'name',
        label: 'Họ tên',
    },
    {
        key: 'role',
        label: 'Vai trò',
        render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Admin' ? 'bg-purple-100 text-purple-700' : val === 'Quản lý' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
        {val}
      </span>),
    },
    {
        key: 'status',
        label: 'Trạng thái',
        render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {val}
      </span>),
    },
    {
        key: 'createdAt',
        label: 'Ngày tạo',
    },
];
export function UserManagement() {
    const [users, setUsers] = useState(initialUsers);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        username: '',
        name: '',
        role: 'Nhân viên',
        status: 'Hoạt động',
        createdAt: '23/03/2026',
    });
    const openAdd = () => {
        setEditing(null);
        setForm({
            username: '',
            name: '',
            role: 'Nhân viên',
            status: 'Hoạt động',
            createdAt: '23/03/2026',
        });
        setModalOpen(true);
    };
    const openEdit = (u) => {
        setEditing(u);
        setForm({
            ...u,
        });
        setModalOpen(true);
    };
    const handleSave = () => {
        if (!form.username || !form.name)
            return;
        if (editing) {
            setUsers((prev) => prev.map((u) => u.username === editing.username
                ? {
                    ...form,
                }
                : u));
        }
        else {
            setUsers((prev) => [
                ...prev,
                {
                    ...form,
                },
            ]);
        }
        setModalOpen(false);
    };
    const handleDelete = (u) => {
        if (u.username === 'admin') {
            alert('Không thể xóa tài khoản Admin!');
            return;
        }
        if (confirm(`Xóa user "${u.username}"?`)) {
            setUsers((prev) => prev.filter((x) => x.username !== u.username));
        }
    };
    return (<>
      <DataTable title="Quản lý User" columns={columns} data={users} searchPlaceholder="Tìm user..." onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} addLabel="Thêm user"/>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa user' : 'Thêm user'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input value={form.username} onChange={(e) => setForm({
            ...form,
            username: e.target.value,
        })} disabled={!!editing} className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${editing ? 'bg-gray-50' : ''}`}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên *
            </label>
            <input value={form.name} onChange={(e) => setForm({
            ...form,
            name: e.target.value,
        })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <select value={form.role} onChange={(e) => setForm({
            ...form,
            role: e.target.value,
        })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                <option>Admin</option>
                <option>Quản lý</option>
                <option>Kế toán</option>
                <option>Nhân viên</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select value={form.status} onChange={(e) => setForm({
            ...form,
            status: e.target.value,
        })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                <option>Hoạt động</option>
                <option>Khóa</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors">
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </>);
}
