// @ts-nocheck
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { IconBar } from './components/IconBar';
import { Sidebar } from './components/Sidebar';
import { BackupRestore } from './pages/BackupRestore';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { Dashboard } from './pages/Dashboard';
import { EmployeeList } from './pages/EmployeeList';
import { ExportReceipts } from './pages/ExportReceipts';
import { LoginPage } from './pages/LoginPage';
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
const pageTitles = {
    dashboard: 'Tổng quan',
    employees: 'Danh sách nhân viên',
    'salary-leave': 'Tính lương & Nghỉ phép',
    'position-salary': 'Chức vụ & Lương',
    'watch-categories': 'Sản phẩm',
    suppliers: 'Nhà cung cấp',
    'stock-receipts': 'Phiếu nhập kho',
    'export-receipts': 'Phiếu xuất hàng',
    'sales-report': 'Báo cáo doanh số',
    'user-management': 'Quản lý User',
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
    const [watchCategoryLowStockOnly, setWatchCategoryLowStockOnly] = useState(false);
    const [targetLowStockProductId, setTargetLowStockProductId] = useState(null);
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
            });
            setIsAuthenticated(true);
            setCurrentUser(loginData.user.fullName || loginData.user.username);
            setCurrentUsername(loginData.user.username);
            setCurrentAvatar(loginData.user.hinhAnh || '');
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
        setActivePage('dashboard');
    };
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
                });
            }
            catch (_error) {
            }
        };
        syncCurrentProfile();
    }, [isAuthenticated]);
    const handleIconNavigate = (iconId) => {
        const pageMap = {
            dashboard: 'dashboard',
            employees: 'employees',
            'stock-receipts': 'watch-categories',
            system: 'user-management',
        };
        if (iconId !== 'stock-receipts') {
            setWatchCategoryLowStockOnly(false);
            setTargetLowStockProductId(null);
        }
        setActivePage(pageMap[iconId] || 'dashboard');
    };
    const handleOpenLowStockProducts = () => {
        setWatchCategoryLowStockOnly(true);
        setTargetLowStockProductId(null);
        setActivePage('watch-categories');
    };
    const handleOpenExportReceipts = () => {
        setActivePage('export-receipts');
    };
    const handleOpenNotification = (notification) => {
        const notificationId = String(notification?.id || '').toUpperCase();
        if (notificationId.startsWith('LOWSTOCK-')) {
            const parsedProductId = Number(notificationId.replace('LOWSTOCK-', ''));
            setTargetLowStockProductId(Number.isInteger(parsedProductId) && parsedProductId > 0 ? parsedProductId : null);
            setWatchCategoryLowStockOnly(true);
            setActivePage('watch-categories');
            return;
        }
        if (notificationId.startsWith('LEAVE-')) {
            setTargetLowStockProductId(null);
            setActivePage('salary-leave');
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
      <IconBar activePage={activePage} onNavigate={handleIconNavigate} onLogout={handleLogout}/>

      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}/>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={pageTitles[activePage] || 'Tổng quan'} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} currentUser={currentUser} currentUsername={currentUsername || currentUser} currentAvatar={currentAvatar} onOpenProfilePage={() => setActivePage('profile')} onOpenChangePasswordPage={() => setActivePage('change-password')} onOpenNotification={handleOpenNotification}/>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {renderPage()}
        </main>
      </div>
    </div>);
}
