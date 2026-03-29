import { useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { getEmployeesApi } from '../utils/backendApi'
interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  status: string
}
const initialEmployees: Employee[] = [
  {
    id: 'NV001',
    name: 'Nguyễn Văn An',
    position: 'Quản lý',
    phone: '0901234567',
    email: 'an.nv@sguwatch.vn',
    status: 'Đang làm',
  },
  {
    id: 'NV002',
    name: 'Trần Thị Bình',
    position: 'Nhân viên bán hàng',
    phone: '0912345678',
    email: 'binh.tt@sguwatch.vn',
    status: 'Đang làm',
  },
  {
    id: 'NV003',
    name: 'Lê Hoàng Cường',
    position: 'Kế toán',
    phone: '0923456789',
    email: 'cuong.lh@sguwatch.vn',
    status: 'Đang làm',
  },
  {
    id: 'NV004',
    name: 'Phạm Minh Dũng',
    position: 'Nhân viên kho',
    phone: '0934567890',
    email: 'dung.pm@sguwatch.vn',
    status: 'Nghỉ phép',
  },
  {
    id: 'NV005',
    name: 'Võ Thanh Hà',
    position: 'Nhân viên bán hàng',
    phone: '0945678901',
    email: 'ha.vt@sguwatch.vn',
    status: 'Đang làm',
  },
  {
    id: 'NV006',
    name: 'Đỗ Quang Huy',
    position: 'Bảo vệ',
    phone: '0956789012',
    email: 'huy.dq@sguwatch.vn',
    status: 'Đang làm',
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
    key: 'position',
    label: 'Chức vụ',
  },
  {
    key: 'phone',
    label: 'SĐT',
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (val: string) => (
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Đang làm' ? 'bg-green-100 text-green-700' : val === 'Nghỉ phép' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
      >
        {val}
      </span>
    ),
  },
]
export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form, setForm] = useState({
    id: '',
    name: '',
    position: '',
    phone: '',
    email: '',
    status: 'Đang làm',
  })

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setError('')
        const rows = await getEmployeesApi()
        const mapped: Employee[] = rows.map((row) => ({
          id: `NV${String(row.MNV).padStart(3, '0')}`,
          name: row.HOTEN,
          position: row.TENCHUCVU,
          phone: row.SDT,
          email: row.EMAIL,
          status: row.TT === 1 ? 'Đang làm' : 'Đã nghỉ',
        }))
        setEmployees(mapped)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Khong the tai danh sach nhan vien'
        setError(message)
      }
    }

    loadEmployees()
  }, [])
  const openAdd = () => {
    setEditingEmployee(null)
    setForm({
      id: `NV${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      position: '',
      phone: '',
      email: '',
      status: 'Đang làm',
    })
    setModalOpen(true)
  }
  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setForm({
      ...emp,
    })
    setModalOpen(true)
  }
  const handleSave = () => {
    if (!form.name || !form.position) return
    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingEmployee.id
            ? {
                ...form,
              }
            : e,
        ),
      )
    } else {
      setEmployees((prev) => [
        ...prev,
        {
          ...form,
        },
      ])
    }
    setModalOpen(false)
  }
  const handleDelete = (emp: Employee) => {
    if (confirm(`Bạn có chắc muốn xóa nhân viên ${emp.name}?`)) {
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id))
    }
  }
  return (
    <>
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Không tải được dữ liệu backend: {error}
        </div>
      )}
      <DataTable
        title="Danh sách nhân viên"
        columns={columns}
        data={employees}
        searchPlaceholder="Tìm nhân viên..."
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        addLabel="Thêm nhân viên"
      />
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã NV
            </label>
            <input
              value={form.id}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên *
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chức vụ *
            </label>
            <input
              value={form.position}
              onChange={(e) =>
                setForm({
                  ...form,
                  position: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SĐT
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option>Đang làm</option>
              <option>Nghỉ phép</option>
              <option>Đã nghỉ</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
