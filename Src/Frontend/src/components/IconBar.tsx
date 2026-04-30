// @ts-nocheck
import {
  BriefcaseBusinessIcon,
  CalendarCheckIcon,
  ChartNoAxesColumnIcon,
  ClipboardListIcon,
  HomeIcon,
  LogOutIcon,
  PackageIcon,
  PackagePlusIcon,
  FileText,
  ShieldCheckIcon,
  TruckIcon,
  UserCogIcon,
  ShoppingCart,
  UsersIcon,
  WalletIcon,
} from 'lucide-react';
import logo from '../assets/LOGO.png';

const topIcons = [
  { id: 'dashboard', icon: HomeIcon, label: 'Tổng quan' },
  { id: 'my-attendance', icon: CalendarCheckIcon, label: 'Chấm công' },
  { id: 'my-leave-requests', icon: FileText, label: 'Xin nghỉ' },
  { id: 'my-salary', icon: WalletIcon, label: 'Lương cá nhân' },
  { id: 'employees', icon: UsersIcon, label: 'Hồ sơ nhân sự' },
  { id: 'position-salary', icon: BriefcaseBusinessIcon, label: 'Chức vụ và Công tác' },
  { id: 'leave-operations', icon: ClipboardListIcon, label: 'Điều hành nghỉ phép' },
  { id: 'daily-attendance', icon: CalendarCheckIcon, label: 'Chấm công và Phân ca' },
  { id: 'salary-leave', icon: WalletIcon, label: 'Quản lý lương' },
  { id: 'watch-categories', icon: PackageIcon, label: 'Sản phẩm' },
  { id: 'suppliers', icon: TruckIcon, label: 'Nhà cung cấp' },
  { id: 'stock-receipts', icon: PackagePlusIcon, label: 'Nhập kho' },
  { id: 'export-receipts', icon: ShoppingCart, label: 'Xuất hàng' },
  { id: 'sales-report', icon: ChartNoAxesColumnIcon, label: 'Báo cáo & Thống kê' },
  { id: 'permission-management', icon: ShieldCheckIcon, label: 'Phân quyền' },
  { id: 'user-management', icon: UserCogIcon, label: 'Quản lý tài khoản' },
];

export function IconBar({ activePage, onNavigate, onLogout, allowedPages = [], isVisible = true }) {
  const allowedSet = new Set(allowedPages);
  const visibleTopIcons = topIcons.filter((item) => allowedSet.has(item.id));

  return (
    <div className={`bg-dark-700 border-r border-white/5 flex flex-col items-center flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isVisible ? 'w-[124px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
      <div className="h-[116px] w-full flex items-center justify-center border-b border-white/5">
        <img src={logo} alt="Golden Time logo" className="w-14 h-14 rounded-2xl object-cover" />
      </div>

      <div className="flex-1 w-full flex flex-col items-center gap-4 py-6 overflow-y-auto sidebar-scroll">
        {visibleTopIcons.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative w-[104px] h-[74px] rounded-xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-dark-600 text-gold-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              aria-label={item.label}
              title={item.label}
            >
              {isActive && <span className="absolute left-0 top-0 h-full w-1.5 bg-gold-500 rounded-l-xl" />}
              <item.icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>

      <div className="w-full flex flex-col items-center gap-3 mt-auto pb-5">
        <button
          className="w-full h-[64px] flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          onClick={onLogout}
        >
          <LogOutIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
