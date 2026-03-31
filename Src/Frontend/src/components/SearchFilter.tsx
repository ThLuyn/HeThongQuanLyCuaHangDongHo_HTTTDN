// @ts-nocheck
import { ChevronDownIcon, FilterIcon, SearchIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react';
export function SearchFilter({ onSearch, onFilter, filterFields, searchPlaceholder = 'Tìm kiếm...', }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filters, setFilters] = useState({});
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearch(value);
    };
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilter(newFilters);
    };
    const handleClearFilters = () => {
        setFilters({});
        setSearchQuery('');
        onSearch('');
        onFilter({});
    };
    const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== null && v !== undefined);
    return (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Basic Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder={searchPlaceholder} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400"/>
        </div>

        {/* Advanced Search Toggle */}
        {filterFields && filterFields.length > 0 && (<button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FilterIcon className="w-4 h-4"/>
            <span>Bộ lọc</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}/>
          </button>)}

        {/* Clear Filters */}
        {(hasActiveFilters || searchQuery) && (<button onClick={handleClearFilters} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
            <XIcon className="w-4 h-4"/>
            <span>Xóa</span>
          </button>)}
      </div>

      {/* Advanced Filter */}
      {showAdvanced && filterFields && filterFields.length > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          {filterFields.map((field) => (<div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
              </label>
              {field.type === 'select' ? (<select value={filters[field.key] || ''} onChange={(e) => handleFilterChange(field.key, e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sm">
                  <option value="">-- Tất cả --</option>
                  {field.options?.map((opt) => (<option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>))}
                </select>) : field.type === 'date' ? (<input type="date" value={filters[field.key] || ''} onChange={(e) => handleFilterChange(field.key, e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sm"/>) : field.type === 'number' ? (<input type="number" value={filters[field.key] || ''} onChange={(e) => handleFilterChange(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sm"/>) : (<input type="text" value={filters[field.key] || ''} onChange={(e) => handleFilterChange(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 text-sm"/>)}
            </div>))}
        </div>)}
    </div>);
}
