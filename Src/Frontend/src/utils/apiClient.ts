/**
 * apiClient.ts
 *
 * Flow:
 *  Login       → backend trả accessToken (body) + set refreshToken (httpOnly cookie)
 *               → gọi setAccessToken() lưu vào memory
 *  Mọi request → Authorization: Bearer <accessToken>
 *  401         → tự gọi /refresh (dùng cookie), lấy accessToken mới, retry 1 lần
 *  Refresh fail → xoá state, redirect /login
 *  Logout      → gọi /logout để backend xoá cookie, xoá memory
 *  Reload trang → bootstrap() gọi refreshSilently() để khôi phục accessToken từ cookie
 *               → phân biệt rõ "401 thật" vs "lỗi network" để tránh logout nhầm
 */

import { clearAuthSession } from './authStorage'

export const AUTH_EXPIRED_EVENT = 'watch-store-auth-expired'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// ─── In-memory access token ───────────────────────────────────────────────────
// Không lưu localStorage → tránh XSS đọc được token.
let _accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// ─── Refresh result type ──────────────────────────────────────────────────────
/**
 * Kết quả trả về từ refreshSilently().
 *  ok: true  → token mới đã được set vào memory.
 *  ok: false, reason: 'unauthorized'   → refreshToken hết hạn, cần login lại.
 *  ok: false, reason: 'network_error'  → lỗi mạng tạm thời, giữ session cũ.
 */
export type RefreshResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'unauthorized' | 'network_error' }

// ─── Refresh (chống race condition) ──────────────────────────────────────────
// Nếu nhiều request cùng nhận 401, chỉ 1 lần gọi /refresh thực sự,
// các request còn lại chờ chung promise đó.
let _refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // gửi httpOnly cookie
      })

      if (!res.ok) {
        handleAuthFailure()
        return null
      }

      const json = await res.json().catch(() => null)
      // Hỗ trợ cả 2 shape: { data: { accessToken } } hoặc { accessToken }
      const newToken: string | undefined =
        json?.data?.accessToken ?? json?.accessToken

      if (!newToken) {
        handleAuthFailure()
        return null
      }

      _accessToken = newToken
      return newToken
    } catch {
      handleAuthFailure()
      return null
    } finally {
      _refreshPromise = null
    }
  })()

  return _refreshPromise
}

// ─── refreshSilently ──────────────────────────────────────────────────────────
/**
 * Dùng khi bootstrap (app mount / reload trang).
 *
 * Khác refreshAccessToken() ở chỗ:
 *  - KHÔNG gọi handleAuthFailure()
 *  - KHÔNG redirect, KHÔNG dispatch event
 *  - Phân biệt rõ lỗi 401 (token hết hạn) vs lỗi network (mạng tạm thời)
 *
 * Caller (bootstrap trong App.tsx) tự quyết định xử lý từng trường hợp:
 *  - 'unauthorized' → clearAuthSession() + setIsAuthenticated(false)
 *  - 'network_error' → giữ session, không làm gì, API call sau tự retry
 */
export async function refreshSilently(): Promise<RefreshResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!res.ok) {
      // 401/403 = refreshToken thật sự hết hạn → cần đăng nhập lại
      return { ok: false, reason: 'unauthorized' }
    }

    const json = await res.json().catch(() => null)
    const newToken: string | undefined =
      json?.data?.accessToken ?? json?.accessToken

    if (!newToken) {
      return { ok: false, reason: 'unauthorized' }
    }

    _accessToken = newToken
    return { ok: true, token: newToken }
  } catch {
    // Lỗi network (timeout, offline, server chưa kịp start, v.v.)
    // → KHÔNG logout, giữ nguyên session để user tiếp tục dùng app
    return { ok: false, reason: 'network_error' }
  }
}

// ─── handleAuthFailure ────────────────────────────────────────────────────────
// Chỉ gọi từ refreshAccessToken() (trong luồng API đang chạy, KHÔNG phải bootstrap).
function handleAuthFailure(): void {
  _accessToken = null
  clearAuthSession()
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace('/login')
  }
}

// ─── Core request ─────────────────────────────────────────────────────────────
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type ApiRequestOptions = {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  _isRetry?: boolean // nội bộ — tránh retry vô tận
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders = {}, _isRetry = false } = options
  const isFormData = body instanceof FormData

  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
    ...extraHeaders,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // luôn gửi cookie (refresh token)
    body: body !== undefined
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  })

  // ── 401: thử refresh rồi retry 1 lần ───────────────────────────────────────
  if (response.status === 401 && !_isRetry) {
    const newToken = await refreshAccessToken()
    if (!newToken) {
      throw new ApiError(401, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị.')
    }
    return apiRequest<T>(path, { ...options, _isRetry: true })
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message || `Lỗi ${response.status}`
    if (response.status === 401) handleAuthFailure()
    throw new ApiError(response.status, message)
  }

  return payload as T
}

// ─── initAuth (legacy) ───────────────────────────────────────────────────────
/**
 * @deprecated Dùng refreshSilently() trực tiếp trong bootstrap() của App.tsx
 * để phân biệt lỗi 401 vs lỗi network và tránh logout nhầm khi mạng yếu.
 * Hàm này giữ lại để không break các caller cũ.
 */
export async function initAuth(): Promise<boolean> {
  if (_accessToken) return true
  const result = await refreshSilently()
  return result.ok
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/admin/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {},
    })
  } catch {
    // Dù lỗi network vẫn phải dọn state
  } finally {
    _accessToken = null
    clearAuthSession()
    window.location.replace('/login')
  }
}

// ─── ApiError ─────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}