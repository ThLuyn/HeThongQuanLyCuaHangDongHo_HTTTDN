// @ts-nocheck
import { CalendarIcon, HomeIcon, LogOutIcon, SettingsIcon, UserIcon, UsersIcon, } from 'lucide-react';
const topIcons = [
    {
        id: 'dashboard',
        icon: HomeIcon,
        label: 'Tổng quan',
    },
    {
        id: 'personal-work',
        icon: UserIcon,
        label: 'Công việc cá nhân',
    },
    {
        id: 'employees',
        icon: UsersIcon,
        label: 'Quản lý nhân sự',
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
export function IconBar({ activePage, onNavigate, onLogout, allowedPages = [], isVisible = true }) {
    const allowedSet = new Set(allowedPages);
    const getGroupForPage = (page) => {
        if (page === 'dashboard')
            return 'dashboard';
        if (['my-attendance', 'my-leave-requests', 'my-salary', 'profile', 'change-password'].includes(page))
            return 'personal-work';
        if (['employees', 'salary-leave', 'leave-operations', 'daily-attendance', 'position-salary'].includes(page))
            return 'employees';
        if ([
            'watch-categories',
            'suppliers',
            'stock-receipts',
            'export-receipts',
            'sales-report',
        ].includes(page))
            return 'stock-receipts';
        if (['permission-management', 'user-management', 'backup-restore'].includes(page))
            return 'system';
        return '';
    };
    const groupToPages = {
        dashboard: ['dashboard'],
        'personal-work': ['my-attendance', 'my-leave-requests', 'my-salary', 'profile', 'change-password'],
        employees: ['employees', 'salary-leave', 'leave-operations', 'daily-attendance', 'position-salary'],
        'stock-receipts': ['watch-categories', 'suppliers', 'stock-receipts', 'export-receipts', 'sales-report'],
        system: ['permission-management', 'user-management', 'backup-restore'],
    };
    const visibleTopIcons = topIcons.filter((item) => {
        const pages = groupToPages[item.id] || [];
        return pages.some((page) => allowedSet.has(page));
    });
    const activeGroup = getGroupForPage(activePage);
    return (<div className={`bg-dark-900 flex flex-col items-center py-4 flex-shrink-0 transition-all duration-300 ease-in-out ${isVisible ? 'w-[60px] opacity-100' : 'w-0 opacity-0 overflow-hidden pointer-events-none'}`}>
      <div className="flex-1 flex flex-col items-center gap-2 mt-2">
        {visibleTopIcons.map((item) => {
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