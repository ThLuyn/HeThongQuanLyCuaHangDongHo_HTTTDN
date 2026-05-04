// @ts-nocheck
import { BarChart3Icon, BriefcaseBusinessIcon, CalendarCheckIcon, ChartNoAxesColumnIcon, ClipboardListIcon, FileText, LayoutDashboardIcon, LogOutIcon, MenuIcon, PackageIcon, PackagePlusIcon, SettingsIcon, ShieldCheckIcon, ShoppingCart, TruckIcon, UserCogIcon, UserIcon, UsersIcon, WalletIcon } from 'lucide-react';
import logo from '../assets/LOGO.png';
const pageIcons = {
    dashboard: LayoutDashboardIcon,
    'my-attendance': CalendarCheckIcon,
    'my-leave-requests': FileText,
    'my-salary': WalletIcon,
    employees: UsersIcon,
    'position-salary': BriefcaseBusinessIcon,
    'leave-operations': ClipboardListIcon,
    'daily-attendance': CalendarCheckIcon,
    'salary-leave': WalletIcon,
    'watch-categories': PackageIcon,
    suppliers: TruckIcon,
    customers: UsersIcon,
    'stock-receipts': PackagePlusIcon,
    'export-receipts': ShoppingCart,
    'sales-report': ChartNoAxesColumnIcon,
    'permission-management': ShieldCheckIcon,
    'user-management': UserCogIcon,
};
const menuItems = [
    {
        id: 'dashboard',
        label: 'Tổng quan',
        icon: LayoutDashboardIcon,
    },
    {
        id: 'personal-work',
        label: 'Công việc cá nhân',
        icon: UserIcon,
        children: [
            {
                id: 'my-attendance',
                label: 'Chấm công',
            },
            {
                id: 'my-leave-requests',
                label: 'Xin nghỉ',
            },
            {
                id: 'my-salary',
                label: 'Lương cá nhân',
            },
        ],
    },
    {
        id: 'hr',
        label: 'Quản lý nhân sự',
        icon: UsersIcon,
        children: [
            {
                id: 'employees',
                label: 'Hồ sơ nhân sự',
            },
            {
                id: 'position-salary',
                label: 'Chức vụ và Công tác',
            },
            {
                id: 'leave-operations',
                label: 'Điều hành nghỉ phép',
            },
            {
                id: 'daily-attendance',
                label: 'Chấm công và Phân ca',
            },
            {
                id: 'salary-leave',
                label: 'Quản lý lương',
            },
        ],
    },
    {
        id: 'warehouse',
        label: 'Quản lý kho',
        icon: PackageIcon,
        children: [
            {
                id: 'watch-categories',
                label: 'Sản phẩm',
            },
            {
                id: 'suppliers',
                label: 'Nhà cung cấp',
            },
            {
                id: 'stock-receipts',
                label: 'Nhập kho',
            },
        ],
    },
    {
        id: 'business',
        label: 'Quản lý kinh doanh',
        icon: BarChart3Icon,
        children: [
            {
                id: 'export-receipts',
                label: 'Xuất hàng',
            },
            {
                id: 'customers',
                label: 'Khách hàng',
            },
            {
                id: 'sales-report',
                label: 'Báo cáo & Thống kê',
            },
            // watch-categories chỉ hiện ở đây với sales (không phải warehouse)
            // warehouse đã có trong group 'warehouse' rồi
            {
                id: 'watch-categories',
                label: 'Sản phẩm',
                salesOnly: true,
            },
        ],
    },
    {
        id: 'system',
        label: 'Hệ thống',
        icon: SettingsIcon,
        children: [
            {
                id: 'permission-management',
                label: 'Phân quyền',
            },
            {
                id: 'user-management',
                label: 'Quản lý tài khoản',
            },
        ],
    },
];
export function Sidebar({ activePage, onNavigate, isOpen, onToggle, allowedPages = [], onLogout, currentMnq = 0, currentRole = '' }) {
    const allowedSet = new Set(allowedPages);
    const mnq = Number(currentMnq);
    const isSalesGroup = mnq === 2;
    const isWarehouseGroup = mnq === 3;
    const visibleMenuItems = menuItems
        .flatMap((item) => {
            // Ẩn Tổng quan với các nhóm quyền không phải MNQ=1
            if (item.id === 'dashboard' && mnq !== 1)
                return [];
            // Ẩn Quản lý kho với nhóm Kinh doanh (MNQ=2)
            if (item.id === 'warehouse' && isSalesGroup)
                return [];
            // Ẩn Quản lý kinh doanh với nhóm Kho (MNQ=3)
            if (item.id === 'business' && isWarehouseGroup)
                return [];
            if (!item.children)
                return [item];
            return item.children
                .filter((child) => !child.salesOnly || isSalesGroup)
                .filter((child) => allowedSet.has(child.id))
                .map((child) => ({
                    ...child,
                    icon: pageIcons[child.id] || item.icon,
                }));
        })
        .filter(Boolean);
    return (<div className={`bg-dark-700 border-r border-white/5 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-[300px]' : 'w-0'}`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 gap-3 border-b border-white/5 flex-shrink-0">
            <button onClick={onToggle} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-500 transition-colors" aria-label="Đóng/Mở sidebar">
                <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
                <img src={logo} alt="Golden Time logo" className="w-5 h-5 rounded-full object-cover" />
                <h1 className="text-lg font-bold text-white tracking-wide whitespace-nowrap">
                    GOLDEN TIME
                </h1>
            </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3">
            {visibleMenuItems.map((item) => {
                const isActive = item.id === activePage ||
                    (item.id === 'dashboard' && activePage === 'dashboard');
                return (<button key={item.id} onClick={() => onNavigate(item.id)} className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mb-1 ${isActive ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/15' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
                    <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-dark-900' : ''}`} />
                    <span className="min-w-0 flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                </button>);
            })}
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-3 border-t border-white/5 flex-shrink-0">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
                <LogOutIcon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Đăng xuất</span>
            </button>
        </div>
    </div>);
}
