// @ts-nocheck
import { BriefcaseIcon, Building2Icon, CalendarDaysIcon, CreditCardIcon, FileTextIcon, IdCardIcon, LandmarkIcon, MailIcon, MapPinIcon, PhoneIcon, ShieldIcon, UserCheckIcon, UserRoundIcon, WalletIcon, } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import anhthe from '../assets/anhthe.jpg';
import { getMyProfileApi, updateMyProfileApi } from '../utils/backendApi';
import { resolveImageSource } from '../utils/imageSource';
const EMPTY_FORM = {
    fullName: '',
    ngaySinh: '',
    gioiTinh: 1,
    trangThai: 1,
    trangThaiLamViec: 1,
    soDienThoai: '',
    cccd: '',
    queQuan: '',
    email: '',
    diaChi: '',
    hinhAnh: '',
    boPhan: '',
    ngayVaoLam: '',
    soTaiKhoanNganHang: '',
    tenNganHang: '',
};
function formatGender(value) {
    if (value === 1)
        return 'Nam';
    if (value === 0)
        return 'Nữ';
    return 'Chưa cập nhật';
}
function formatStatus(value) {
    if (value === 1)
        return 'Đang làm việc';
    if (value === 0)
        return 'Ngừng làm việc';
    return 'Chưa cập nhật';
}
function toInputDate(value) {
    if (!value)
        return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function toDisplayDate(value) {
    if (!value)
        return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Chưa cập nhật';
    return date.toLocaleDateString('vi-VN');
}
function formatEmployeeCode(mnv) {
    return `NV${String(Number(mnv) || 0).padStart(3, '0')}`;
}
function toForm(profile) {
    return {
        fullName: profile.fullName || '',
        ngaySinh: toInputDate(profile.ngaySinh),
        gioiTinh: Number(profile.gioiTinh) === 0 ? 0 : 1,
        trangThai: Number(profile.trangThai) === 0 ? 0 : 1,
        trangThaiLamViec: Number(profile.trangThaiLamViec) === 2 ? 2 : Number(profile.trangThaiLamViec) === 0 ? 0 : 1,
        soDienThoai: profile.soDienThoai || '',
        cccd: profile.cccd || '',
        queQuan: profile.queQuan || '',
        email: profile.email || '',
        diaChi: profile.diaChi || '',
        hinhAnh: profile.hinhAnh || '',
        boPhan: profile.boPhan || '',
        ngayVaoLam: toInputDate(profile.ngayVaoLam),
        soTaiKhoanNganHang: profile.soTaiKhoanNganHang || '',
        tenNganHang: profile.tenNganHang || '',
    };
}
export function PersonalProfile({ onProfileUpdated }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const onSelectProfileImage = (file) => {
        if (!file)
            return;
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn tệp hình ảnh hợp lệ.');
            return;
        }
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Ảnh vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            setForm((prev) => ({ ...prev, hinhAnh: result }));
            setError('');
        };
        reader.readAsDataURL(file);
    };
    const loadProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyProfileApi();
            setProfile(data);
            setForm(toForm(data));
            onProfileUpdated?.(data.fullName || '', data.hinhAnh || '');
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Không tải được thông tin cá nhân';
            setError(msg);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadProfile();
    }, []);
    const employeeInfo = useMemo(() => {
        if (!profile)
            return [];
        return [
            { label: 'Mã nhân viên', value: formatEmployeeCode(profile.mnv), icon: <IdCardIcon className="h-4 w-4"/> },
            { label: 'Họ tên', value: profile.fullName || 'Chưa cập nhật', icon: <UserRoundIcon className="h-4 w-4"/> },
            { label: 'Ngày sinh', value: toDisplayDate(profile.ngaySinh), icon: <CalendarDaysIcon className="h-4 w-4"/> },
            { label: 'Giới tính', value: formatGender(profile.gioiTinh), icon: <UserRoundIcon className="h-4 w-4"/> },
            { label: 'Trạng thái', value: formatStatus(profile.trangThai), icon: <IdCardIcon className="h-4 w-4"/> },
            { label: 'Số điện thoại', value: profile.soDienThoai || 'Chưa cập nhật', icon: <PhoneIcon className="h-4 w-4"/> },
            { label: 'Số CCCD/CMND', value: profile.cccd || 'Chưa cập nhật', icon: <IdCardIcon className="h-4 w-4"/> },
            { label: 'Quê quán', value: profile.queQuan || 'Chưa cập nhật', icon: <MapPinIcon className="h-4 w-4"/> },
            { label: 'Email', value: profile.email || 'Chưa cập nhật', icon: <MailIcon className="h-4 w-4"/> },
            { label: 'Địa chỉ', value: profile.diaChi || 'Chưa cập nhật', icon: <MapPinIcon className="h-4 w-4"/> },
        ];
    }, [profile]);
    const jobInfo = useMemo(() => {
        if (!profile)
            return [];
        return [
            { label: 'Chức vụ', value: profile.chucVu || profile.groupName || 'Chưa cập nhật', icon: <BriefcaseIcon className="h-4 w-4"/> },
            { label: 'Phòng ban/Bộ phận', value: profile.boPhan || 'Chưa cập nhật', icon: <Building2Icon className="h-4 w-4"/> },
            { label: 'Thời gian vào làm', value: toDisplayDate(profile.ngayVaoLam), icon: <CalendarDaysIcon className="h-4 w-4"/> },
            {
                label: 'Trạng thái làm việc',
                value: Number(profile.trangThaiLamViec) === 2
                    ? 'Đang nghỉ phép'
                    : Number(profile.trangThaiLamViec) === 0
                        ? 'Đã nghỉ việc'
                        : 'Đang làm việc',
                icon: <UserCheckIcon className="h-4 w-4"/>,
            },
        ];
    }, [profile]);
    const payrollInfo = useMemo(() => {
        if (!profile)
            return [];
        const khauTru = profile.khauTruBaoHiem;
        const formatVnd = (v) => `${new Intl.NumberFormat('vi-VN').format(Number(v || 0))} đ`;
        return [
            { label: 'Mức lương cơ bản', value: formatVnd(profile.luongCoBan), icon: <WalletIcon className="h-4 w-4"/> },
            {
                label: 'Khấu trừ BHXH (8%)',
                value: `${formatVnd(khauTru.bhxhAmount)} (${khauTru.bhxhRate * 100}%)`,
                icon: <ShieldIcon className="h-4 w-4"/>,
            },
            {
                label: 'Khấu trừ BHYT (1.5%)',
                value: `${formatVnd(khauTru.bhytAmount)} (${khauTru.bhytRate * 100}%)`,
                icon: <ShieldIcon className="h-4 w-4"/>,
            },
            {
                label: 'Khấu trừ BHTN (1%)',
                value: `${formatVnd(khauTru.bhtnAmount)} (${khauTru.bhtnRate * 100}%)`,
                icon: <ShieldIcon className="h-4 w-4"/>,
            },
            { label: 'Số tài khoản ngân hàng', value: profile.soTaiKhoanNganHang || 'Chưa cập nhật', icon: <CreditCardIcon className="h-4 w-4"/> },
            { label: 'Tên ngân hàng', value: profile.tenNganHang || 'Chưa cập nhật', icon: <LandmarkIcon className="h-4 w-4"/> },
            { label: 'Mã số thuế cá nhân', value: profile.maSoThueCaNhan || 'Chưa cập nhật', icon: <FileTextIcon className="h-4 w-4"/> },
        ];
    }, [profile]);
    const beginEdit = () => {
        if (!profile)
            return;
        setForm(toForm(profile));
        setMessage('');
        setError('');
        setIsEditing(true);
    };
    const cancelEdit = () => {
        if (!profile)
            return;
        setForm(toForm(profile));
        setMessage('');
        setError('');
        setIsEditing(false);
    };
    const saveProfile = async () => {
        if (!profile)
            return;
        setError('');
        setMessage('');
        if (!form.fullName.trim()) {
            setError('Họ tên không được để trống.');
            return;
        }
        if (!form.ngaySinh) {
            setError('Ngày sinh không được để trống.');
            return;
        }
        if (!form.soDienThoai.trim()) {
            setError('Số điện thoại không được để trống.');
            return;
        }
        if (!form.email.trim() || !form.email.includes('@')) {
            setError('Email không hợp lệ.');
            return;
        }
        setSaving(true);
        try {
            await updateMyProfileApi({
                fullName: form.fullName.trim(),
                gioiTinh: Number(form.gioiTinh) === 0 ? 0 : 1,
                ngaySinh: form.ngaySinh,
                trangThai: Number(form.trangThai) === 0 ? 0 : 1,
                soDienThoai: form.soDienThoai.trim(),
                queQuan: form.queQuan.trim(),
                email: form.email.trim(),
                diaChi: form.diaChi.trim(),
                hinhAnh: form.hinhAnh.trim(),
                ngayVaoLam: form.ngayVaoLam,
                cccd: form.cccd.trim(),
                boPhan: form.boPhan.trim(),
                trangThaiLamViec: Number(form.trangThaiLamViec),
                soTaiKhoanNganHang: form.soTaiKhoanNganHang.trim(),
                tenNganHang: form.tenNganHang.trim(),
            });
            const latest = await getMyProfileApi();
            setProfile(latest);
            setForm(toForm(latest));
            setIsEditing(false);
            onProfileUpdated?.(latest.fullName || '', latest.hinhAnh || '');
            setMessage('Cập nhật thông tin cá nhân thành công.');
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Không thể cập nhật thông tin cá nhân';
            setError(msg);
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="space-y-4">
      <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h1>
          </div>

          {!isEditing ? (<button type="button" onClick={beginEdit} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-600">
              Chỉnh sửa
            </button>) : (<div className="flex gap-2">
              <button type="button" onClick={cancelEdit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Hủy
              </button>
              <button type="button" onClick={saveProfile} disabled={saving} className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>)}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}

      {loading ? (<div className="rounded-xl border border-black/5 bg-white p-6 text-center text-gray-600 shadow-sm">
          Đang tải thông tin cá nhân...
        </div>) : profile ? (<div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-1">
              <div className="flex flex-col items-center">
                <img src={resolveImageSource(form.hinhAnh) || anhthe} alt="Ảnh nhân viên" className="h-44 w-44 rounded-2xl border border-gray-200 object-cover shadow-sm"/>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">{profile.fullName}</h2>
                <p className="text-sm text-gray-500">{profile.groupName}</p>
                <p className="mt-2 rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700">@{profile.username}</p>

                {isEditing && (<div className="mt-4 w-full">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Ảnh nhân viên</label>
                    <input type="file" accept="image/*" onChange={(e) => onSelectProfileImage(e.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gold-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gold-700 hover:file:bg-gold-100"/>
                    <p className="mt-1 text-xs text-gray-500">Chỉ chấp nhận ảnh, dung lượng tối đa 2MB.</p>
                  </div>)}
              </div>
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="mb-3 text-base font-semibold text-gray-900">Thông tin nhân viên</h3>

              {!isEditing ? (<div className="grid gap-3 md:grid-cols-2">
                  {employeeInfo.map((item) => (<div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        {item.icon}
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                    </div>))}
                </div>) : (<div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Mã nhân viên</label>
                    <input value={formatEmployeeCode(profile.mnv)} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"/>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Họ tên</label>
                    <input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Ngày sinh</label>
                    <input type="date" value={form.ngaySinh} onChange={(e) => setForm((prev) => ({ ...prev, ngaySinh: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Giới tính</label>
                    <select value={form.gioiTinh} onChange={(e) => setForm((prev) => ({ ...prev, gioiTinh: Number(e.target.value) === 0 ? 0 : 1 }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                      <option value={1}>Nam</option>
                      <option value={0}>Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                    <select value={form.trangThai} onChange={(e) => setForm((prev) => ({ ...prev, trangThai: Number(e.target.value) === 0 ? 0 : 1 }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50">
                      <option value={1}>Đang làm việc</option>
                      <option value={0}>Ngừng làm việc</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <input value={form.soDienThoai} onChange={(e) => setForm((prev) => ({ ...prev, soDienThoai: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Số CCCD/CMND</label>
                    <input value={form.cccd} onChange={(e) => setForm((prev) => ({ ...prev, cccd: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Quê quán</label>
                    <input value={form.queQuan} onChange={(e) => setForm((prev) => ({ ...prev, queQuan: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input value={form.diaChi} onChange={(e) => setForm((prev) => ({ ...prev, diaChi: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                  </div>
                </div>)}
            </div>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Thông tin nghiệp vụ</h3>

            <div className="grid gap-3 md:grid-cols-2">
              {jobInfo.map((item) => (<div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {item.icon}
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>))}
            </div>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Thông tin lương và tài khoản</h3>

            {!isEditing ? (<div className="grid gap-3 md:grid-cols-2">
                {payrollInfo.map((item) => (<div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      {item.icon}
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                  </div>))}
              </div>) : (<div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mức lương cơ bản</label>
                  <input value={`${new Intl.NumberFormat('vi-VN').format(Number(profile.luongCoBan || 0))} đ`} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"/>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mã số thuế cá nhân</label>
                  <input value={form.cccd} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"/>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Số tài khoản ngân hàng</label>
                  <input value={form.soTaiKhoanNganHang} onChange={(e) => setForm((prev) => ({ ...prev, soTaiKhoanNganHang: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tên ngân hàng</label>
                  <input value={form.tenNganHang} onChange={(e) => setForm((prev) => ({ ...prev, tenNganHang: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50"/>
                </div>
              </div>)}
          </div>
        </div>) : null}
    </div>);
}
