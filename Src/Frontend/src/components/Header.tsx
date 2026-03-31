// @ts-nocheck
import { BellIcon, ChevronDownIcon, IdCardIcon, LockIcon, MenuIcon, } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import anhthe from '../assets/anhthe.jpg';
import { resolveImageSource } from '../utils/imageSource';
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
];
export function Header({ title, onToggleSidebar, sidebarOpen, currentUser, currentUsername, currentAvatar, onOpenProfilePage, onOpenChangePasswordPage, }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const profileTemplate = {
        fullName: currentUser === 'admin' ? 'Admin' : currentUser,
        account: currentUsername,
        role: currentUser === 'admin' ? 'Quản trị viên' : 'Nhân sự',
        email: currentUser === 'admin' ? 'admin@sguwatch.vn' : `${currentUser}@sguwatch.vn`,
        phone: '0900000000',
    };
    const [profileForm, setProfileForm] = useState(profileTemplate);
    const displayName = profileForm.fullName || currentUser;
    const avatarSrc = resolveImageSource(currentAvatar) || anhthe;
    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);
    useEffect(() => {
        setProfileForm(profileTemplate);
    }, [currentUser]);
    const openProfilePage = () => {
        setShowProfile(false);
        onOpenProfilePage();
    };
    const openChangePasswordPage = () => {
        setShowProfile(false);
        onOpenChangePasswordPage();
    };
    return (<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (<button onClick={onToggleSidebar} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Mở sidebar">
            <MenuIcon className="w-5 h-5"/>
          </button>)}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => {
            setShowNotifications(!showNotifications);
            setShowProfile(false);
        }} className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Thông báo">
            <BellIcon className="w-5 h-5"/>
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] min-h-[18px]">
              {notifications.length}
            </span>
          </button>

          {showNotifications && (<div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h4 className="text-base font-semibold text-gray-900">
                  Thông báo
                </h4>
              </div>
              <div className="max-h-[380px] overflow-y-auto notification-scroll pr-1">
                {notifications.map((n) => (<div key={n.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {n.text.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                      {n.unread && (<span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"/>)}
                    </div>
                  </div>))}
              </div>
            </div>)}
        </div>

        {/* User */}
        <div className="relative pl-3 border-l border-gray-200" ref={profileRef}>
          <button onClick={() => {
            setShowProfile((prev) => !prev);
            setShowNotifications(false);
        }} className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors" aria-label="Thông tin tài khoản">
            <span className="text-sm font-semibold text-gray-800">{displayName}</span>
            <img src={avatarSrc} alt="Ảnh đại diện" className="w-9 h-9 rounded-full border border-gold-200 object-cover shadow-md"/>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`}/>
          </button>

          {showProfile && (<div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-dark-900 to-dark-700 text-white">
                <div className="flex items-center gap-3">
                  <img src={avatarSrc} alt="Ảnh đại diện" className="w-12 h-12 rounded-full border-2 border-gold-300/60 object-cover"/>
                  <div>
                    <p className="text-base font-semibold leading-tight">{displayName}</p>
                    <p className="text-sm text-gold-200">{profileForm.account}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
                    <IdCardIcon className="w-4 h-4"/>
                    <p className="text-sm">
                      Họ tên: <span className="font-semibold text-gray-900">{displayName}</span>
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
                    <IdCardIcon className="w-4 h-4"/>
                    <p className="text-sm">
                      Tài khoản:{' '}
                      <span className="font-semibold text-gray-900">{profileForm.account}</span>
                    </p>
                  </div>
                  <button onClick={openProfilePage} className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left">
                    <IdCardIcon className="w-4 h-4"/>
                    <span>Thông tin cá nhân</span>
                  </button>
                  <button onClick={openChangePasswordPage} className="w-full px-4 py-3 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left">
                    <LockIcon className="w-4 h-4"/>
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>
              </div>
            </div>)}
        </div>
      </div>

    </header>);
}
