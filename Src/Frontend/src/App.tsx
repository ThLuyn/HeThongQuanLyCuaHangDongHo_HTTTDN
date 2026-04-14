// @ts-nocheck
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { IconBar } from './components/IconBar';
import { Sidebar } from './components/Sidebar';
import { BackupRestore } from './pages/BackupRestore';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DailyAttendance } from './pages/DailyAttendance';
import { Dashboard } from './pages/Dashboard';
import { EmployeeList } from './pages/EmployeeList';
import { ExportReceipts } from './pages/ExportReceipts';
import { LeaveOperations } from './pages/LeaveOperations';
import { LoginPage } from './pages/LoginPage';
import { MyLeaveRequests } from './pages/MyLeaveRequests';
import { MySalary } from './pages/MySalary';
import { PermissionManagement } from './pages/PermissionManagement';
import { PersonalProfile } from './pages/PersonalProfile';
import { PositionSalaryManagement } from './pages/PositionSalaryManagement';
import { SalaryLeave } from './pages/SalaryLeave';
import { SalesReport } from './pages/SalesReport';
import { StockReceipts } from './pages/StockReceipts';
import { Suppliers } from './pages/Suppliers';
import { UserManagement } from './pages/UserManagement';
import { WatchCategories } from './pages/WatchCategories';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './utils/authStorage';
import { changeMyPasswordApi, getMyProfileApi, loginApi } from './utils/backendApi';
const ACTIVE_PAGE_STORAGE_KEY = 'watch_store_active_page';
const AUTH_EXPIRED_EVENT = 'watch-store-auth-expired';
const pageTitles = {
    dashboard: 'Tổng quan',
    employees: 'Danh sách nhân viên',
    'my-attendance': 'Chấm công của tôi',
    'my-salary': 'Lương cá nhân',
    'salary-leave': 'Quản lý lương',
    'leave-operations': 'Điều hành Nghỉ phép',
    'daily-attendance': 'Chấm công và Phân ca',
    'my-leave-requests': 'Đơn xin nghỉ của tôi',
    'position-salary': 'Chức vụ và Lương',
    'watch-categories': 'Sản phẩm',
    suppliers: 'Nhà cung cấp',
    'stock-receipts': 'Phiếu nhập kho',
    'export-receipts': 'Phiếu xuất hàng',
    'sales-report': 'Báo cáo doanh số',
    'user-management': 'Quản lý User',
    'permission-management': 'Phân quyền hệ thống',
    'backup-restore': 'Sao lưu & Phục hồi',
    profile: 'Thông tin cá nhân',
    'change-password': 'Đổi mật khẩu',
};
export function App() {
    const initialSession = loadAuthSession();
    const initialActivePage = localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) || 'dashboard';
    const [activePage, setActivePage] = useState(initialActivePage);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialSession));
    const [currentUser, setCurrentUser] = useState(initialSession?.fullName || initialSession?.username || '');
    const [currentUsername, setCurrentUsername] = useState(initialSession?.username || '');
    const [currentAvatar, setCurrentAvatar] = useState(initialSession?.avatar || '');
    const [currentRole, setCurrentRole] = useState(initialSession?.role || '');
    const [currentDepartment, setCurrentDepartment] = useState(initialSession?.department || '');
    const [currentPermissions, setCurrentPermissions] = useState(initialSession?.permissions || []);
    const [watchCategoryLowStockOnly, setWatchCategoryLowStockOnly] = useState(false);
    const [targetLowStockProductId, setTargetLowStockProductId] = useState(null);

    const hasPermission = (mcn, action = 'view') => currentPermissions.some((item) => String(item?.mcn || '').toLowerCase() === String(mcn).toLowerCase() && String(item?.hanhDong || '').toLowerCase() === String(action).toLowerCase());
    const isAdminOrHr = ['admin', 'hr'].includes(String(currentRole || '').toLowerCase());
    const isAdmin = String(currentRole || '').toLowerCase() === 'admin';
    const isHr = String(currentRole || '').toLowerCase() === 'hr';
    const isSales = String(currentRole || '').toLowerCase() === 'sales';
    const isWarehouse = String(currentRole || '').toLowerCase() === 'warehouse';

    const canAccessPage = (pageId) => {
        // Everyone can access these pages
        if (['dashboard', 'profile', 'change-password', 'my-attendance', 'my-leave-requests', 'my-salary'].includes(pageId)) {
            return true;
        }

        // Admin can access everything
        if (isAdmin) {
            return true;
        }

        // HR managers can access HR management pages
        if (isHr) {
            const hrPages = ['employees', 'position-salary', 'leave-operations', 'daily-attendance', 'salary-leave'];
            return hrPages.includes(pageId);
        }

        // Sales staff can access business management pages
        if (isSales) {
            const businessPages = ['export-receipts', 'sales-report'];
            return businessPages.includes(pageId);
        }

        // Warehouse staff can access warehouse management pages
        if (isWarehouse) {
            const warehousePages = ['watch-categories', 'suppliers', 'stock-receipts'];
            return warehousePages.includes(pageId);
        }

        // For other roles (manager, staff), fall back to permission-based access
        switch (pageId) {
            case 'employees':
                return hasPermission('nhanvien', 'view');
            case 'position-salary':
                return hasPermission('chucvu', 'view');
            case 'salary-leave':
                return false;
            case 'leave-operations':
                return hasPermission('donxinngh', 'view');
            case 'daily-attendance':
                return hasPermission('chamcong', 'view') || hasPermission('chamcong', 'create');
            case 'watch-categories':
                return hasPermission('sanpham', 'view');
            case 'suppliers':
                return hasPermission('nhacungcap', 'view');
            case 'stock-receipts':
                return hasPermission('phieunhap', 'view');
            case 'export-receipts':
                return hasPermission('phieuxuat', 'view');
            case 'sales-report':
                return hasPermission('thongke', 'view');
            case 'permission-management':
                return hasPermission('nhomquyen', 'view');
            case 'user-management':
                return hasPermission('taikhoan', 'view');
            case 'backup-restore':
                return hasPermission('thongke', 'export') || hasPermission('thongke', 'view');
            default:
                return false;
        }
    };

    const allowedPages = [
        'dashboard',
        'profile',
        'change-password',
        'my-attendance',
        'employees',
        'position-salary',
        'my-salary',
        'salary-leave',
        'leave-operations',
        'daily-attendance',
        'my-leave-requests',
        'watch-categories',
        'suppliers',
        'stock-receipts',
        'export-receipts',
        'sales-report',
        'permission-management',
        'user-management',
        'backup-restore',
    ].filter((page) => canAccessPage(page));

    const findFirstAllowedPage = () => allowedPages[0] || 'dashboard';

    useEffect(() => {
        if (!canAccessPage(activePage)) {
            setActivePage(findFirstAllowedPage());
        }
    }, [activePage, currentPermissions]);
    useEffect(() => {
        localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
    }, [activePage]);
    const handleLogin = async (username, password) => {
        try {
            const loginData = await loginApi(username, password);
            saveAuthSession({
                accessToken: loginData.accessToken,
                username: loginData.user.username,
                fullName: loginData.user.fullName,
                avatar: loginData.user.hinhAnh || '',
                role: loginData.user.role,
                mnv: loginData.user.mnv,
                permissions: loginData.user.permissions || [],
            });
            setIsAuthenticated(true);
            setCurrentUser(loginData.user.fullName || loginData.user.username);
            setCurrentUsername(loginData.user.username);
            setCurrentAvatar(loginData.user.hinhAnh || '');
            setCurrentRole(loginData.user.role || '');
            setCurrentDepartment(loginData.user.department || '');
            setCurrentPermissions(loginData.user.permissions || []);
            return { ok: true };
        }
        catch (error) {
            return {
                ok: false,
                message: error instanceof Error ? error.message : 'Dang nhap that bai',
            };
        }
    };
    const handleLogout = () => {
        clearAuthSession();
        localStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
        setIsAuthenticated(false);
        setCurrentUser('');
        setCurrentUsername('');
        setCurrentAvatar('');
        setCurrentRole('');
        setCurrentDepartment('');
        setCurrentPermissions([]);
        setActivePage('dashboard');
    };
    useEffect(() => {
        const onAuthExpired = () => {
            handleLogout();
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
        return () => {
            window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
        };
    }, []);
    const handleChangePassword = async (username, currentPassword, newPassword) => {
        try {
            await changeMyPasswordApi({
                currentPassword,
                newPassword,
            });
            return { ok: true };
        }
        catch (error) {
            return {
                ok: false,
                message: error instanceof Error ? error.message : 'Doi mat khau that bai',
            };
        }
    };
    const handleProfileUpdated = (fullName, avatar) => {
        const nextName = fullName.trim();
        if (nextName) {
            setCurrentUser(nextName);
        }
        setCurrentAvatar(avatar || '');
        const session = loadAuthSession();
        if (!session)
            return;
        saveAuthSession({
            ...session,
            fullName: nextName || session.fullName,
            avatar: avatar || '',
            department: session.department || '',
        });
    };
    useEffect(() => {
        const syncCurrentProfile = async () => {
            if (!isAuthenticated)
                return;
            try {
                const profile = await getMyProfileApi();
                const nextName = profile.fullName || currentUser;
                const nextAvatar = profile.hinhAnh || '';
                setCurrentUser(nextName);
                setCurrentAvatar(nextAvatar);
                const session = loadAuthSession();
                if (!session)
                    return;
                saveAuthSession({
                    ...session,
                    fullName: nextName,
                    avatar: nextAvatar,
                    permissions: profile.permissions || session.permissions || [],
                    role: profile.role || session.role,
                    department: profile.department || session.department || '',
                });
                setCurrentRole(profile.role || '');
                setCurrentDepartment(profile.department || '');
                setCurrentPermissions(profile.permissions || []);
            }
            catch (_error) {
            }
        };
        syncCurrentProfile();
    }, [isAuthenticated]);
    const handleIconNavigate = (iconId) => {
        const groupPagesMap = {
            dashboard: ['dashboard'],
            'personal-work': ['my-attendance', 'my-leave-requests', 'my-salary', 'profile', 'change-password'],
            employees: ['employees', 'position-salary', 'leave-operations', 'daily-attendance', 'salary-leave'],
            'stock-receipts': ['watch-categories', 'suppliers', 'stock-receipts', 'export-receipts', 'sales-report'],
            system: ['permission-management', 'user-management', 'backup-restore'],
        };
        const targetPage = (groupPagesMap[iconId] || []).find((page) => canAccessPage(page));
        if (!targetPage)
            return;
        if (iconId !== 'stock-receipts') {
            setWatchCategoryLowStockOnly(false);
            setTargetLowStockProductId(null);
        }
        setActivePage(targetPage);
    };
    const handleOpenLowStockProducts = () => {
        if (!canAccessPage('watch-categories'))
            return;
        setWatchCategoryLowStockOnly(true);
        setTargetLowStockProductId(null);
        setActivePage('watch-categories');
    };
    const handleOpenExportReceipts = () => {
        if (!canAccessPage('export-receipts'))
            return;
        setActivePage('export-receipts');
    };
    const handleOpenAttendanceShortcut = () => {
        if (!canAccessPage('my-attendance'))
            return;
        setTargetLowStockProductId(null);
        setWatchCategoryLowStockOnly(false);
        setActivePage('my-attendance');
    };
    const handleOpenNotification = (notification) => {
        const notificationId = String(notification?.id || '').toUpperCase();
        if (notificationId.startsWith('LOWSTOCK-')) {
            if (!canAccessPage('watch-categories'))
                return;
            const parsedProductId = Number(notificationId.replace('LOWSTOCK-', ''));
            setTargetLowStockProductId(Number.isInteger(parsedProductId) && parsedProductId > 0 ? parsedProductId : null);
            setWatchCategoryLowStockOnly(true);
            setActivePage('watch-categories');
            return;
        }
        if (notificationId.startsWith('LEAVE-')) {
            const targetPage = canAccessPage('leave-operations')
                ? 'leave-operations'
                : canAccessPage('my-leave-requests')
                    ? 'my-leave-requests'
                : canAccessPage('salary-leave')
                    ? 'salary-leave'
                    : 'my-salary';
            if (!canAccessPage(targetPage))
                return;
            setTargetLowStockProductId(null);
            setActivePage(targetPage);
            return;
        }
        if (notificationId.startsWith('ATTENDANCE-')) {
            if (!canAccessPage('my-attendance'))
                return;
            setTargetLowStockProductId(null);
            setWatchCategoryLowStockOnly(false);
            setActivePage('my-attendance');
            return;
        }
    };
    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard onOpenLowStockProducts={handleOpenLowStockProducts} onOpenExportReceipts={handleOpenExportReceipts}/>;
            case 'employees':
                return <EmployeeList />;
            case 'salary-leave':
                return <SalaryLeave />;
            case 'leave-operations':
                return <LeaveOperations />;
            case 'daily-attendance':
                return <DailyAttendance viewMode="manage"/>;
            case 'my-attendance':
                return <DailyAttendance viewMode="self"/>;
            case 'my-leave-requests':
                return <MyLeaveRequests />;
            case 'my-salary':
                return <MySalary />;
            case 'position-salary':
                return <PositionSalaryManagement />;
            case 'watch-categories':
                return (<WatchCategories lowStockOnly={watchCategoryLowStockOnly} targetLowStockProductId={targetLowStockProductId} onConsumeTargetLowStock={() => setTargetLowStockProductId(null)} onClearLowStockFilter={() => {
                        setWatchCategoryLowStockOnly(false);
                        setTargetLowStockProductId(null);
                    }}/>);
            case 'suppliers':
                return <Suppliers />;
            case 'stock-receipts':
                return <StockReceipts />;
            case 'export-receipts':
                return <ExportReceipts />;
            case 'sales-report':
                return <SalesReport />;
            case 'user-management':
                return <UserManagement />;
            case 'permission-management':
                return <PermissionManagement />;
            case 'backup-restore':
                return <BackupRestore />;
            case 'profile':
                return <PersonalProfile onProfileUpdated={handleProfileUpdated}/>;
            case 'change-password':
                return (<ChangePasswordPage username={currentUsername || currentUser} onChangePassword={handleChangePassword}/>);
            default:
                return <Dashboard onOpenLowStockProducts={handleOpenLowStockProducts} onOpenExportReceipts={handleOpenExportReceipts}/>;
        }
    };
    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin}/>;
    }
    return (<div className="h-screen w-full flex overflow-hidden bg-gray-100">
      {/* Left Icon Bar */}
      <IconBar activePage={activePage} onNavigate={handleIconNavigate} onLogout={handleLogout} allowedPages={allowedPages}/>

      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={(page) => {
            if (canAccessPage(page)) {
                setActivePage(page);
            }
        }} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} allowedPages={allowedPages}/>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header title={pageTitles[activePage] || 'Tổng quan'} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} currentUser={currentUser} currentUsername={currentUsername || currentUser} currentAvatar={currentAvatar} onOpenProfilePage={() => setActivePage('profile')} onOpenChangePasswordPage={() => setActivePage('change-password')} onOpenNotification={handleOpenNotification} onOpenAttendancePage={handleOpenAttendanceShortcut} showAttendanceShortcut={canAccessPage('my-attendance')}/>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {renderPage()}
        </main>
      </div>
    </div>);
}
