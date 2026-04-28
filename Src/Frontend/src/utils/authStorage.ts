/**
 * authStorage.ts
 *
 * Chỉ lưu thông tin user (display) vào localStorage.
 * accessToken KHÔNG lưu ở đây — nằm in-memory trong apiClient.
 * refreshToken KHÔNG lưu ở đây — nằm trong httpOnly cookie do backend set.
 */

export type AuthSession = {
  username: string
  fullName: string
  avatar?: string | null
  role: string
  department?: string
  mnv: number
  permissions?: Array<{
    mcn: string
    hanhDong: string
  }>
}

const AUTH_STORAGE_KEY = 'watch_store_user_info'

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function loadAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.username) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}