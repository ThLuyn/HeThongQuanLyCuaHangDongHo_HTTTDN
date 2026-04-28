import { BellIcon, CalendarCheckIcon, ChevronDownIcon, IdCardIcon, LockIcon, MenuIcon, PackageIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import anhthe from '../assets/anhthe.jpg';
import { resolveImageSource } from '../utils/imageSource';

// ─── LocalStorage helpers ────────────────────────────────────────────────────
function getReadKey(mnv: string | number) {
  return `read_notif_${mnv}`;
}
function loadReadSet(mnv: string | number): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(getReadKey(mnv)) || '[]'));
  } catch {
    return new Set();
  }
}
function saveReadSet(mnv: string | number, readSet: Set<string>) {
  try {
    localStorage.setItem(getReadKey(mnv), JSON.stringify([...readSet]));
  } catch { }
}
function applyReadState(notifications: any[], readSet: Set<string>) {
  return notifications.map((n) => ({ ...n, unread: !readSet.has(n.id) }));
}

// ─── Token helper ─────────────────────────────────────────────────────────────
import { getAccessToken } from '../utils/apiClient';
function getToken(): string | null {
  // accessToken chỉ tồn tại in-memory (apiClient) — KHÔNG lưu localStorage.
  // App.tsx đã gọi initAuth() trước khi render Header, nên token luôn sẵn sàng.
  return getAccessToken();
}

