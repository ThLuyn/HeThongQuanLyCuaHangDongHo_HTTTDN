export function resolveImageSource(value?: string | null): string {
  if (!value) return ''

  const trimmed = String(value).trim()
  if (!trimmed) return ''

  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed
  }

  if (trimmed.startsWith('/assets/')) {
    return trimmed
  }

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  const normalizedPath = trimmed.replace(/^\/+/, '')

  if (trimmed.startsWith('/')) {
    return apiBase ? `${apiBase}${trimmed}` : trimmed
  }

  return apiBase ? `${apiBase}/${normalizedPath}` : `/${normalizedPath}`
}
