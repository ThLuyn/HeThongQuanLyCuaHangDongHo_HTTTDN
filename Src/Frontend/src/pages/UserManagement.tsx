// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { createUserAccountApi, deleteUserAccountApi, getUserAccountsApi, getUserMetaApi, updateUserAccountApi } from '../utils/backendApi';

const columns = [
    {
        key: 'username',
        label: 'Username',
    },
    {
        key: 'fullName',
        label: 'Họ tên',
    },
    {
        key: 'roleName',
        label: 'Vai trò',
        render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${String(val || '').toLowerCase().includes('quản lý')
                ? 'bg-indigo-100 text-indigo-700'
                : String(val || '').toLowerCase().includes('kinh doanh')
                    ? 'bg-blue-100 text-blue-700'
                    : String(val || '').toLowerCase().includes('kho')
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'}`}>
        {val}
      </span>),
    },
    {
        key: 'status',
        label: 'Trạng thái',
        render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(val) === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {Number(val) === 1 ? 'Hoạt động' : 'Khóa'}
      </span>),
    },
    {
        key: 'startDateText',
        label: 'Ngày vào làm',
    },
];
export function UserManagement() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        mnv: '',
        username: '',
        password: '',
        mnq: '',
        status: 1,
        newPassword: '',
    });

    const roleById = useMemo(() => Object.fromEntries(roles.map((item) => [Number(item.mnq), item.name])), [roles]);

    const loadData = async () => {
        setError('');
        try {
            setLoading(true);
            const [userRows, meta] = await Promise.all([getUserAccountsApi(), getUserMetaApi()]);
            setUsers(userRows);
            setRoles(meta.roles || []);
            setEmployees(meta.availableEmployees || []);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được dữ liệu user');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const tableUsers = users.map((u) => {
        const date = new Date(u.startDate);
        return {
            ...u,
            startDateText: Number.isNaN(date.getTime())
                ? '-'
                : date.toLocaleDateString('vi-VN'),
        };
    });

    const openAdd = () => {
        setEditing(null);
        setForm({
            mnv: employees[0]?.mnv ? String(employees[0].mnv) : '',
            username: '',
            password: '',
            mnq: roles[0]?.mnq ? String(roles[0].mnq) : '',
            status: 1,
            newPassword: '',
        });
        setModalOpen(true);
    };
    const openEdit = (u) => {
        setEditing(u);
        setForm({
            mnv: String(u.mnv),
            username: u.username,
            password: '',
            mnq: String(u.mnq),
            status: Number(u.status) === 1 ? 1 : 0,
            newPassword: '',
        });
        setModalOpen(true);
    };
    const handleSave = async () => {
        if (!form.username.trim()) {
            alert('Vui lòng nhập username');
            return;
        }
      if (!form.mnq) {
        alert('Vui lòng chọn vai trò');
        return;
      }
      if (!editing && !form.mnv) {
        alert('Vui lòng chọn nhân viên');
        return;
      }
        if (!editing && form.password.trim().length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setSubmitting(true);
            if (editing) {
                await updateUserAccountApi(Number(editing.mnv), {
                    mnq: Number(form.mnq),
                    status: Number(form.status),
                    ...(form.newPassword.trim() ? { newPassword: form.newPassword.trim() } : {}),
                });
            }
            else {
                await createUserAccountApi({
                    mnv: Number(form.mnv),
                    username: form.username.trim(),
                    password: form.password.trim(),
                    mnq: Number(form.mnq),
                    status: Number(form.status),
                });
            }

            setModalOpen(false);
            await loadData();
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'Không lưu được user');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (u) => {
        if (confirm(`Xóa user "${u.username}"?`)) {
            try {
                await deleteUserAccountApi(Number(u.mnv));
                await loadData();
            }
            catch (e) {
                alert(e instanceof Error ? e.message : 'Không xóa được user');
            }
        }
    };

    return (<>
      {error ? (<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>) : null}

      <DataTable title="Quản lý User" columns={columns} data={tableUsers} searchPlaceholder="Tìm user..." onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} addLabel="Thêm user"/>

      {loading ? (<div className="mt-3 text-sm text-gray-500">Đang tải dữ liệu...</div>) : null}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Sửa user' : 'Thêm user'}>
        <div className="space-y-4">
          {!editing ? (<div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhân viên *
              </label>
              <select value={form.mnv} onChange={(e) => setForm({
                ...form,
                mnv: e.target.value,
            })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                <option value="">Chọn nhân viên</option>
                {employees.map((item) => (<option key={item.mnv} value={String(item.mnv)}>
                    {item.fullName} (MNV: {item.mnv})
                  </option>))}
              </select>
            </div>) : (<div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên
              </label>
              <input value={editing.fullName} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"/>
            </div>)}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input value={form.username} onChange={(e) => setForm({
            ...form,
            username: e.target.value,
        })} disabled={!!editing} className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${editing ? 'bg-gray-50' : ''}`}/>
          </div>

          {!editing ? (<div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu *
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({
                ...form,
                password: e.target.value,
            })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
            </div>) : (<div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới (để trống nếu không đổi)
              </label>
              <input type="password" value={form.newPassword} onChange={(e) => setForm({
                ...form,
                newPassword: e.target.value,
            })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
            </div>)}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select value={form.mnq} onChange={(e) => setForm({
                ...form,
                mnq: e.target.value,
            })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
              {roles.map((role) => (<option key={role.mnq} value={String(role.mnq)}>
                  {role.name}
                </option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select value={String(form.status)} onChange={(e) => setForm({
                ...form,
                status: Number(e.target.value),
            })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
              <option value="1">Hoạt động</option>
              <option value="0">Khóa</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button onClick={handleSave} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors disabled:opacity-60">
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>
    </>);
}
