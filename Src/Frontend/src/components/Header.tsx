import {
  BellIcon,
  ChevronDownIcon,
  IdCardIcon,
  LockIcon,
  MailIcon,
  MenuIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
interface HeaderProps {
  title: string
  onToggleSidebar: () => void
  sidebarOpen: boolean
  currentUser: string
  onChangePassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
  ) => string | null
}
const notifications = [
  {
    id: 1,
    text: 'Đơn hàng mới HD006 từ Nguyễn Văn F',
    time: '5 phút trước',
    unread: true,
  },
  {
    id: 2,
    text: 'Sản phẩm Rolex Submariner sắp hết hàng',
    time: '15 phút trước',
    unread: true,
  },
  {
    id: 3,
    text: 'Nhân viên Trần B đã yêu cầu nghỉ phép',
    time: '1 giờ trước',
    unread: false,
  },
  {
    id: 4,
    text: 'Phiếu nhập kho PNK010 đã được duyệt',
    time: '2 giờ trước',
    unread: false,
  },
  {
    id: 5,
    text: 'Yêu cầu xuất kho PXH021 đang chờ duyệt',
    time: '3 giờ trước',
    unread: true,
  },
  {
    id: 6,
    text: 'Báo cáo doanh số tuần đã được tạo',
    time: 'Hôm qua',
    unread: false,
  },
  {
    id: 7,
    text: 'Tài khoản nhân viên mới vừa được thêm vào hệ thống',
    time: 'Hôm qua',
    unread: false,
  },
  {
    id: 8,
    text: 'Cảnh báo tồn kho thấp ở danh mục Đồng hồ cơ',
    time: '2 ngày trước',
    unread: false,
  },
]
export function Header({
  title,
  onToggleSidebar,
  sidebarOpen,
  currentUser,
  onChangePassword,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const profileTemplate = {
    fullName: currentUser === 'admin' ? 'Admin' : currentUser,
    account: currentUser,
    role: currentUser === 'admin' ? 'Quản trị viên' : 'Nhân sự',
    email: currentUser === 'admin' ? 'admin@sguwatch.vn' : `${currentUser}@sguwatch.vn`,
    phone: '0900000000',
  }

  const [profileForm, setProfileForm] = useState(profileTemplate)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const displayName = profileForm.fullName || currentUser

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setProfileForm(profileTemplate)
  }, [currentUser])

  const openProfileModal = () => {
    setShowProfile(false)
    setProfileMessage('')
    setShowProfileModal(true)
  }

  const openPasswordModal = () => {
    setShowProfile(false)
    setPasswordMessage('')
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setShowPasswordModal(true)
  }

  const saveProfileInfo = () => {
    if (!profileForm.fullName.trim()) {
      setProfileMessage('Họ tên không được để trống.')
      return
    }
    if (!profileForm.email.trim()) {
      setProfileMessage('Email không được để trống.')
      return
    }

    setProfileMessage('Cập nhật thông tin cá nhân thành công.')
  }

  const changePassword = () => {
    setPasswordMessage('')

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Mật khẩu xác nhận không khớp.')
      return
    }

    const result = onChangePassword(
      currentUser,
      passwordForm.currentPassword,
      passwordForm.newPassword,
    )

    if (result) {
      setPasswordMessage(result)
      return
    }

    setPasswordMessage('Đổi mật khẩu thành công.')
    setTimeout(() => {
      setShowPasswordModal(false)
    }, 500)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Mở sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfile(false)
            }}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Thông báo"
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] min-h-[18px]">
              {notifications.length}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h4 className="text-base font-semibold text-gray-900">
                  Thông báo
                </h4>
              </div>
              <div className="max-h-[380px] overflow-y-auto notification-scroll pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {n.text.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                      {n.unread && (
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative pl-3 border-l border-gray-200" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile((prev) => !prev)
              setShowNotifications(false)
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors"
            aria-label="Thông tin tài khoản"
          >
            <span className="text-sm font-semibold text-gray-800">{displayName}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-dark-900 to-dark-700 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-gold-300/60 bg-gold-500/30 flex items-center justify-center text-lg font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-tight">{displayName}</p>
                    <p className="text-sm text-gold-200">{profileForm.account}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
                    <IdCardIcon className="w-4 h-4" />
                    <p className="text-sm">
                      Họ tên: <span className="font-semibold text-gray-900">{displayName}</span>
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
                    <IdCardIcon className="w-4 h-4" />
                    <p className="text-sm">
                      Tài khoản:{' '}
                      <span className="font-semibold text-gray-900">{profileForm.account}</span>
                    </p>
                  </div>
                  <button
                    onClick={openProfileModal}
                    className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Thông tin cá nhân</span>
                  </button>
                  <button
                    onClick={openPasswordModal}
                    className="w-full px-4 py-3 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left"
                  >
                    <LockIcon className="w-4 h-4" />
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Thông tin cá nhân"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
            <div className="relative">
              <IdCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profileForm.account}
                disabled
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
              />
            </div>
          </div>

          {profileMessage && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {profileMessage}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              onClick={saveProfileInfo}
              className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Đổi mật khẩu"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
          </div>

          {passwordMessage && (
            <p
              className={`text-sm rounded-lg px-3 py-2 border ${passwordMessage.includes('thành công') ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}
            >
              {passwordMessage}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              onClick={changePassword}
              className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg"
            >
              Cập nhật mật khẩu
            </button>
          </div>
        </div>
      </Modal>
    </header>
  )
}
