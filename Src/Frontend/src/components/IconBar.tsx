// @ts-nocheck
import { CalendarIcon, HomeIcon, LogOutIcon, SettingsIcon, UsersIcon, } from 'lucide-react';
const topIcons = [
    {
        id: 'dashboard',
        icon: HomeIcon,
        label: 'Tổng quan',
    },
    {
        id: 'employees',
        icon: UsersIcon,
        label: 'Nhân sự',
    },
    {
        id: 'stock-receipts',
        icon: CalendarIcon,
        label: 'Kho',
    },
    {
        id: 'system',
        icon: SettingsIcon,
        label: 'Hệ thống',
    },
];
export function IconBar({ activePage, onNavigate, onLogout }) {
    const getGroupForPage = (page) => {
        if (page === 'dashboard')
            return 'dashboard';
        if (['employees', 'salary-leave', 'position-salary'].includes(page))
            return 'employees';
        if ([
            'watch-categories',
            'suppliers',
            'stock-receipts',
            'export-receipts',
            'sales-report',
        ].includes(page))
            return 'stock-receipts';
        if (['user-management', 'backup-restore'].includes(page))
            return 'system';
        return '';
    };
    const activeGroup = getGroupForPage(activePage);
    return (<div className="w-[60px] bg-dark-900 flex flex-col items-center py-4 flex-shrink-0">
      <div className="flex-1 flex flex-col items-center gap-2 mt-2">
        {topIcons.map((item) => {
            const isActive = activeGroup === item.id;
            return (<button key={item.id} onClick={() => onNavigate(item.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-dark-600'}`} aria-label={item.label} title={item.label}>
              <item.icon className="w-5 h-5"/>
            </button>);
        })}
      </div>
      <div className="flex flex-col items-center gap-3 mt-auto">
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-dark-600 transition-colors" aria-label="Đăng xuất" title="Đăng xuất" onClick={onLogout}>
          <LogOutIcon className="w-5 h-5"/>
        </button>
      </div>
    </div>);
}
