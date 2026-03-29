import {
    ArrowUpDownIcon,
    ChevronDownIcon,
    EyeIcon,
    FilterIcon,
    PencilIcon,
    PlusIcon,
    SearchIcon,
    Trash2Icon,
    XIcon,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
}

interface RowActionConfig {
  key: string
  label: string
  onClick: (row: any) => void
  className?: string
}

interface DataTableProps {
  title: string
  columns: Column[]
  data: any[]
  searchPlaceholder?: string
  onAdd?: () => void
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  addLabel?: string
  rowActions?: RowActionConfig[]
  advancedFilterKeys?: string[]
  emptyState?: React.ReactNode
}

function normalizeString(value: any): string {
  if (value == null) return ''
  return String(value).trim().toLowerCase()
}

function parseComparableValue(value: any): string | number {
  if (typeof value === 'number') return value
  if (value == null) return ''

  const raw = String(value).trim()

  const dateTimeMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  )
  if (dateTimeMatch) {
    const [, d, m, y, hh = '0', mm = '0'] = dateTimeMatch
    const timestamp = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
    ).getTime()
    return Number.isNaN(timestamp) ? raw.toLowerCase() : timestamp
  }

  const numericCandidate = raw.replace(/\./g, '').replace(/[^\d-]/g, '')
  if (numericCandidate && /^-?\d+$/.test(numericCandidate)) {
    return Number(numericCandidate)
  }

  return raw.toLowerCase()
}

export function DataTable({
  title,
  columns,
  data,
  searchPlaceholder = 'Tìm kiếm...',
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Thêm mới',
  rowActions,
  advancedFilterKeys,
  emptyState,
}: DataTableProps) {
  const [search, setSearch] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<string>(columns[0]?.key || '')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const defaultRowActions = useMemo(() => {
    const actions: RowActionConfig[] = []

    if (onEdit) {
      actions.push({
        key: 'edit',
        label: 'Sửa',
        onClick: onEdit,
        className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
      })
    }

    if (onDelete) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        onClick: onDelete,
        className: 'p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors',
      })
    }

    return actions
  }, [onDelete, onEdit])

  const actionsToRender = rowActions ?? defaultRowActions

  const advancedFilterColumns = useMemo(() => {
    const sourceColumns =
      advancedFilterKeys && advancedFilterKeys.length > 0
        ? columns.filter((col) => advancedFilterKeys.includes(col.key))
        : columns

    return sourceColumns.filter((col) => {
      const values = new Set(
        data
          .map((row) => row[col.key])
          .filter((value) => value != null)
          .map((value) => String(value).trim()),
      )
      return values.size > 0
    })
  }, [advancedFilterKeys, columns, data])

  const filterOptions = useMemo(() => {
    return advancedFilterColumns.reduce<Record<string, string[]>>((acc, col) => {
      const values = Array.from(
        new Set(
          data
            .map((row) => row[col.key])
            .filter((value) => value != null)
            .map((value) => String(value).trim())
            .filter((value) => value !== ''),
        ),
      )
      acc[col.key] = values
      return acc
    }, {})
  }, [advancedFilterColumns, data])

  const hasActiveFilters =
    search.trim() !== '' ||
    Object.values(columnFilters).some((value) => value && value.trim() !== '')

  const filteredData = useMemo(() => {
    const normalizedSearch = normalizeString(search)

    const filtered = data.filter((row) => {
      const matchesSearch =
        normalizedSearch === '' ||
        columns.some((col) =>
          normalizeString(row[col.key]).includes(normalizedSearch),
        )

      if (!matchesSearch) return false

      return advancedFilterColumns.every((col) => {
        const filterValue = normalizeString(columnFilters[col.key])
        if (!filterValue) return true
        return normalizeString(row[col.key]).includes(filterValue)
      })
    })

    if (!sortBy) return filtered

    const sorted = [...filtered].sort((a, b) => {
      const left = parseComparableValue(a[sortBy])
      const right = parseComparableValue(b[sortBy])

      if (left < right) return sortDirection === 'asc' ? -1 : 1
      if (left > right) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [
    search,
    data,
    columns,
    advancedFilterColumns,
    columnFilters,
    sortBy,
    sortDirection,
  ])

  const handleClearFilters = () => {
    setSearch('')
    setColumnFilters({})
    setSortBy(columns[0]?.key || '')
    setSortDirection('asc')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-3">
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                {addLabel}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDownIcon className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              {columns.map((col) => (
                <option key={col.key} value={col.key}>
                  Sắp xếp theo {col.label}
                </option>
              ))}
            </select>
            <select
              value={sortDirection}
              onChange={(e) =>
                setSortDirection(e.target.value as 'asc' | 'desc')
              }
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FilterIcon className="w-4 h-4" />
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XIcon className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {advancedFilterColumns.map((col) => {
              const options = filterOptions[col.key] || []
              const useSelect = options.length > 0 && options.length <= 8

              return (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {col.label}
                  </label>
                  {useSelect ? (
                    <select
                      value={columnFilters[col.key] || ''}
                      onChange={(e) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          [col.key]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                    >
                      <option value="">-- Tất cả --</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={columnFilters[col.key] || ''}
                      onChange={(e) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          [col.key]: e.target.value,
                        }))
                      }
                      placeholder={`Lọc theo ${col.label.toLowerCase()}`}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gold-500/10 to-gold-400/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-gold-700 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {actionsToRender.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-gold-700 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actionsToRender.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-400 text-sm"
                >
                  {emptyState || 'Không có dữ liệu'}
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gold-50/30'}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-3.5 text-sm text-gray-700"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                  {actionsToRender.length > 0 && (
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actionsToRender.map((action) => {
                          const icon =
                            action.key === 'edit' ? (
                              <PencilIcon className="w-4 h-4" />
                            ) : action.key === 'delete' ? (
                              <Trash2Icon className="w-4 h-4" />
                            ) : action.key === 'view' ? (
                              <EyeIcon className="w-4 h-4" />
                            ) : null

                          return (
                            <button
                              key={action.key}
                              onClick={() => action.onClick(row)}
                              className={
                                action.className ||
                                'px-3 py-1.5 text-xs font-medium text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors'
                              }
                              aria-label={action.label}
                              title={action.label}
                            >
                              {icon || action.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
        Hiển thị {filteredData.length} / {data.length} bản ghi
      </div>
    </div>
  )
}
