// // @ts-nocheck
// import { BellIcon, ChevronDownIcon, Clock3Icon, IdCardIcon, LockIcon, MenuIcon, } from 'lucide-react';
// import { useEffect, useMemo, useRef, useState } from 'react';
// import anhthe from '../assets/anhthe.jpg';
// import { getHeaderNotificationsApi } from '../utils/backendApi';
// import { resolveImageSource } from '../utils/imageSource';
// export function Header({ title, onToggleSidebar, sidebarOpen, currentUser, currentUsername, currentAvatar, onOpenProfilePage, onOpenChangePasswordPage, onOpenNotification, onOpenAttendancePage, showAttendanceShortcut = false, }) {
//     const [showNotifications, setShowNotifications] = useState(false);
//     const [showProfile, setShowProfile] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//     const notifRef = useRef(null);
//     const profileRef = useRef(null);
//     const profileTemplate = {
//         fullName: currentUser === 'admin' ? 'Admin' : currentUser,
//         account: currentUsername,
//         role: currentUser === 'admin' ? 'Quản trị viên' : 'Nhân sự',
//         email: currentUser === 'admin' ? 'admin@sguwatch.vn' : `${currentUser}@sguwatch.vn`,
//         phone: '0900000000',
//     };
//     const [profileForm, setProfileForm] = useState(profileTemplate);
//     const displayName = profileForm.fullName || currentUser;
//     const avatarSrc = resolveImageSource(currentAvatar) || anhthe;
//     useEffect(() => {
//         const handleClick = (e) => {
//             if (notifRef.current && !notifRef.current.contains(e.target)) {
//                 setShowNotifications(false);
//             }
//             if (profileRef.current && !profileRef.current.contains(e.target)) {
//                 setShowProfile(false);
//             }
//         };
//         document.addEventListener('mousedown', handleClick);
//         return () => document.removeEventListener('mousedown', handleClick);
//     }, []);
//     useEffect(() => {
//         setProfileForm(profileTemplate);
//     }, [currentUser]);
//     useEffect(() => {
//       const loadNotifications = async () => {
//         try {
//           const rows = await getHeaderNotificationsApi();
//           setNotifications(rows || []);
//         }
//         catch (_error) {
//           setNotifications([]);
//         }
//       };
//       loadNotifications();
//     }, []);
//     const formatNotificationTime = (value) => {
//       if (!value)
//         return 'Hiện tại';
//       const date = new Date(value);
//       if (Number.isNaN(date.getTime()))
//         return 'Hiện tại';
//       return date.toLocaleString('vi-VN', {
//         hour: '2-digit',
//         minute: '2-digit',
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//       });
//     };
//     const orderedNotifications = useMemo(() => {
//       const toTimestamp = (value) => {
//         if (!value)
//           return 0;
//         const date = new Date(value);
//         return Number.isNaN(date.getTime()) ? 0 : date.getTime();
//       };
//       return [...notifications].sort((a, b) => {
//         const unreadDelta = Number(Boolean(b.unread)) - Number(Boolean(a.unread));
//         if (unreadDelta !== 0)
//           return unreadDelta;
//         return toTimestamp(b.time) - toTimestamp(a.time);
//       });
//     }, [notifications]);
//     const unreadCount = notifications.filter((n) => n.unread).length;
//     const handleNotificationClick = (notification) => {
//       setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, unread: false } : item));
//       setShowNotifications(false);
//       if (typeof onOpenNotification === 'function') {
//         onOpenNotification(notification);
//       }
//     };
//     const openProfilePage = () => {
//         setShowProfile(false);
//         onOpenProfilePage();
//     };
//     const openChangePasswordPage = () => {
//         setShowProfile(false);
//         onOpenChangePasswordPage();
//     };
//     return (<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
//       <div className="flex items-center gap-4">
//         {!sidebarOpen && (<button onClick={onToggleSidebar} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Mở sidebar">
//             <MenuIcon className="w-5 h-5"/>
//           </button>)}
//         <h1 className="text-xl font-bold text-gray-900">{title}</h1>
//       </div>

