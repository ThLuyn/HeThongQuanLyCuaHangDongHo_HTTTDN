import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { IconBar } from './components/IconBar'
import { Sidebar } from './components/Sidebar'
import { BackupRestore } from './pages/BackupRestore'
import { Dashboard } from './pages/Dashboard'
import { EmployeeList } from './pages/EmployeeList'
import { ExportReceipts } from './pages/ExportReceipts'
import { LoginPage } from './pages/LoginPage'
import { SalaryLeave } from './pages/SalaryLeave'
import { SalesReport } from './pages/SalesReport'
import { StockReceipts } from './pages/StockReceipts'
import { Suppliers } from './pages/Suppliers'
import { UserManagement } from './pages/UserManagement'
import { WatchCategories } from './pages/WatchCategories'
import { clearAuthSession, loadAuthSession, saveAuthSession } from './utils/authStorage'
import { loginApi } from './utils/backendApi'

const pageTitles: Record<string, string> = {
  dashboard: 'Tổng quan',
  employees: 'Danh sách nhân viên',
  'salary-leave': 'Tính lương & Nghỉ phép',
  'watch-categories': 'Sản phẩm',
  suppliers: 'Nhà cung cấp',
  'stock-receipts': 'Phiếu nhập kho',
  'export-receipts': 'Phiếu xuất hàng',
  'sales-report': 'Báo cáo doanh số',
  'user-management': 'Quản lý User',
  'backup-restore': 'Sao lưu & Phục hồi',
}
export function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    const session = loadAuthSession()
    if (!session) return

    setIsAuthenticated(true)
    setCurrentUser(session.fullName || session.username)
  }, [])

  const handleLogin = async (
    username: string,
    password: string,
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const loginData = await loginApi(username, password)

      saveAuthSession({
        accessToken: loginData.accessToken,
        username: loginData.user.username,
        fullName: loginData.user.fullName,
        role: loginData.user.role,
        mnv: loginData.user.mnv,
      })

      setIsAuthenticated(true)
      setCurrentUser(loginData.user.fullName || loginData.user.username)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Dang nhap that bai',
      }
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setIsAuthenticated(false)
    setCurrentUser('')
    setActivePage('dashboard')
  }

  const handleChangePassword = (
    username: string,
    currentPassword: string,
    newPassword: string,
  ): string | null => {
    return 'Chuc nang doi mat khau backend chua duoc bo sung.'
  }
  const handleIconNavigate = (iconId: string) => {
    const pageMap: Record<string, string> = {
      dashboard: 'dashboard',
      employees: 'employees',
      'stock-receipts': 'watch-categories',
      system: 'user-management',
    }
    setActivePage(pageMap[iconId] || 'dashboard')
  }
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'employees':
        return <EmployeeList />
      case 'salary-leave':
        return <SalaryLeave />
      case 'watch-categories':
        return <WatchCategories />
      case 'suppliers':
        return <Suppliers />
      case 'stock-receipts':
        return <StockReceipts />
      case 'export-receipts':
        return <ExportReceipts />
      case 'sales-report':
        return <SalesReport />
      case 'user-management':
        return <UserManagement />
      case 'backup-restore':
        return <BackupRestore />
      default:
        return <Dashboard />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-100">
      {/* Left Icon Bar */}
      <IconBar
        activePage={activePage}
        onNavigate={handleIconNavigate}
        onLogout={handleLogout}
      />

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitles[activePage] || 'Tổng quan'}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          currentUser={currentUser}
          onChangePassword={handleChangePassword}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
