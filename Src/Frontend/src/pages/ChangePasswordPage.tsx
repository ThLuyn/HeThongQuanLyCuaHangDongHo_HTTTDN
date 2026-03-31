// @ts-nocheck
import { LockIcon } from 'lucide-react';
import { useState } from 'react';
export function ChangePasswordPage({ username, onChangePassword }) {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setSuccess(false);
        if (!form.currentPassword.trim()) {
            setMessage('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        if (form.newPassword.length < 6) {
            setMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setMessage('Mật khẩu xác nhận không khớp.');
            return;
        }
        setIsSubmitting(true);
        const result = await onChangePassword(username, form.currentPassword, form.newPassword);
        setIsSubmitting(false);
        if (!result.ok) {
            setMessage(result.message || 'Đổi mật khẩu thất bại.');
            return;
        }
        setMessage('Đổi mật khẩu thành công.');
        setSuccess(true);
        setForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };
    return (<div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cập nhật mật khẩu cho tài khoản <span className="font-semibold text-gray-700">{username}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
              <input type="password" value={form.currentPassword} onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
              <input type="password" value={form.newPassword} onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/>
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
            </div>
          </div>

          {message && (<p className={`rounded-lg border px-3 py-2 text-sm ${success
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message}
            </p>)}

          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