//       <div className="flex items-center gap-4">
//         {showAttendanceShortcut ? (<button onClick={() => {
//           setShowNotifications(false);
//           setShowProfile(false);
//           if (typeof onOpenAttendancePage === 'function') {
//             onOpenAttendancePage();
//           }
//         }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 border border-gray-200 hover:text-gold-700 hover:bg-gold-50 hover:border-gold-200 transition-colors" aria-label="Mở trang chấm công" title="Chấm công">
//           <Clock3Icon className="w-4 h-4"/>
//           <span className="text-sm font-medium">Chấm công</span>
//           </button>) : null}
//         {/* Notifications */}
//         <div className="relative" ref={notifRef}>
//           <button onClick={() => {
//             setShowNotifications(!showNotifications);
//             setShowProfile(false);
//         }} className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Thông báo">
//             <BellIcon className="w-5 h-5"/>
//             <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] min-h-[18px]">
//               {unreadCount}
//             </span>
//           </button>

//           {showNotifications && (<div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
//                 <h4 className="text-base font-semibold text-gray-900">
//                   Thông báo
//                 </h4>
//               </div>
//               <div className="max-h-[380px] overflow-y-auto notification-scroll pr-1">
//                 {orderedNotifications.length === 0 ? (<div className="px-4 py-6 text-center text-sm text-gray-500">Không có thông báo mới</div>) : (orderedNotifications.map((n) => (<div key={n.id} onClick={() => handleNotificationClick(n)} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
//                     <div className="flex items-start gap-3">
//                       <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
//                         {n.text.charAt(0)}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
//                         <p className="text-xs text-gray-400 mt-1">{formatNotificationTime(n.time)}</p>
//                       </div>
//                       {n.unread && (<span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"/>)}
//                     </div>
//                   </div>)))}
//               </div>
//             </div>)}
//         </div>

//         {/* User */}
//         <div className="relative pl-3 border-l border-gray-200" ref={profileRef}>
//           <button onClick={() => {
//             setShowProfile((prev) => !prev);
//             setShowNotifications(false);
//         }} className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors" aria-label="Thông tin tài khoản">
//             <span className="text-sm font-semibold text-gray-800">{displayName}</span>
//             <img src={avatarSrc} alt="Ảnh đại diện" className="w-9 h-9 rounded-full border border-gold-200 object-cover shadow-md"/>
//             <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`}/>
//           </button>

//           {showProfile && (<div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
//               <div className="px-5 py-4 bg-gradient-to-r from-dark-900 to-dark-700 text-white">
//                 <div className="flex items-center gap-3">
//                   <img src={avatarSrc} alt="Ảnh đại diện" className="w-12 h-12 rounded-full border-2 border-gold-300/60 object-cover"/>
//                   <div>
//                     <p className="text-base font-semibold leading-tight">{displayName}</p>
//                     <p className="text-sm text-gold-200">{profileForm.account}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="p-3 bg-gray-50">
//                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                   <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
//                     <IdCardIcon className="w-4 h-4"/>
//                     <p className="text-sm">
//                       Họ tên: <span className="font-semibold text-gray-900">{displayName}</span>
//                     </p>
//                   </div>
//                   <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
//                     <IdCardIcon className="w-4 h-4"/>
//                     <p className="text-sm">
//                       Tài khoản:{' '}
//                       <span className="font-semibold text-gray-900">{profileForm.account}</span>
//                     </p>
//                   </div>
//                   <button onClick={openProfilePage} className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left">
//                     <IdCardIcon className="w-4 h-4"/>
//                     <span>Thông tin cá nhân</span>
//                   </button>
//                   <button onClick={openChangePasswordPage} className="w-full px-4 py-3 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left">
//                     <LockIcon className="w-4 h-4"/>
//                     <span>Đổi mật khẩu</span>
//                   </button>
//                 </div>
//               </div>
//             </div>)}
//         </div>
//       </div>

