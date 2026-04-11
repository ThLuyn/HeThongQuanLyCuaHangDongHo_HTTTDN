// @ts-nocheck
import { ArrowUpDownIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, FilterIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon, } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const sortStateMemory = new Map();

function normalizeString(value) {
    if (value == null)
        return '';
    return String(value).trim().toLowerCase();
}
function parseComparableValue(value) {
    if (typeof value === 'number')
        return value;
    if (value == null)
        return '';
    const raw = String(value).trim();
  const isoDateMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (isoDateMatch) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = isoDateMatch;
    const timestamp = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)).getTime();
    return Number.isNaN(timestamp) ? raw.toLowerCase() : timestamp;
  }
    const dateTimeMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (dateTimeMatch) {
        const [, d, m, y, hh = '0', mm = '0'] = dateTimeMatch;
        const timestamp = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)).getTime();
        return Number.isNaN(timestamp) ? raw.toLowerCase() : timestamp;
    }
    const numericCandidate = raw.replace(/\./g, '').replace(/[^\d-]/g, '');
    if (numericCandidate && /^-?\d+$/.test(numericCandidate)) {
        return Number(numericCandidate);
    }
    return raw.toLowerCase();
}
export function DataTable({ title, columns, data, searchPlaceholder = 'Tìm kiếm...', onAdd, onEdit, onDelete, addLabel = 'Thêm mới', rowActions, advancedFilterKeys, rangeFilterKeys, forceSelectFilterKeys = [], fixedSelectOptions = {}, customAdvancedFilters, externalHasActiveFilters = false, onClearExternalFilters, emptyState, noHorizontalScroll = false, pageSize = 5, defaultSortBy, defaultSortDirection = 'asc', resetSignal, }) {
    const tableMemoryKey = useMemo(() => {
      const columnKeys = columns.map((col) => col.key).join('|');
      return `${title}__${columnKeys}`;
    }, [title, columns]);
    const initialSortState = sortStateMemory.get(tableMemoryKey);
    const [search, setSearch] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [columnFilters, setColumnFilters] = useState({});
    const [rangeFilters, setRangeFilters] = useState({});
    const [sortBy, setSortBy] = useState(initialSortState?.sortBy || defaultSortBy || columns[0]?.key || '');
    const [sortDirection, setSortDirection] = useState(initialSortState?.sortDirection || defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
    const lastResetSignalRef = useRef(resetSignal);
    const defaultRowActions = useMemo(() => {
        const actions = [];
        if (onEdit) {
            actions.push({
                key: 'edit',
                label: 'Sửa',
                onClick: onEdit,
                className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
            });
        }
        if (onDelete) {
            actions.push({
                key: 'delete',
                label: 'Xóa',
                onClick: onDelete,
                className: 'p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors',
            });
        }
        return actions;
    }, [onDelete, onEdit]);
    const actionsToRender = rowActions ?? defaultRowActions;
    const advancedFilterColumns = useMemo(() => {
        const sourceColumns = advancedFilterKeys && advancedFilterKeys.length > 0
            ? columns.filter((col) => advancedFilterKeys.includes(col.key))
            : columns;
        return sourceColumns.filter((col) => {
            const values = new Set(data
                .map((row) => row[col.key])
                .filter((value) => value != null)
                .map((value) => String(value).trim()));
            return values.size > 0;
        });
    }, [advancedFilterKeys, columns, data]);
    const rangeFilterMap = useMemo(() => {
        const entries = (rangeFilterKeys || []).map((item) => [item.key, item]);
        return Object.fromEntries(entries);
    }, [rangeFilterKeys]);
    const filterOptions = useMemo(() => {
        return advancedFilterColumns.reduce((acc, col) => {
        const values = Array.from(new Set(data
                .map((row) => row[col.key])
                .filter((value) => value != null)
                .map((value) => String(value).trim())
                .filter((value) => value !== '')));
        const fixedOptions = Array.isArray(fixedSelectOptions[col.key])
          ? fixedSelectOptions[col.key].map((item) => String(item).trim()).filter((item) => item !== '')
          : [];
        acc[col.key] = Array.from(new Set([...fixedOptions, ...values]));
            return acc;
        }, {});
    }, [advancedFilterColumns, data, fixedSelectOptions]);
    const hasActiveFilters = search.trim() !== '' ||
      Object.values(columnFilters).some((value) => value && value.trim() !== '') ||
      Object.values(rangeFilters).some((value) => {
        const min = value?.min;
        const max = value?.max;
        return min !== '' || max !== '';
      }) ||
      Boolean(externalHasActiveFilters);
    const filteredData = useMemo(() => {
        const normalizedSearch = normalizeString(search);
        const filtered = data.filter((row) => {
            const matchesSearch = normalizedSearch === '' ||
                columns.some((col) => normalizeString(row[col.key]).includes(normalizedSearch));
            if (!matchesSearch)
                return false;
            return advancedFilterColumns.every((col) => {
              const rangeConfig = rangeFilterMap[col.key];
              if (rangeConfig) {
                const rawValue = row[col.key];
                const isDateRange = rangeConfig.inputType === 'date';
                const minRaw = rangeFilters[col.key]?.min;
                const maxRaw = rangeFilters[col.key]?.max;
                const hasMin = minRaw !== '' && minRaw != null;
                const hasMax = maxRaw !== '' && maxRaw != null;
                if (!hasMin && !hasMax)
                  return true;

                let currentValue;
                if (isDateRange) {
                  const parsedByDate = new Date(rawValue).getTime();
                  currentValue = Number.isNaN(parsedByDate)
                    ? parseComparableValue(rawValue)
                    : parsedByDate;
                  if (typeof currentValue !== 'number' || Number.isNaN(currentValue))
                    return false;
                } else {
                  currentValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
                  if (Number.isNaN(currentValue))
                    return false;
                }
                const min = hasMin
                  ? isDateRange
                    ? new Date(`${minRaw}T00:00:00`).getTime()
                    : Number(minRaw)
                  : null;
                const max = hasMax
                  ? isDateRange
                    ? new Date(`${maxRaw}T23:59:59.999`).getTime()
                    : Number(maxRaw)
                  : null;
                if (hasMin && !Number.isNaN(min) && currentValue < min)
                  return false;
                if (hasMax && !Number.isNaN(max) && currentValue > max)
                  return false;
                return true;
              }
                const filterValue = normalizeString(columnFilters[col.key]);
                if (!filterValue)
                    return true;
                return normalizeString(row[col.key]).includes(filterValue);
            });
        });
        if (!sortBy)
            return filtered;
        const sorted = [...filtered].sort((a, b) => {
            const left = parseComparableValue(a[sortBy]);
            const right = parseComparableValue(b[sortBy]);
            if (left < right)
                return sortDirection === 'asc' ? -1 : 1;
            if (left > right)
                return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [
        search,
        data,
        columns,
        advancedFilterColumns,
        columnFilters,
        rangeFilters,
        rangeFilterMap,
        sortBy,
        sortDirection,
    ]);
      const totalRows = filteredData.length;
      const paginationEnabled = Number(pageSize) > 0;
      const totalPages = paginationEnabled ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
      useEffect(() => {
        if (!paginationEnabled) {
          setCurrentPage(1);
          return;
        }
        setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
      }, [paginationEnabled, totalPages]);
      const pagedData = useMemo(() => {
        if (!paginationEnabled)
          return filteredData;
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
      }, [filteredData, paginationEnabled, currentPage, pageSize]);
    const handleClearFilters = () => {
        setSearch('');
        setColumnFilters({});
        setRangeFilters({});
      if (typeof onClearExternalFilters === 'function') {
        onClearExternalFilters();
      }
      setSortBy(defaultSortBy || columns[0]?.key || '');
      setSortDirection(defaultSortDirection);
        setCurrentPage(1);
    };
    useEffect(() => {
      const sortKeyExists = columns.some((col) => col.key === sortBy);
      if (!sortKeyExists) {
        setSortBy(defaultSortBy || columns[0]?.key || '');
      }
    }, [columns, defaultSortBy, sortBy]);
    useEffect(() => {
      sortStateMemory.set(tableMemoryKey, {
        sortBy,
        sortDirection,
      });
    }, [tableMemoryKey, sortBy, sortDirection]);
    useEffect(() => {
      if (resetSignal === undefined || resetSignal === lastResetSignalRef.current)
        return;
      lastResetSignalRef.current = resetSignal;
      setSearch('');
      setShowAdvanced(false);
      setColumnFilters({});
      setRangeFilters({});
      setSortBy(defaultSortBy || columns[0]?.key || '');
      setSortDirection(defaultSortDirection);
      setCurrentPage(1);
    }, [resetSignal, defaultSortBy, defaultSortDirection, columns]);
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-3">
            {onAdd && (<button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors">
                <PlusIcon className="w-4 h-4"/>
                {addLabel}
              </button>)}
          </div>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400"/>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDownIcon className="w-4 h-4 text-gray-500"/>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
              {columns.map((col) => (<option key={col.key} value={col.key}>
                  Sắp xếp theo {col.label}
                </option>))}
            </select>
            <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
              <option value="asc">Cũ đến mới</option>
              <option value="desc">Mới đến cũ</option>
            </select>
          </div>

          <button onClick={() => setShowAdvanced((prev) => !prev)} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FilterIcon className="w-4 h-4"/>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}/>
          </button>

          {hasActiveFilters && (<button onClick={handleClearFilters} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
              <XIcon className="w-4 h-4"/>
              Xóa bộ lọc
            </button>)}
        </div>

        {showAdvanced && (<div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {advancedFilterColumns.map((col) => {
              const rangeConfig = rangeFilterMap[col.key];
              if (rangeConfig) {
                const minValue = rangeFilters[col.key]?.min || '';
                const maxValue = rangeFilters[col.key]?.max || '';
                const inputType = rangeConfig.inputType === 'date' ? 'date' : 'number';
                return (<div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {col.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                  <input type={inputType} min={inputType === 'number' ? 0 : undefined} value={minValue} onChange={(e) => setRangeFilters((prev) => ({
                      ...prev,
                      [col.key]: {
                        min: e.target.value,
                        max: prev[col.key]?.max || '',
                      },
                    }))} placeholder={rangeConfig.minPlaceholder || 'Từ'} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  <input type={inputType} min={inputType === 'number' ? 0 : undefined} value={maxValue} onChange={(e) => setRangeFilters((prev) => ({
                      ...prev,
                      [col.key]: {
                        min: prev[col.key]?.min || '',
                        max: e.target.value,
                      },
                    }))} placeholder={rangeConfig.maxPlaceholder || 'Đến'} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>
                </div>);
              }
                const options = filterOptions[col.key] || [];
                const forceSelect = forceSelectFilterKeys.includes(col.key);
                const useSelect = options.length > 0 && (forceSelect || options.length <= 8);
                return (<div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {col.label}
                  </label>
                  {useSelect ? (<select value={columnFilters[col.key] || ''} onChange={(e) => setColumnFilters((prev) => ({
                            ...prev,
                            [col.key]: e.target.value,
                        }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                      <option value="">Tất cả</option>
                      {options.map((option) => (<option key={option} value={option}>
                          {option}
                        </option>))}
                    </select>) : (<input type="text" value={columnFilters[col.key] || ''} onChange={(e) => setColumnFilters((prev) => ({
                            ...prev,
                            [col.key]: e.target.value,
                        }))} placeholder={`Lọc theo ${col.label.toLowerCase()}`} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>)}
                </div>);
            })}
          {customAdvancedFilters ? (<div className="sm:col-span-2 xl:col-span-3">
            {customAdvancedFilters}
            </div>) : null}
          </div>)}
      </div>
      <div className={`data-table-scroll ${noHorizontalScroll ? 'overflow-x-hidden' : 'overflow-x-auto'}`}>
        <table className={`w-full ${noHorizontalScroll ? 'table-fixed' : ''}`}>
          <thead>
            <tr className="bg-gradient-to-r from-gold-500/10 to-gold-400/5">
              {columns.map((col) => (<th key={col.key} className={`px-6 py-3 text-left text-xs font-semibold text-gold-700 uppercase tracking-wider ${noHorizontalScroll ? 'whitespace-normal break-words' : ''}`}>
                  {col.label}
                </th>))}
              {actionsToRender.length > 0 && (<th className="px-6 py-3 text-right text-xs font-semibold text-gold-700 uppercase tracking-wider">
                  Thao tác
                </th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedData.length === 0 ? (<tr>
                <td colSpan={columns.length + (actionsToRender.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-gray-400 text-sm">
                  {emptyState || 'Không có dữ liệu'}
                </td>
              </tr>) : (pagedData.map((row, idx) => (<tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gold-50/30'}>
                  {columns.map((col) => (<td key={col.key} className={`px-6 py-3.5 text-sm text-gray-700 ${noHorizontalScroll ? 'whitespace-normal break-words align-top' : ''}`}>
                      {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]}
                    </td>))}
                  {actionsToRender.length > 0 && (<td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actionsToRender
                          .filter((action) => !(typeof action.hidden === 'function' && action.hidden(row)))
                          .map((action) => {
                    const icon = action.key === 'edit'
                      ? (<PencilIcon className="w-4 h-4"/>)
                      : action.key === 'delete'
                        ? (<Trash2Icon className="w-4 h-4"/>)
                        : action.key === 'view'
                          ? (<EyeIcon className="w-4 h-4"/>)
                          : action.key === 'approve'
                            ? (<CheckIcon className="w-4 h-4"/>)
                            : action.key === 'reject'
                              ? (<XIcon className="w-4 h-4"/>)
                              : null;
                    const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : Boolean(action.disabled);
                    return (<button key={action.key} onClick={() => {
                              if (!isDisabled)
                                  action.onClick(row);
                            }} disabled={isDisabled} className={`${action.className ||
                            'px-3 py-1.5 text-xs font-medium text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label={action.label} title={action.label}>
                              {icon || action.label}
                            </button>);
                })}
                      </div>
                    </td>)}
                </tr>)))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Hiển thị {paginationEnabled ? (pagedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1) : (filteredData.length === 0 ? 0 : 1)}-{paginationEnabled ? Math.min(currentPage * pageSize, totalRows) : filteredData.length} / {filteredData.length} bản ghi
          </span>
          {paginationEnabled && totalPages > 1 && (<div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} aria-label="Trang trước" title="Trang trước" className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeftIcon className="w-4 h-4"/>
              </button>
              <span className="text-sm text-gray-600">
                {currentPage}/{totalPages}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} aria-label="Trang sau" title="Trang sau" className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRightIcon className="w-4 h-4"/>
              </button>
            </div>)}
        </div>
      </div>
    </div>);
}
