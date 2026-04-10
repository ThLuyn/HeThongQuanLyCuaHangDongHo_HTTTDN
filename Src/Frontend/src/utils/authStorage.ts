export type AuthSession = {
  accessToken: string
  username: string
  fullName: string
  avatar?: string
  role: string
  mnv: number
  permissions?: Array<{
    mcn: string
    hanhDong: string
  }>
}

const AUTH_STORAGE_KEY = 'watch_store_auth_session'

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function loadAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.accessToken || !parsed?.username) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}