//     </header>);
// }
// @ts-nocheck
import { BellIcon, CalendarCheckIcon, ChevronDownIcon, Clock3Icon, IdCardIcon, LockIcon, MenuIcon, PackageIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import anhthe from '../assets/anhthe.jpg';
import { resolveImageSource } from '../utils/imageSource';

// localStorage helpers — persist trạng thái đã đọc theo mnv, không cần DB
function getReadKey(mnv) { return `read_notif_${mnv}`; }
function loadReadSet(mnv) {
  try { return new Set(JSON.parse(localStorage.getItem(getReadKey(mnv)) || '[]')); }
  catch { return new Set(); }
}
function saveReadSet(mnv, readSet) {
  try { localStorage.setItem(getReadKey(mnv), JSON.stringify([...readSet])); } catch { }
}
function applyReadState(notifications, readSet) {
  return notifications.map((n) => ({ ...n, unread: !readSet.has(n.id) }));
}

const TYPE_STYLE = {
  leave: { Icon: CalendarCheckIcon, bg: 'bg-blue-100', text: 'text-blue-700' },
  low_stock: { Icon: PackageIcon, bg: 'bg-amber-100', text: 'text-amber-700' },
};

export function Header({ title, onToggleSidebar, sidebarOpen, currentUser, currentUsername, currentAvatar, onOpenProfilePage, onOpenChangePasswordPage, onOpenNotification, onOpenAttendancePage, showAttendanceShortcut = false, currentMnv }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const esRef = useRef(null); // EventSource ref

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
  const mnvKey = currentMnv || currentUser;

  // Đóng click ngoài dropdown
  // Thay thế toàn bộ khối EventSource trong useEffect SSE
  useEffect(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const token = localStorage.getItem('token'); // hoặc key bạn lưu JWT
    if (!token) return;

    let isClosed = false;
    const controller = new AbortController();

    fetch('/api/notifications/stream', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || isClosed) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const eventMatch = part.match(/^event: (\w+)/m);
          const dataMatch = part.match(/^data: (.+)/m);
          if (!dataMatch) continue;
          const eventName = eventMatch?.[1] ?? 'message';
          try {
            const parsed = JSON.parse(dataMatch[1]);
            if (eventName === 'snapshot') {
              setNotifications(applyReadState(Array.isArray(parsed) ? parsed : [], loadReadSet(mnvKey)));
            } else {
              const currentReadSet = loadReadSet(mnvKey);
              setNotifications((prev) => {
                if (prev.some((n) => n.id === parsed.id)) return prev;
                return applyReadState([{ ...parsed, unread: true }, ...prev], currentReadSet);
              });
            }
          } catch { }
        }
      }
    }).catch(() => { });

    // Lưu controller để cleanup
    esRef.current = { close: () => { isClosed = true; controller.abort(); } };

    return () => { isClosed = true; controller.abort(); esRef.current = null; };
  }, [mnvKey]);

  useEffect(() => { setProfileForm(profileTemplate); }, [currentUser]);

  // SSE — kết nối real-time, tự reconnect nếu mất mạng
  useEffect(() => {
    // Đóng connection cũ nếu đổi user
    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const readSet = loadReadSet(mnvKey);

    const es = new EventSource('/api/notifications/stream', { withCredentials: true });
    esRef.current = es;

    // Snapshot ban đầu — server gửi toàn bộ danh sách khi vừa connect
    es.addEventListener('snapshot', (e) => {
      try {
        const data = JSON.parse(e.data);
        setNotifications(applyReadState(Array.isArray(data) ? data : [], loadReadSet(mnvKey)));
      } catch { }
    });

    // Thông báo mới đơn lẻ — server push khi có sự kiện (tạo đơn nghỉ, tồn kho thấp)
    es.addEventListener('message', (e) => {
      try {
        const newNotif = JSON.parse(e.data);
        const currentReadSet = loadReadSet(mnvKey);
        setNotifications((prev) => {
          // Nếu đã có id này rồi thì không thêm trùng
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return applyReadState([{ ...newNotif, unread: true }, ...prev], currentReadSet);
        });
      } catch { }
    });

    es.onerror = () => {
      // Browser tự reconnect — không cần xử lý thêm
    };

    return () => { es.close(); esRef.current = null; };
  }, [mnvKey]);

  const formatNotificationTime = (value) => {
    if (!value) return 'Hiện tại';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Hiện tại';
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const orderedNotifications = useMemo(() => {
    const toTimestamp = (value) => {
      if (!value) return 0;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };
    return [...notifications].sort((a, b) => {
      const unreadDelta = Number(Boolean(b.unread)) - Number(Boolean(a.unread));
      if (unreadDelta !== 0) return unreadDelta;
      return toTimestamp(b.time) - toTimestamp(a.time);
    });
  }, [notifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notification) => {
    // Cập nhật state local ngay
    setNotifications((prev) =>
      prev.map((item) => item.id === notification.id ? { ...item, unread: false } : item)
    );
    setShowNotifications(false);

    // Persist vào localStorage
    const readSet = loadReadSet(mnvKey);
    readSet.add(notification.id);
    saveReadSet(mnvKey, readSet);

    if (typeof onOpenNotification === 'function') onOpenNotification(notification);
  };

  const openProfilePage = () => { setShowProfile(false); onOpenProfilePage(); };
  const openChangePasswordPage = () => { setShowProfile(false); onOpenChangePasswordPage(); };

  return (<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
    <div className="flex items-center gap-4">
      {!sidebarOpen && (<button onClick={onToggleSidebar} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Mở sidebar">
        <MenuIcon className="w-5 h-5" />
      </button>)}
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
    </div>

    <div className="flex items-center gap-4">
      {showAttendanceShortcut ? (<button onClick={() => {
        setShowNotifications(false);
        setShowProfile(false);
        if (typeof onOpenAttendancePage === 'function') onOpenAttendancePage();
      }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 border border-gray-200 hover:text-gold-700 hover:bg-gold-50 hover:border-gold-200 transition-colors" aria-label="Mở trang chấm công" title="Chấm công">
        <Clock3Icon className="w-4 h-4" />
        <span className="text-sm font-medium">Chấm công</span>
      </button>) : null}

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Thông báo">
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (<div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-900">Thông báo</h4>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-400">{unreadCount} chưa đọc</span>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto notification-scroll pr-1">
            {orderedNotifications.length === 0
              ? (<div className="px-4 py-6 text-center text-sm text-gray-500">Không có thông báo</div>)
              : orderedNotifications.map((n) => {
                const style = TYPE_STYLE[n.type] ?? { Icon: BellIcon, bg: 'bg-gray-100', text: 'text-gray-600' };
                const { Icon } = style;
                return (
                  <div key={n.id} onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 border-b border-gray-100 transition-colors cursor-pointer ${n.unread ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full ${style.bg} ${style.text} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.unread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{n.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatNotificationTime(n.time)}</p>
                      </div>
                      {n.unread && (<span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>)}
      </div>

      {/* User */}
      <div className="relative pl-3 border-l border-gray-200" ref={profileRef}>
        <button onClick={() => { setShowProfile((prev) => !prev); setShowNotifications(false); }}
          className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors" aria-label="Thông tin tài khoản">
          <span className="text-sm font-semibold text-gray-800">{displayName}</span>
          <img src={avatarSrc} alt="Ảnh đại diện" className="w-9 h-9 rounded-full border border-gold-200 object-cover shadow-md" />
          <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
        </button>

        {showProfile && (<div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-dark-900 to-dark-700 text-white">
            <div className="flex items-center gap-3">
              <img src={avatarSrc} alt="Ảnh đại diện" className="w-12 h-12 rounded-full border-2 border-gold-300/60 object-cover" />
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
                <p className="text-sm">Họ tên: <span className="font-semibold text-gray-900">{displayName}</span></p>
              </div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700">
                <IdCardIcon className="w-4 h-4" />
                <p className="text-sm">Tài khoản: <span className="font-semibold text-gray-900">{profileForm.account}</span></p>
              </div>
              <button onClick={openProfilePage} className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left">
                <IdCardIcon className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>
              <button onClick={openChangePasswordPage} className="w-full px-4 py-3 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left">
                <LockIcon className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  </header>);
}