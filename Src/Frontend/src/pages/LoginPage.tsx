import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from 'lucide-react';
import { FormEvent, useState } from 'react';
import logo from '../assets/LOGO.png';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await onLogin(username.trim(), password)
      if (!result.ok) {
        setError(result.message || 'Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#f5edd8_0%,_#f2f4f8_40%,_#e7ecf3_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl border border-white shadow-2xl shadow-gray-300/40 overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-dark-900 to-dark-700 text-white">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={logo}
              alt="Golden Time logo"
              className="w-11 h-11 rounded-full object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold-200/80">
                GOLDEN TIME
              </p>
              <h1 className="text-lg font-semibold">Admin</h1>
            </div>
          </div>
          <p className="text-sm text-gray-200 text-center">
            ĐĂNG NHẬP
          </p>
        </div>

        <form className="px-8 py-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên đăng nhập
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg text-white font-medium bg-gold-500 hover:bg-gold-600 transition-colors"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
