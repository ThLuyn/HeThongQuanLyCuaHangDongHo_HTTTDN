// @ts-nocheck
import { useEffect, useState } from 'react';
import { PermissionProvider } from './components/PermissionContext';
import { Header } from './components/Header';
import { IconBar } from './components/IconBar';
import { Sidebar } from './components/Sidebar';
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
import { refreshSilently, setAccessToken } from './utils/apiClient';
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
    'stock-receipts': 'Nhập kho',
    'export-receipts': 'Xuất hàng',
    'sales-report': 'Báo cáo doanh số',
    'user-management': 'Quản lý tài khoản người dùng',
    'permission-management': 'Phân quyền hệ thống',
    profile: 'Thông tin cá nhân',
    'change-password': 'Đổi mật khẩu',
};

export function App() {
    const initialSession = loadAuthSession();
    const initialMnq = initialSession?.mnq || 0;
    const savedPage = localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) || 'dashboard';
    const initialActivePage =
        savedPage === 'dashboard' && Number(initialMnq) !== 1 ? 'my-attendance' : savedPage;

    const [activePage, setActivePage] = useState(initialActivePage);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialSession));
    const [currentUser, setCurrentUser] = useState(initialSession?.fullName || initialSession?.username || '');
    const [currentUsername, setCurrentUsername] = useState(initialSession?.username || '');
    const [currentAvatar, setCurrentAvatar] = useState(initialSession?.avatar || '');
    const [currentRole, setCurrentRole] = useState(initialSession?.role || '');
    const [currentDepartment, setCurrentDepartment] = useState(initialSession?.department || '');
    const [currentPermissions, setCurrentPermissions] = useState(initialSession?.permissions || []);
    const [currentMnv, setCurrentMnv] = useState(initialSession?.mnv || 0);
    const [currentMnq, setCurrentMnq] = useState(initialSession?.mnq || 0);
    const [authReady, setAuthReady] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [watchCategoryLowStockOnly, setWatchCategoryLowStockOnly] = useState(false);
    const [targetLowStockProductId, setTargetLowStockProductId] = useState(null);
    const [targetLeaveId, setTargetLeaveId] = useState(null);

    // ─── Bootstrap: khôi phục accessToken từ refreshToken cookie khi reload ──────
    // [FIX] Sau khi refreshSilently() thành công, bắt buộc gọi getMyProfileApi()
    // để lấy thông tin user THẬT từ server dựa trên token mới.
    // Tránh trường hợp cookie của user khác (vd: admin) còn tồn tại trong browser
    // nhưng localStorage lại lưu session của user hiện tại (vd: nhanvien02),
    // dẫn đến hiển thị sai tên/quyền sau khi reload.
    useEffect(() => {
        const bootstrap = async () => {
            if (initialSession) {
                let result = await refreshSilently();

                // Nếu lỗi network, thử lại 1 lần sau 2 giây
                if (!result.ok && result.reason === 'network_error') {
                    await new Promise((r) => setTimeout(r, 2000));
                    result = await refreshSilently();
                }

                if (result.ok) {
                    // [FIX] Lấy lại profile thật từ server để đảm bảo đồng bộ
                    // với refreshToken cookie đang được dùng — không tin localStorage
                    try {
                        const profile = await getMyProfileApi();
                        const freshMnq = profile.mnq != null ? Number(profile.mnq) : 0;
                        const freshSession = {
                            username: profile.username || initialSession.username,
                            fullName: profile.fullName || initialSession.fullName,
                            avatar: profile.hinhAnh || '',
                            role: profile.role || initialSession.role,
                            department: profile.department || initialSession.department || '',
                            mnv: profile.mnv || initialSession.mnv || 0,
                            mnq: freshMnq,
                            permissions: profile.permissions || [],
                        };
                        saveAuthSession(freshSession);
                        setCurrentUser(freshSession.fullName || freshSession.username);
                        setCurrentUsername(freshSession.username);
                        setCurrentAvatar(freshSession.avatar);
                        setCurrentRole(freshSession.role);
                        setCurrentDepartment(freshSession.department);
                        setCurrentPermissions(freshSession.permissions);
                        setCurrentMnv(freshSession.mnv);
                        setCurrentMnq(freshMnq);

                        // Điều chỉnh trang mặc định theo đúng quyền của user thật
                        const currentSavedPage = localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
                        if (!currentSavedPage || currentSavedPage === 'dashboard') {
                            setActivePage(freshMnq === 1 ? 'dashboard' : 'my-attendance');
                        }
                    } catch (_) {
                        // Nếu getMyProfileApi lỗi, giữ session cũ — không logout
                    }
                } else if (result.reason === 'unauthorized') {
                    // RefreshToken hết hạn thật sự → xóa session, buộc login lại
                    clearAuthSession();
                    setIsAuthenticated(false);
                }
                // network_error lần 2: vẫn giữ session.
                // apiRequest() sẽ tự retry với refreshAccessToken() khi nhận 401.
            }
            setAuthReady(true);
        };
        bootstrap();
    }, []); // chỉ chạy 1 lần khi app mount

    // ─── isAdmin & hasPermission ──────────────────────────────────────────────
    const isAdmin = Number(currentMnq) === 1;

    const hasPermission = (mcn, action = 'view') =>
        currentPermissions.some(
            (item) =>
                String(item?.mcn || '').toLowerCase() === String(mcn).toLowerCase() &&
                String(item?.hanhDong || '').toLowerCase() === String(action).toLowerCase(),
        );

    const hasAnyPermission = (mcn, actions = []) =>
        actions.some((action) => hasPermission(mcn, action));

    // ─── canAccessPage ────────────────────────────────────────────────────────
    const canAccessPage = (pageId, mnqOverride) => {
        if (pageId === 'dashboard') {
            const effectiveMnq = mnqOverride !== undefined ? mnqOverride : Number(currentMnq);
            return effectiveMnq === 1;
        }
        if (['profile', 'change-password', 'my-attendance', 'my-leave-requests', 'my-salary'].includes(pageId)) {
            return true;
        }
        if (isAdmin) return true;

        switch (pageId) {
            case 'employees':
                return hasAnyPermission('nhanvien', ['create', 'update', 'delete']);
            case 'position-salary':
                return hasAnyPermission('chucvu', ['create', 'update', 'delete']);
            case 'salary-leave':
                return hasAnyPermission('bangluong', ['create', 'update', 'export']);
            case 'leave-operations':
                return hasAnyPermission('donxinngh', ['approve', 'update']);
            case 'daily-attendance':
                return hasAnyPermission('phancalam', ['create', 'update', 'delete']) ||
                    hasAnyPermission('chamcong', ['create', 'update']);
            case 'watch-categories':    return hasPermission('sanpham',    'view');
            case 'suppliers':           return hasPermission('nhacungcap', 'view');
            case 'stock-receipts':      return hasPermission('phieunhap',  'view');
            case 'export-receipts':     return hasPermission('phieuxuat',  'view');
            case 'sales-report':        return hasPermission('thongke',    'view');
            case 'permission-management': return hasPermission('nhomquyen', 'view');
            case 'user-management':     return hasPermission('taikhoan',   'view');
            case 'backup-restore':
                return hasPermission('thongke', 'export') || hasPermission('thongke', 'view');
            default: return false;
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

    // Redirect nếu quyền bị thay đổi và trang hiện tại không còn được phép
    useEffect(() => {
        if (!isAuthenticated) return;
        if (!canAccessPage(activePage, Number(currentMnq))) {
            setActivePage(findFirstAllowedPage());
        }
    }, [currentPermissions, currentRole, currentMnq]);

    useEffect(() => {
        localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
    }, [activePage]);

    // ─── handleLogin ──────────────────────────────────────────────────────────
    const handleLogin = async (username, password) => {
        try {
            const loginData = await loginApi(username, password);
            setAccessToken(loginData.accessToken);
            saveAuthSession({
                username: loginData.user.username,
                fullName: loginData.user.fullName,
                avatar: loginData.user.hinhAnh || '',
                role: loginData.user.role,
                mnv: loginData.user.mnv,
                mnq: loginData.user.mnq || 0,
                permissions: loginData.user.permissions || [],
            });
            setSessionExpired(false);
            setIsAuthenticated(true);
            setCurrentUser(loginData.user.fullName || loginData.user.username);
            setCurrentUsername(loginData.user.username);
            setCurrentAvatar(loginData.user.hinhAnh || '');
            setCurrentRole(loginData.user.role || '');
            setCurrentDepartment(loginData.user.department || '');
            setCurrentPermissions(loginData.user.permissions || []);
            setCurrentMnv(loginData.user.mnv || 0);

            let resolvedMnq = Number(loginData.user.mnq) || 0;
            if (!resolvedMnq) {
                try {
                    const profile = await getMyProfileApi();
                    resolvedMnq = Number(profile.mnq) || 0;
                } catch (_) {}
            }
            setCurrentMnq(resolvedMnq);
            const session = loadAuthSession();
            if (session) saveAuthSession({ ...session, mnq: resolvedMnq });

            const defaultPage = resolvedMnq === 1 ? 'dashboard' : 'my-attendance';
            setActivePage(defaultPage);
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                message: error instanceof Error ? error.message : 'Đăng nhập thất bại',
            };
        }
    };

    // ─── handleLogout ─────────────────────────────────────────────────────────
    const handleLogout = () => setShowLogoutConfirm(true);

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        setAccessToken(null);
        clearAuthSession();
        localStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
        setIsAuthenticated(false);
        setCurrentUser('');
        setCurrentUsername('');
        setCurrentAvatar('');
        setCurrentRole('');
        setCurrentDepartment('');
        setCurrentPermissions([]);
        setCurrentMnq(0);
        setActivePage('my-attendance');
    };

    // ─── AUTH_EXPIRED_EVENT ───────────────────────────────────────────────────
    useEffect(() => {
        const onAuthExpired = () => {
            setAccessToken(null);
            clearAuthSession();
            localStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
            setIsAuthenticated(false);
            setCurrentUser('');
            setCurrentUsername('');
            setCurrentAvatar('');
            setCurrentRole('');
            setCurrentDepartment('');
            setCurrentPermissions([]);
            setCurrentMnq(0);
            setActivePage('my-attendance');
            setSessionExpired(true);
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    }, []);

    // ─── handleChangePassword ─────────────────────────────────────────────────
    const handleChangePassword = async (username, currentPassword, newPassword) => {
        try {
            await changeMyPasswordApi({ currentPassword, newPassword });
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                message: error instanceof Error ? error.message : 'Đổi mật khẩu thất bại',
            };
        }
    };

    // ─── handleProfileUpdated ─────────────────────────────────────────────────
    const handleProfileUpdated = (fullName, avatar) => {
        const nextName = fullName.trim();
        if (nextName) setCurrentUser(nextName);
        setCurrentAvatar(avatar || '');
        const session = loadAuthSession();
        if (!session) return;
        saveAuthSession({
            ...session,
            fullName: nextName || session.fullName,
            avatar: avatar || '',
            department: session.department || '',
        });
    };

    // Đồng bộ profile sau khi mount (lấy lại quyền mới nhất từ server)
    useEffect(() => {
        const syncCurrentProfile = async () => {
            if (!isAuthenticated) return;
            try {
                const profile = await getMyProfileApi();
                const nextName = profile.fullName || currentUser;
                const nextAvatar = profile.hinhAnh || '';
                setCurrentUser(nextName);
                setCurrentAvatar(nextAvatar);
                const session = loadAuthSession();
                if (!session) return;
                const nextMnq = profile.mnq != null ? Number(profile.mnq) : session.mnq || 0;
                saveAuthSession({
                    ...session,
                    fullName: nextName,
                    avatar: nextAvatar,
                    permissions: profile.permissions || session.permissions || [],
                    role: profile.role || session.role,
                    department: profile.department || session.department || '',
                    mnq: nextMnq,
                });
                setCurrentMnq(nextMnq);
                setCurrentRole(profile.role || '');
                setCurrentDepartment(profile.department || '');
                setCurrentPermissions(profile.permissions || []);
            } catch (_) {}
        };
        syncCurrentProfile();
    }, [isAuthenticated]);

    // ─── Navigation handlers ──────────────────────────────────────────────────
    const handleIconNavigate = (iconId) => {
        const groupPagesMap = {
            dashboard: ['dashboard'],
            'personal-work': ['my-attendance', 'my-leave-requests', 'my-salary', 'profile', 'change-password'],
            employees: ['employees', 'position-salary', 'leave-operations', 'daily-attendance', 'salary-leave'],
            'stock-receipts': ['watch-categories', 'suppliers', 'stock-receipts', 'export-receipts', 'sales-report'],
            system: ['permission-management', 'user-management', 'backup-restore'],
        };
        const targetPage = (groupPagesMap[iconId] || []).find((page) => canAccessPage(page));
        if (!targetPage) return;
        if (iconId !== 'stock-receipts') {
            setWatchCategoryLowStockOnly(false);
            setTargetLowStockProductId(null);
        }
        setActivePage(targetPage);
    };

    const handleOpenLowStockProducts = () => {
        if (!canAccessPage('watch-categories')) return;
        setWatchCategoryLowStockOnly(true);
        setTargetLowStockProductId(null);
        setActivePage('watch-categories');
    };

    const handleOpenExportReceipts = () => {
        if (!canAccessPage('export-receipts')) return;
        setActivePage('export-receipts');
    };

    const handleOpenAttendanceShortcut = () => {
        if (!canAccessPage('my-attendance')) return;
        setTargetLowStockProductId(null);
        setWatchCategoryLowStockOnly(false);
        setActivePage('my-attendance');
    };

    const handleOpenNotification = (notification) => {
        const type = String(notification?.type || '');
        const sourceId = Number(notification?.sourceId || 0);

        if (type === 'low_stock') {
            if (!canAccessPage('watch-categories')) return;
            setTargetLowStockProductId(sourceId > 0 ? sourceId : null);
            setWatchCategoryLowStockOnly(true);
            setTargetLeaveId(null);
            setActivePage('watch-categories');
            return;
        }

        if (type === 'leave') {
            const targetPage = canAccessPage('leave-operations')
                ? 'leave-operations'
                : canAccessPage('my-leave-requests')
                ? 'my-leave-requests'
                : null;
            if (!targetPage) return;
            setTargetLeaveId(sourceId > 0 ? sourceId : null);
            setTargetLowStockProductId(null);
            setWatchCategoryLowStockOnly(false);
            setActivePage(targetPage);
        }
    };

    // ─── renderPage ───────────────────────────────────────────────────────────
    const renderPage = () => {
        if (!canAccessPage(activePage)) {
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                        <p className="text-lg font-semibold text-gray-700">
                            Bạn không có quyền truy cập trang này.
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                            Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.
                        </p>
                    </div>
                </div>
            );
        }

        switch (activePage) {
            case 'dashboard':
                return (
                    <Dashboard
                        onOpenLowStockProducts={handleOpenLowStockProducts}
                        onOpenExportReceipts={handleOpenExportReceipts}
                    />
                );
            case 'employees':
                return <EmployeeList currentMnv={currentMnv} />;
            case 'salary-leave':
                return <SalaryLeave />;
            case 'leave-operations':
                return (
                    <LeaveOperations
                        targetLeaveId={targetLeaveId}
                        onConsumeTargetLeave={() => setTargetLeaveId(null)}
                    />
                );
            case 'daily-attendance':
                return <DailyAttendance viewMode="manage" />;
            case 'my-attendance':
                return <DailyAttendance viewMode="self" />;
            case 'my-leave-requests':
                return <MyLeaveRequests />;
            case 'my-salary':
                return <MySalary />;
            case 'position-salary':
                return <PositionSalaryManagement />;
            case 'watch-categories':
                return (
                    <WatchCategories
                        lowStockOnly={watchCategoryLowStockOnly}
                        targetLowStockProductId={targetLowStockProductId}
                        onConsumeTargetLowStock={() => setTargetLowStockProductId(null)}
                        onClearLowStockFilter={() => {
                            setWatchCategoryLowStockOnly(false);
                            setTargetLowStockProductId(null);
                        }}
                    />
                );
            case 'suppliers':
                return <Suppliers />;
            case 'stock-receipts':
                return <StockReceipts />;
            case 'export-receipts':
                return <ExportReceipts />;
            case 'sales-report':
                return <SalesReport />;
            case 'user-management':
                return <UserManagement currentUsername={currentUsername} />;
            case 'permission-management':
                return <PermissionManagement />;
            case 'profile':
                return <PersonalProfile onProfileUpdated={handleProfileUpdated} />;
            case 'change-password':
                return (
                    <ChangePasswordPage
                        username={currentUsername || currentUser}
                        onChangePassword={handleChangePassword}
                    />
                );
            default:
                return (
                    <Dashboard
                        onOpenLowStockProducts={handleOpenLowStockProducts}
                        onOpenExportReceipts={handleOpenExportReceipts}
                    />
                );
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    if (!authReady) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-100">
                <div className="text-gray-400 text-sm">Đang tải...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <LoginPage onLogin={handleLogin} />
        );
    }

    return (
        <PermissionProvider isAdmin={isAdmin} permissions={currentPermissions}>
            <div className="h-screen w-full flex overflow-hidden bg-gray-100">
                {/* Logout Confirm Dialog */}
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-7 h-7 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận</h2>
                            <p className="text-gray-500 text-sm text-center mb-6">
                                Đăng xuất khỏi tài khoản của bạn?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Left Icon Bar */}
                <IconBar
                    activePage={activePage}
                    onNavigate={handleIconNavigate}
                    onLogout={handleLogout}
                    allowedPages={allowedPages}
                    isVisible={!sidebarOpen}
                />

                {/* Sidebar */}
                <Sidebar
                    activePage={activePage}
                    onLogout={handleLogout}
                    currentMnq={currentMnq}
                    currentRole={currentRole}
                    onNavigate={(page) => {
                        if (canAccessPage(page)) setActivePage(page);
                    }}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    allowedPages={allowedPages}
                />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Header
                        title={pageTitles[activePage] || 'Tổng quan'}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        sidebarOpen={sidebarOpen}
                        currentUser={currentUser}
                        currentUsername={currentUsername || currentUser}
                        currentAvatar={currentAvatar}
                        onOpenProfilePage={() => setActivePage('profile')}
                        onOpenChangePasswordPage={() => setActivePage('change-password')}
                        onOpenNotification={handleOpenNotification}
                        onOpenAttendancePage={handleOpenAttendanceShortcut}
                        showAttendanceShortcut={canAccessPage('my-attendance')}
                        currentMnv={currentMnv}
                    />
                    <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </PermissionProvider>
    );
}
