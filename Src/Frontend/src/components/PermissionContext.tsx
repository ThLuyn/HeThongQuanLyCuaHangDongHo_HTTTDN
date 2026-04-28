// src/contexts/PermissionContext.tsx
import { createContext, useContext } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type PermAction = 'view' | 'create' | 'update' | 'delete';

export type Permission = {
  mcn: string;
  hanhDong: string;
};

export type PermissionContextValue = {
  /** true nếu MNQ=1 — toàn quyền, bỏ qua mọi kiểm tra */
  isAdmin: boolean;
  /** Danh sách quyền thực tế từ CTQUYEN (chỉ dùng khi !isAdmin) */
  permissions: Permission[];
  /**
   * Kiểm tra quyền động.
   * isAdmin luôn trả true.
   * Ví dụ: can('sanpham', 'create'), can('nhacungcap', 'delete')
   */
  can: (mcn: string, action: PermAction) => boolean;
};

// ─── Context ──────────────────────────────────────────────────────────────────
const PermissionContext = createContext<PermissionContextValue>({
  isAdmin: false,
  permissions: [],
  can: () => false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PermissionProvider({
  children,
  isAdmin,
  permissions,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  permissions: Permission[];
}) {
  const can = (mcn: string, action: PermAction): boolean => {
    if (isAdmin) return true;
    return permissions.some(
      (p) =>
        p.mcn.toLowerCase() === mcn.toLowerCase() &&
        p.hanhDong.toLowerCase() === action.toLowerCase(),
    );
  };

  return (
    <PermissionContext.Provider value={{ isAdmin, permissions, can }}>
      {children}
    </PermissionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Dùng trong bất kỳ component nào để lấy quyền hiện tại.
 *
 * Ví dụ:
 *   const { can } = usePermission();
 *   {can('sanpham', 'create') && <button>Thêm sản phẩm</button>}
 */
export function usePermission(): PermissionContextValue {
  return useContext(PermissionContext);
}