// ─── Type styles ──────────────────────────────────────────────────────────────
const TYPE_STYLE: Record<string, { Icon: any; bg: string; text: string }> = {
  leave: { Icon: CalendarCheckIcon, bg: 'bg-blue-100', text: 'text-blue-700' },
  low_stock: { Icon: PackageIcon, bg: 'bg-amber-100', text: 'text-amber-700' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  currentUser: string;
  currentUsername: string;
  currentAvatar?: string;
  onOpenProfilePage: () => void;
  onOpenChangePasswordPage: () => void;
  onOpenNotification: (notification: any) => void;
  currentMnv?: string | number;
}

export function Header({
  title,
  onToggleSidebar,
  sidebarOpen,
  currentUser,
  currentUsername,
  currentAvatar,
  onOpenProfilePage,
  onOpenChangePasswordPage,
  onOpenNotification,
  currentMnv,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Đặt mnvKey lên đầu để các hook phía dưới luôn truy cập được
  const mnvKey = currentMnv || currentUser;

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // ─── Đóng dropdown khi click ra ngoài ──────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── SSE connection ────────────────────────────────────────────────────────
  useEffect(() => {
    const closed = { value: false };
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    async function loadInitialNotifications(token: string) {
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          return;
        }

        const json = await res.json().catch(() => null);
        const list = Array.isArray(json?.data) ? json.data : [];
        if (!closed.value) {
          setNotifications(applyReadState(list, loadReadSet(mnvKey)));
        }
      } catch (err: any) {
        console.warn('[Notifications] Không thể tải snapshot ban đầu:', err?.message);
      }
    }

    async function connect() {
      if (closed.value) return;

      let token = getToken();

      // Safety net: App.tsx đã gọi initAuth() trước khi render Header,
      // nhưng nếu vì lý do nào đó token chưa sẵn sàng, đợi thêm 1 lần.
      if (!token) {
        await new Promise<void>((res) => setTimeout(res, 300));
        token = getToken();
      }

      // Vẫn không có token → dừng, không retry (tránh spam)
      if (!token) {
        console.warn('[SSE] Không có token, dừng kết nối.');
        return;
      }

      await loadInitialNotifications(token);

      controller = new AbortController();

      try {
        const res = await fetch('/api/notifications/stream', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        // Auth lỗi → dừng hẳn, không retry để tránh spam 401
        if (res.status === 401 || res.status === 403 || res.status === 204) {
          const msg = res.status === 204 ? "Role không có notification, dừng kết nối." : `Auth lỗi ${res.status}, dừng retry.`;
          console.warn("[SSE]", msg);
          return;
        }

        if (!res.ok || !res.body) {
          throw new Error(`[SSE] Response lỗi: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Đọc stream
        while (true) {
          const { done, value } = await reader.read();
          if (done || closed.value) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            if (!part.trim() || part.startsWith(':')) continue; // heartbeat / comment

            const eventMatch = part.match(/^event:\s*(\w+)/m);
            const dataMatch = part.match(/^data:\s*(.+)/m);
            if (!dataMatch) continue;

            const eventName = eventMatch?.[1] ?? 'message';

            try {
              const parsed = JSON.parse(dataMatch[1]);

              if (eventName === 'snapshot') {
                const list = Array.isArray(parsed) ? parsed : [];
                setNotifications(applyReadState(list, loadReadSet(mnvKey)));
              } else {
                // Notification mới đẩy vào đầu, tránh trùng id
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === parsed.id)) return prev;
                  // Giữ nguyên unread: true cho notification mới, không gọi applyReadState cho toàn bộ mảng
                  return [{ ...parsed, unread: true }, ...prev];
                });
              }
            } catch (parseErr) {
              console.warn('[SSE] Parse lỗi:', parseErr);
            }
          }
        }
      } catch (err: any) {
        // Bỏ qua lỗi do abort (component unmount)
        if (err?.name === 'AbortError') return;
        console.warn('[SSE] Kết nối lỗi:', err?.message);
      }

      // Chỉ retry khi là lỗi mạng / server drop, không phải 401
      if (!closed.value) {
        console.info('[SSE] Thử kết nối lại sau 5 giây...');
        retryTimeout = setTimeout(connect, 5_000);
      }
    }

    connect();

    return () => {
      closed.value = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (controller) controller.abort();
    };
  }, [mnvKey]);

  // Sync profile khi user thay đổi
  useEffect(() => {
    setProfileForm(profileTemplate);
  }, [currentUser]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatNotificationTime = (value: string | null) => {
    if (!value) return 'Hiện tại';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Hiện tại';
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const orderedNotifications = useMemo(() => {
    const toTs = (v: string | null) => {
      if (!v) return 0;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };
    return [...notifications].sort((a, b) => {
      const unreadDelta = Number(Boolean(b.unread)) - Number(Boolean(a.unread));
      if (unreadDelta !== 0) return unreadDelta;
      return toTs(b.time) - toTs(a.time);
    });
  }, [notifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notification: any) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    );
    setShowNotifications(false);

    const readSet = loadReadSet(mnvKey);
    readSet.add(notification.id);
    saveReadSet(mnvKey, readSet);

    if (typeof onOpenNotification === 'function') onOpenNotification(notification);
  };

  const openProfilePage = () => { setShowProfile(false); onOpenProfilePage(); };
  const openChangePasswordPage = () => { setShowProfile(false); onOpenChangePasswordPage(); };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left */}
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

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* ── Notifications ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications((v) => !v); setShowProfile(false); }}
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Thông báo"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">Thông báo</h4>
                {unreadCount > 0 && (
                  <span className="text-xs text-gray-400">{unreadCount} chưa đọc</span>
                )}
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto notification-scroll pr-1">
                {orderedNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    Không có thông báo
                  </div>
                ) : (
                  orderedNotifications.map((n) => {
                    const style = TYPE_STYLE[n.type] ?? { Icon: BellIcon, bg: 'bg-gray-100', text: 'text-gray-600' };
                    const { Icon } = style;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-4 py-3 border-b border-gray-100 transition-colors cursor-pointer ${n.unread ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full ${style.bg} ${style.text} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${n.unread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                              {n.text}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatNotificationTime(n.time)}
                            </p>
                          </div>
                          {n.unread && (
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── User profile ── */}
        <div className="relative pl-3 border-l border-gray-200" ref={profileRef}>
          <button
            onClick={() => { setShowProfile((v) => !v); setShowNotifications(false); }}
            className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors"
            aria-label="Thông tin tài khoản"
          >
            <span className="text-sm font-semibold text-gray-800">{displayName}</span>
            <img
              src={avatarSrc}
              alt="Ảnh đại diện"
              className="w-9 h-9 rounded-full border border-gold-200 object-cover shadow-md"
            />
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              {/* Profile header */}
              <div className="px-5 py-4 bg-gradient-to-r from-dark-900 to-dark-700 text-white">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarSrc}
                    alt="Ảnh đại diện"
                    className="w-12 h-12 rounded-full border-2 border-gold-300/60 object-cover"
                  />
                  <div>
                    <p className="text-base font-semibold leading-tight">{displayName}</p>
                    <p className="text-sm text-gold-200">{profileForm.account}</p>
                  </div>
                </div>
              </div>

              {/* Profile menu */}
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
                      Tài khoản: <span className="font-semibold text-gray-900">{profileForm.account}</span>
                    </p>
                  </div>
                  <button
                    onClick={openProfilePage}
                    className="w-full px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 text-gray-700 hover:bg-gold-50/40 transition-colors text-left"
                  >
                    <IdCardIcon className="w-4 h-4" />
                    <span>Thông tin cá nhân</span>
                  </button>
                  <button
                    onClick={openChangePasswordPage}
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
    </header>
  );
}
