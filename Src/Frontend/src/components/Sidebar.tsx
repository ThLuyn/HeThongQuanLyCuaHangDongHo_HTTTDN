// @ts-nocheck
import { BarChart3Icon, ChevronDownIcon, ChevronUpIcon, LayoutDashboardIcon, LogOutIcon, MenuIcon, PackageIcon, SettingsIcon, UserIcon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/LOGO.png';
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
                id: 'sales-report',
                label: 'Báo cáo & Thống kê',
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
export function Sidebar({ activePage, onNavigate, isOpen, onToggle, allowedPages = [], onLogout, currentMnq = 0 }) {
    const allowedSet = new Set(allowedPages);
    const [expandedSections, setExpandedSections] = useState([
        'personal-work',
        'hr',
        'warehouse',
        'business',
        'system',
    ]);
    const toggleSection = (sectionId) => {
        setExpandedSections((prev) => prev.includes(sectionId)
            ? prev.filter((id) => id !== sectionId)
            : [...prev, sectionId]);
    };
    const isChildActive = (item) => {
        if (!item.children)
            return false;
        return item.children.some((child) => child.id === activePage);
    };
    const visibleMenuItems = menuItems
        .map((item) => {
        // Ẩn Tổng quan với các nhóm quyền không phải MNQ=1
        if (item.id === 'dashboard' && Number(currentMnq) !== 1)
            return null;
        if (!item.children)
            return item;
        const visibleChildren = item.children.filter((child) => allowedSet.has(child.id));
        if (visibleChildren.length === 0)
            return null;
        return {
            ...item,
            children: visibleChildren,
        };
    })
        .filter(Boolean);
    return (<div className={`bg-dark-700 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-[250px]' : 'w-0'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-white/5 flex-shrink-0">
        <button onClick={onToggle} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-500 transition-colors" aria-label="Đóng/Mở sidebar">
          <MenuIcon className="w-5 h-5"/>
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Golden Time logo" className="w-5 h-5 rounded-full object-cover"/>
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
            const isExpanded = expandedSections.includes(item.id);
            const hasActiveChild = isChildActive(item);
            if (!item.children) {
                return (<button key={item.id} onClick={() => onNavigate(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mb-1 ${isActive ? 'bg-gold-500/15 text-gold-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-gold-400' : ''}`}/>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>);
            }
            return (<div key={item.id} className="mb-1">
              <button onClick={() => toggleSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${hasActiveChild ? 'text-gold-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
                <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${hasActiveChild ? 'text-gold-400' : ''}`}/>
                <span className="flex-1 text-left whitespace-nowrap">
                  {item.label}
                </span>
                {isExpanded ? (<ChevronUpIcon className="w-4 h-4 flex-shrink-0"/>) : (<ChevronDownIcon className="w-4 h-4 flex-shrink-0"/>)}
              </button>
              {isExpanded && (<div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-4">
                  {item.children.map((child) => {
                        const childActive = child.id === activePage;
                        return (<button key={child.id} onClick={() => onNavigate(child.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${childActive ? 'text-gold-400 bg-gold-500/10 font-medium' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                        <span className="whitespace-nowrap">{child.label}</span>
                      </button>);
                    })}
                </div>)}
            </div>);
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