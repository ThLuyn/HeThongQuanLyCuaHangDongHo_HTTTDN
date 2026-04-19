// @ts-nocheck
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DataTable } from '../components/DataTable'
import { Modal } from '../components/Modal'
import {
    createPermissionApi,
    deletePermissionApi,
    getPermissionGroupDetailApi,
    getPermissionMetaApi,
    getPermissionsApi,
    getUserAccountsApi,
    updatePermissionApi,
} from '../utils/backendApi'

const EMPTY_FORM = {
  roleName: '',
}

const columns = [
  {
    key: 'mnq',
    label: 'Mã nhóm quyền',
  },
  {
    key: 'roleName',
    label: 'Tên nhóm quyền',
  },
  {
    key: 'status',
    label: 'Trạng thái',
    render: (value) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${Number(value) === 1
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'}`}
      >
        {Number(value) === 1 ? 'Hoạt động' : 'Ngưng hoạt động'}
      </span>
    ),
  },
]

export function PermissionManagement() {
  const [groups, setGroups] = useState([])
  const [features, setFeatures] = useState([])
  const [actions, setActions] = useState([])
  const [matrix, setMatrix] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const createEmptyMatrix = (featureRows, actionRows) => {
    const next = {}
    featureRows.forEach((feature) => {
      next[feature.mcn] = {}
      actionRows.forEach((action) => {
        next[feature.mcn][action.key] = false
      })
    })
    return next
  }

  const normalizeMatrixFromPermissions = (featureRows, actionRows, permissions) => {
    const next = createEmptyMatrix(featureRows, actionRows)
    ;(permissions || []).forEach((item) => {
      const mcn = String(item.mcn || '').toLowerCase()
      const assignedActions = Array.isArray(item.actions) ? item.actions : []
      if (!next[mcn]) return
      assignedActions.forEach((action) => {
        const key = String(action || '').toLowerCase()
        if (next[mcn][key] != null) {
          next[mcn][key] = true
        }
      })
    })
    return next
  }

  const buildPermissionsPayload = () => {
    return features
      .map((feature) => {
        const row = matrix[feature.mcn] || {}
        const selected = actions
          .map((action) => action.key)
          .filter((key) => Boolean(row[key]))
        return {
          mcn: feature.mcn,
          actions: selected,
        }
      })
      .filter((item) => item.actions.length > 0)
  }

  const loadData = async () => {
    setError('')
    setLoading(true)
    try {
      const [groupRows, meta] = await Promise.all([
        getPermissionsApi(),
        getPermissionMetaApi(),
      ])
      const featureRows = meta.features || []
      const actionRows = meta.actions || []

      setGroups(groupRows)
      setFeatures(featureRows)
      setActions(actionRows)
      setMatrix(createEmptyMatrix(featureRows, actionRows))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu phân quyền')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ roleName: '' })
    setMatrix(createEmptyMatrix(features, actions))
    setIsFormOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const detail = await getPermissionGroupDetailApi(Number(row.mnq))
      setEditing(row)
      setForm({
        roleName: detail.roleName || row.roleName || '',
      })
      setMatrix(normalizeMatrixFromPermissions(features, actions, detail.permissions))
      setIsFormOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được chi tiết nhóm quyền')
    }
  }

  const openView = async (row) => {
    try {
      const detail = await getPermissionGroupDetailApi(Number(row.mnq))
      setEditing(row)
      setForm({
        roleName: detail.roleName || row.roleName || '',
      })
      setMatrix(normalizeMatrixFromPermissions(features, actions, detail.permissions))
      setIsViewOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được chi tiết nhóm quyền')
    }
  }

  const closeView = () => {
    setIsViewOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const toggleMatrix = (mcn, actionKey) => {
    setMatrix((prev) => ({
      ...prev,
      [mcn]: {
        ...(prev[mcn] || {}),
        [actionKey]: !Boolean(prev[mcn]?.[actionKey]),
      },
    }))
  }

  const submitForm = async (e) => {
    e.preventDefault()
    if (!form.roleName.trim()) {
      setError('Vui lòng nhập tên nhóm quyền')
      return
    }

    const payload = {
      roleName: form.roleName.trim(),
      permissions: buildPermissionsPayload(),
    }

    try {
      setSaving(true)
      setError('')

      if (editing) {
        await updatePermissionApi(Number(editing.mnq), payload)
      } else {
        await createPermissionApi(payload)
      }

      closeForm()
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu nhóm quyền')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    // Cấm xóa nhóm quyền MNQ = 1 (Quản lý cửa hàng)
    if (Number(row.mnq) === 1) {
      alert('Không thể xóa nhóm quyền Quản lý cửa hàng!')
      return
    }

    // Kiểm tra nhóm có tài khoản nào đang dùng không
    try {
      const allUsers = await getUserAccountsApi()
      const usersInGroup = allUsers.filter((u) => Number(u.mnq) === Number(row.mnq))
      if (usersInGroup.length > 0) {
        alert(`Không thể xóa nhóm quyền "${row.roleName}" vì đang có ${usersInGroup.length} tài khoản sử dụng nhóm quyền này!`)
        return
      }
    } catch (e) {
      alert('Không kiểm tra được danh sách tài khoản. Vui lòng thử lại.')
      return
    }

    const confirmDelete = window.confirm(`Chuyển nhóm quyền "${row.roleName}" sang trạng thái ngưng hoạt động?`)
    if (!confirmDelete) return

    try {
      setError('')
      await deletePermissionApi(Number(row.mnq))
      await loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xóa nhóm quyền')
    }
  }

  const MatrixTable = ({ readonly = false }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-800">Danh mục chức năng</th>
            {actions.map((action) => (
              <th key={action.key} className="px-3 py-2 text-center text-sm font-semibold text-gray-800">
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {features.map((feature) => {
            const isUserMgmt = String(feature.mcn).toLowerCase() === 'taikhoan'
            // Khi edit nhóm MNQ=1, dòng "Quản lý tài khoản" hiện nhưng không cho sửa
            const isProtected = !readonly && isUserMgmt && editing && Number(editing.mnq) === 1
            return (
              <tr key={feature.mcn} className={isProtected ? 'bg-gray-50' : ''}>
                <td className="px-3 py-2 text-sm text-gray-700">
                  {feature.name}
                  {isProtected && (
                    <span className="ml-2 text-xs text-gray-400 italic"></span>
                  )}
                </td>
                {actions.map((action) => (
                  <td key={`${feature.mcn}-${action.key}`} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(matrix[feature.mcn]?.[action.key])}
                      onChange={() => !isProtected && toggleMatrix(feature.mcn, action.key)}
                      disabled={readonly || isProtected}
                      title={isProtected ? 'Không thể thay đổi quyền Quản lý tài khoản của nhóm này' : undefined}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-gray-600 shadow-sm">
          Đang tải dữ liệu phân quyền...
        </div>
      ) : (
        <DataTable
          title="Phân quyền hệ thống"
          columns={columns}
          data={groups}
          searchPlaceholder="Tìm kiếm..."
          advancedFilterKeys={['mnq', 'roleName', 'status']}
          forceSelectFilterKeys={['roleName', 'status']}
          onAdd={openCreate}
          addLabel="Thêm nhóm quyền"
          rowActions={[
            {
              key: 'view',
              label: 'Xem',
              onClick: openView,
              className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
            },
            {
              key: 'edit',
              label: 'Sửa',
              onClick: openEdit,
              className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
            },
            {
              key: 'delete',
              label: 'Xóa',
              onClick: handleDelete,
              hidden: (row) => Number(row.status) !== 1,
              className: 'p-1.5 rounded-lg transition-colors',
              render: (row) => {
                const isDisabled = Number(row.mnq) === 1
                return (
                  <span
                    title={isDisabled ? 'Không thể xóa nhóm quyền Quản lý cửa hàng' : 'Xóa'}
                    onClick={isDisabled ? (e) => e.stopPropagation() : undefined}
                    style={isDisabled ? { pointerEvents: 'auto', cursor: 'not-allowed' } : {}}
                  >
                    <Trash2 className={`h-4 w-4 ${isDisabled ? 'text-gray-300' : 'text-red-500'}`} />
                  </span>
                )
              },
            },
          ]}
        />
      )}

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editing ? 'Cập nhật nhóm quyền' : 'Thêm nhóm quyền'} size="xl">
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên nhóm quyền</label>
            <input
              type="text"
              value={form.roleName}
              onChange={(e) => setForm((prev) => ({ ...prev, roleName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Nhập tên nhóm quyền"
            />
          </div>

          <MatrixTable />

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu nhóm quyền' : 'Thêm nhóm quyền'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewOpen} onClose={closeView} title="Xem chi tiết nhóm quyền" size="xl">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên nhóm quyền</label>
            <input value={form.roleName} disabled className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
          </div>

          <MatrixTable readonly />

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={closeView}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PermissionManagement