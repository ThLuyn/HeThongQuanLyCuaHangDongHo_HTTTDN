// @ts-nocheck
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import anhthe from '../assets/anhthe.jpg';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { createEmployeeApi, getEmployeeDetailApi, getEmployeesApi, resignEmployeeApi } from '../utils/backendApi';
import { resolveImageSource } from '../utils/imageSource';
const POSITION_OPTIONS = ['Quản lý cửa hàng', 'Nhân viên bán hàng', 'Nhân viên kho', 'Nhân viên kỹ thuật'];
const POSITION_PROFILE_MAP = {
  'Quản lý cửa hàng': {
    groupName: 'Quản lý',
    department: 'Quản lý',
    baseSalary: 15000000,
    commissionRate: 1,
  },
  'Nhân viên bán hàng': {
    groupName: 'Nhân viên',
    department: 'Kinh doanh',
    baseSalary: 7000000,
    commissionRate: 2,
  },
  'Nhân viên kho': {
    groupName: 'Nhân viên',
    department: 'Kho',
    baseSalary: 8000000,
    commissionRate: 0,
  },
  'Nhân viên kỹ thuật': {
    groupName: 'Nhân viên',
    department: 'Kỹ thuật',
    baseSalary: 10000000,
    commissionRate: 0,
  },
  'Quản lý': {
    groupName: 'Quản lý',
    department: 'Quản lý',
    baseSalary: 15000000,
    commissionRate: 3,
  },
  'Kế toán': {
    groupName: 'Nhân sự',
    department: 'Kế toán',
    baseSalary: 10000000,
    commissionRate: 0,
  },
  'Bảo vệ': {
    groupName: 'Nhân viên',
    department: 'An ninh',
    baseSalary: 7000000,
    commissionRate: 0,
  },
};
function getPositionProfile(position) {
  return POSITION_PROFILE_MAP[position] || {
    groupName: 'Nhân viên',
    department: 'Chưa phân công',
    baseSalary: 0,
    commissionRate: 0,
  };
}
function isValidPhoneNumber(phone) {
    return /^\d{10}$/.test(phone.trim());
}
function validateEmail(value) {
  const email = String(value || '').trim();
  if (!email)
    return 'Email là bắt buộc.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Email không hợp lệ.';
  return '';
}
function isValidCitizenId(value) {
  return /^\d{9,12}$/.test(value.trim());
}
function parseIsoDate(value) {
  if (!value)
    return null;
  const parts = String(value).split('-');
  if (parts.length !== 3)
    return null;
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day)
    return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}
function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function getTodayIsoDate() {
  return toIsoDate(new Date());
}
function toInputDate(value) {
  if (!value)
    return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return '';
  return toIsoDate(date);
}
function getDateAfterYears(isoDate, years) {
  const date = parseIsoDate(isoDate);
  if (!date)
    return '';
  date.setFullYear(date.getFullYear() + years);
  return toIsoDate(date);
}
function validateBirthDateNotFuture(birthDateValue) {
  const birthDate = parseIsoDate(birthDateValue);
  const today = parseIsoDate(getTodayIsoDate());
  if (!birthDate || !today)
    return 'Ngày sinh không hợp lệ.';
  if (birthDate > today)
    return 'Ngày sinh không được là ngày trong tương lai.';
  return '';
}
function getAgeOnDate(birthDate, targetDate) {
  let age = targetDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = targetDate.getMonth() - birthDate.getMonth();
  const dayDiff = targetDate.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}
function validateAdultForEmployment(birthDateValue, startDateValue) {
  const startDate = parseIsoDate(startDateValue);
  const birthDate = parseIsoDate(birthDateValue);
  if (!startDate || !birthDate)
    return '';
  if (getAgeOnDate(birthDate, startDate) < 18)
    return 'Chưa đủ 18 tuổi.';
  return '';
}
function buildLocalEmployeeDetail(emp) {
  return {
    mnv: Number(String(emp.id || '').replace(/\D/g, '')) || 0,
    username: null,
    fullName: emp.name || 'Chưa cập nhật',
    groupName: emp.groupName || null,
    chucVu: emp.position || 'Chưa cập nhật',
    gioiTinh: Number(emp.gender) === 0 ? 0 : 1,
    ngaySinh: emp.birthDate || null,
    soDienThoai: emp.phone || null,
    email: emp.email || null,
    trangThai: emp.status === 'Đang làm' ? 1 : 0,
    trangThaiTaiKhoan: emp.status === 'Đã nghỉ' ? 0 : 1,
    queQuan: emp.hometown || null,
    diaChi: null,
    hinhAnh: null,
    ngayVaoLam: emp.startDate || null,
    cccd: emp.cccd || null,
    boPhan: emp.department || null,
    soTaiKhoanNganHang: null,
    tenNganHang: null,
    luongCoBan: Number(emp.baseSalary || 0),
    tyLeHoaHong: Number(emp.commissionRate || 0),
  };
}
function formatDisplayDate(value) {
    if (!value)
        return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Chưa cập nhật';
    return date.toLocaleDateString('vi-VN');
}
function formatGender(value) {
    if (value === 1)
        return 'Nam';
    if (value === 0)
        return 'Nữ';
    return 'Chưa cập nhật';
}
function formatWorkStatus(value) {
    return value === 1 ? 'Đang làm' : 'Đã nghỉ';
}
const initialEmployees = [
    {
        id: 'NV001',
        name: 'Nguyễn Văn An',
        position: 'Quản lý',
        phone: '0901234567',
        email: 'an.nv@sguwatch.vn',
        status: 'Đang làm',
    },
    {
        id: 'NV002',
        name: 'Trần Thị Bình',
        position: 'Nhân viên bán hàng',
        phone: '0912345678',
        email: 'binh.tt@sguwatch.vn',
        status: 'Đang làm',
    },
    {
        id: 'NV003',
        name: 'Lê Hoàng Cường',
        position: 'Kế toán',
        phone: '0923456789',
        email: 'cuong.lh@sguwatch.vn',
        status: 'Đang làm',
    },
    {
        id: 'NV004',
        name: 'Phạm Minh Dũng',
        position: 'Nhân viên kho',
        phone: '0934567890',
        email: 'dung.pm@sguwatch.vn',
        status: 'Nghỉ phép',
    },
    {
        id: 'NV005',
        name: 'Võ Thanh Hà',
        position: 'Nhân viên bán hàng',
        phone: '0945678901',
        email: 'ha.vt@sguwatch.vn',
        status: 'Đang làm',
    },
    {
        id: 'NV006',
        name: 'Đỗ Quang Huy',
        position: 'Bảo vệ',
        phone: '0956789012',
        email: 'huy.dq@sguwatch.vn',
        status: 'Đang làm',
    },
];
const columns = [
    {
        key: 'id',
        label: 'Mã NV',
    },
    {
        key: 'name',
        label: 'Họ tên',
    },
    {
        key: 'position',
        label: 'Chức vụ',
    },
    {
        key: 'phone',
        label: 'SĐT',
    },
    {
        key: 'email',
        label: 'Email',
    },
    {
        key: 'status',
        label: 'Trạng thái',
        render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Đang làm' ? 'bg-green-100 text-green-700' : val === 'Nghỉ phép' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
        {val}
      </span>),
    },
];
export function EmployeeList() {
    const [employees, setEmployees] = useState(initialEmployees);
    const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [viewError, setViewError] = useState('');
    const [viewDetail, setViewDetail] = useState(null);
    const [form, setForm] = useState({
        id: '',
        name: '',
      gender: 1,
      birthDate: '',
        position: '',
      groupName: '',
      department: '',
      baseSalary: 0,
      commissionRate: 0,
        phone: '',
        email: '',
      startDate: '',
      cccd: '',
      hometown: '',
        status: 'Đang làm',
    });
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                setError('');
                const rows = await getEmployeesApi();
                const mapped = rows.map((row) => ({
                  ...getPositionProfile(row.TENCHUCVU),
                    id: `NV${String(row.MNV).padStart(3, '0')}`,
                    name: row.HOTEN,
                    position: row.TENCHUCVU,
                    phone: row.SDT,
                    email: row.EMAIL,
                  isLocal: false,
                    status: row.TT === 1 ? 'Đang làm' : 'Đã nghỉ',
                }));
                setEmployees(mapped);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : 'Khong the tai danh sach nhan vien';
                setError(message);
            }
        };
        loadEmployees();
    }, []);
      const setFormField = (key, value) => {
        setForm((prev) => ({
          ...(key === 'position'
            ? {
                ...prev,
                position: value,
                ...getPositionProfile(value),
              }
            : {
                ...prev,
                [key]: value,
              }),
        }));
        setFieldErrors((prev) => {
          const next = {
            ...prev,
          };
          delete next[key];
          if (key === 'birthDate')
            delete next.startDate;
          if (key === 'startDate')
            delete next.birthDate;
          return next;
        });
        setFormError('');
      };
    const openAdd = () => {
        setEditingEmployee(null);
      setIsCreating(true);
        setFormError('');
        setFieldErrors({});
      const maxEmployeeNumber = employees.reduce((max, row) => {
        const value = Number(String(row.id || '').replace(/\D/g, ''));
        return Number.isFinite(value) ? Math.max(max, value) : max;
      }, 0);
      const defaultPosition = POSITION_OPTIONS[0];
      const defaultProfile = getPositionProfile(defaultPosition);
        setForm({
        id: `NV${String(maxEmployeeNumber + 1).padStart(3, '0')}`,
            name: '',
          gender: 1,
          birthDate: '',
            position: defaultPosition,
            ...defaultProfile,
            phone: '',
            email: '',
          startDate: '',
          cccd: '',
          hometown: '',
            status: 'Đang làm',
        });
        setModalOpen(false);
    };
    const openEdit = async (emp) => {
        setEditingEmployee(emp);
        setIsCreating(false);
        setFormError('');
        setFieldErrors({});
      if (emp.isLocal) {
        const positionProfile = getPositionProfile(emp.position);
        setForm({
          ...emp,
          ...positionProfile,
          gender: emp.gender ?? 1,
          birthDate: emp.birthDate || '',
          groupName: emp.groupName || positionProfile.groupName,
          department: emp.department || positionProfile.department,
          baseSalary: Number(emp.baseSalary ?? positionProfile.baseSalary),
          commissionRate: Number(emp.commissionRate ?? positionProfile.commissionRate),
          startDate: emp.startDate || '',
          cccd: emp.cccd || '',
          hometown: emp.hometown || '',
        });
        setModalOpen(true);
        return;
      }
      setEditLoading(true);
      try {
        const employeeId = Number(String(emp.id || '').replace(/\D/g, ''));
        if (!employeeId) {
          setFormError('Mã nhân viên không hợp lệ.');
          return;
        }
        const detail = await getEmployeeDetailApi(employeeId);
        const resolvedPosition = detail.chucVu || emp.position || POSITION_OPTIONS[0];
        const positionProfile = getPositionProfile(resolvedPosition);
        setForm({
          ...emp,
          id: emp.id,
          name: detail.fullName || emp.name || '',
          gender: Number(detail.gioiTinh) === 0 ? 0 : 1,
          birthDate: toInputDate(detail.ngaySinh),
          position: resolvedPosition,
          groupName: detail.groupName || positionProfile.groupName,
          department: detail.boPhan || positionProfile.department,
          baseSalary: Number(detail.luongCoBan ?? positionProfile.baseSalary),
          commissionRate: Number(detail.tyLeHoaHong ?? positionProfile.commissionRate),
          phone: detail.soDienThoai || emp.phone || '',
          email: detail.email || emp.email || '',
          startDate: toInputDate(detail.ngayVaoLam),
          cccd: detail.cccd || '',
          hometown: detail.queQuan || '',
          status: Number(detail.trangThai) === 1 ? 'Đang làm' : 'Đã nghỉ',
        });
        setModalOpen(true);
      }
      catch (e) {
        const message = e instanceof Error ? e.message : 'Không thể tải thông tin nhân viên để chỉnh sửa';
        setFormError(message);
        setModalOpen(true);
      }
      finally {
        setEditLoading(false);
      }
    };
    const handleSave = async () => {
        const nextFieldErrors = {};
        if (!form.name.trim())
          nextFieldErrors.name = 'Họ tên là bắt buộc.';
        if (!form.birthDate)
          nextFieldErrors.birthDate = 'Ngày sinh là bắt buộc.';
        if (!form.position)
          nextFieldErrors.position = 'Chức vụ là bắt buộc.';
        if (!form.startDate)
          nextFieldErrors.startDate = 'Ngày vào làm là bắt buộc.';
        if (!form.hometown.trim())
          nextFieldErrors.hometown = 'Quê quán là bắt buộc.';
        const birthDate = parseIsoDate(form.birthDate);
        const startDate = parseIsoDate(form.startDate);
        const today = parseIsoDate(getTodayIsoDate());
        if (form.birthDate && (!birthDate || !today)) {
          nextFieldErrors.birthDate = 'Ngày sinh không hợp lệ.';
        }
        if (form.startDate && !startDate) {
          nextFieldErrors.startDate = 'Ngày vào làm không hợp lệ.';
        }
        const birthDateError = form.birthDate ? validateBirthDateNotFuture(form.birthDate) : '';
        if (birthDateError) {
            nextFieldErrors.birthDate = birthDateError;
        }
        const adultError = form.birthDate && form.startDate
          ? validateAdultForEmployment(form.birthDate, form.startDate)
          : '';
        if (adultError) {
          nextFieldErrors.birthDate = adultError;
        }
        if (!form.phone.trim()) {
          nextFieldErrors.phone = 'Số điện thoại là bắt buộc.';
        }
        else if (!isValidPhoneNumber(form.phone)) {
          nextFieldErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số.';
        }
        if (!form.email.trim()) {
          nextFieldErrors.email = 'Email là bắt buộc.';
        }
        else {
            const emailError = validateEmail(form.email);
            if (emailError)
                nextFieldErrors.email = emailError;
        }
        if (!form.cccd.trim()) {
          nextFieldErrors.cccd = 'CCCD là bắt buộc.';
        }
        else if (!isValidCitizenId(form.cccd)) {
          nextFieldErrors.cccd = 'CCCD phải gồm từ 9 đến 12 chữ số.';
        }
        const duplicatedPhone = employees.some((row) => row.id !== editingEmployee?.id && row.phone?.trim() === form.phone.trim());
        if (form.phone.trim() && duplicatedPhone) {
          nextFieldErrors.phone = 'Số điện thoại đã tồn tại, vui lòng nhập số khác.';
        }
        const duplicatedEmail = employees.some((row) => row.id !== editingEmployee?.id && row.email?.trim().toLowerCase() === form.email.trim().toLowerCase());
        if (form.email.trim() && duplicatedEmail) {
          nextFieldErrors.email = 'Email đã tồn tại, vui lòng nhập email khác.';
        }
        const duplicatedCitizenId = employees.some((row) => row.id !== editingEmployee?.id && row.cccd?.trim() === form.cccd.trim());
        if (form.cccd.trim() && duplicatedCitizenId) {
          nextFieldErrors.cccd = 'CCCD đã tồn tại, vui lòng kiểm tra lại.';
        }
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
          setFormError('');
          return;
        }
        setFieldErrors({});
        setFormError('');
        if (editingEmployee) {
            setEmployees((prev) => prev.map((e) => e.id === editingEmployee.id
                ? {
                    ...form,
              isLocal: e.isLocal !== false,
                }
                : e));
            setModalOpen(false);
            return;
        }
        try {
          const created = await createEmployeeApi({
            fullName: form.name.trim(),
            gender: Number(form.gender) === 0 ? 0 : 1,
            birthDate: form.birthDate,
            phone: form.phone.trim(),
            email: form.email.trim(),
            positionName: form.position,
            status: form.status === 'Đang làm' ? 1 : 0,
            hometown: form.hometown.trim(),
            startDate: form.startDate,
            citizenId: form.cccd.trim(),
            department: String(form.department || '').trim(),
          });

          setEmployees((prev) => [
            ...prev,
            {
              ...form,
              id: `NV${String(created.id).padStart(3, '0')}`,
              isLocal: false,
            },
          ]);
          setIsCreating(false);
          setModalOpen(false);
        }
        catch (e) {
          const message = e instanceof Error ? e.message : 'Không thể thêm nhân viên';
          setFormError(message);
        }
    };
      const closeEmployeeForm = () => {
        setFormError('');
        setFieldErrors({});
        setEditLoading(false);
        if (editingEmployee) {
          setModalOpen(false);
          setEditingEmployee(null);
          return;
        }
        setIsCreating(false);
      };
    const handleView = async (emp) => {
        if (emp.isLocal) {
          setViewModalOpen(true);
          setViewLoading(false);
          setViewError('');
          setViewDetail(buildLocalEmployeeDetail(emp));
          return;
        }
        setViewModalOpen(true);
        setViewLoading(true);
        setViewError('');
        setViewDetail(null);
        try {
            const employeeId = Number(emp.id.replace(/\D/g, ''));
            if (!employeeId) {
                setViewError('Mã nhân viên không hợp lệ.');
                return;
            }
            const detail = await getEmployeeDetailApi(employeeId);
            setViewDetail(detail);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Không thể tải thông tin nhân viên';
            setViewError(message);
        }
        finally {
            setViewLoading(false);
        }
    };
    const handleDelete = async (emp) => {
        if (!confirm(`Bạn có chắc muốn xóa nhân viên?`)) {
            return;
        }
        try {
            setError('');
            const employeeId = Number(emp.id.replace(/\D/g, ''));
            if (!employeeId) {
                setError('Mã nhân viên không hợp lệ.');
                return;
            }
            await resignEmployeeApi(employeeId);
            setEmployees((prev) => prev.map((row) => row.id === emp.id
                ? {
                    ...row,
                    status: 'Đã nghỉ',
                }
                : row));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Không thể cập nhật trạng thái nhân viên';
            setError(message);
        }
    };
    const employeeFormContent = (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {editLoading && (<div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
        Đang tải dữ liệu nhân viên...
        </div>)}
        {formError && (<div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>)}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã NV
          </label>
          <input value={form.id} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ tên *
          </label>
          <input value={form.name} onChange={(e) => setFormField('name', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giới tính *
          </label>
          <select value={form.gender} onChange={(e) => setFormField('gender', Number(e.target.value) === 0 ? 0 : 1)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
            <option value={1}>Nam</option>
            <option value={0}>Nữ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày sinh *
          </label>
          <input type="date" value={form.birthDate} onChange={(e) => setFormField('birthDate', e.target.value)} max={getTodayIsoDate()} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.birthDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.birthDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.birthDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chức vụ *
          </label>
          <select value={form.position} onChange={(e) => setFormField('position', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.position ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            {!POSITION_OPTIONS.includes(form.position) && form.position && (<option value={form.position}>{form.position}</option>)}
            {POSITION_OPTIONS.map((position) => (<option key={position} value={position}>
                {position}
              </option>))}
          </select>
          {fieldErrors.position && <p className="mt-1 text-xs text-red-600">{fieldErrors.position}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm quyền</label>
          <input value={form.groupName || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bộ phận</label>
          <input value={form.department || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lương cơ bản</label>
          <input value={`${new Intl.NumberFormat('vi-VN').format(Number(form.baseSalary || 0))} đ`} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ hoa hồng</label>
          <input value={`${Number(form.commissionRate || 0)}%`} disabled className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SĐT *</label>
          <input value={form.phone} onChange={(e) => setFormField('phone', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input value={form.email} onChange={(e) => setFormField('email', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày vào làm *</label>
          <input type="date" value={form.startDate} onChange={(e) => setFormField('startDate', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.startDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.startDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CCCD *</label>
          <input value={form.cccd} onChange={(e) => setFormField('cccd', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.cccd ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.cccd && <p className="mt-1 text-xs text-red-600">{fieldErrors.cccd}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quê quán *</label>
          <input value={form.hometown} onChange={(e) => setFormField('hometown', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50 ${fieldErrors.hometown ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}/>
          {fieldErrors.hometown && <p className="mt-1 text-xs text-red-600">{fieldErrors.hometown}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select value={form.status} onChange={(e) => setForm({
            ...form,
            status: e.target.value,
        })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400/50">
            <option>Đang làm</option>
            <option>Đã nghỉ</option>
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
          <button onClick={closeEmployeeForm} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors">
            Lưu
          </button>
        </div>
      </div>);
    return (<>
        {error && (<div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>)}
      {!isCreating && (<DataTable title="Danh sách nhân viên" columns={columns} data={employees} searchPlaceholder="Tìm nhân viên..." onAdd={openAdd} noHorizontalScroll pageSize={10} rowActions={[
            {
                key: 'view',
                label: 'Xem',
                onClick: handleView,
                className: 'p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors',
            },
            {
                key: 'edit',
                label: 'Sửa',
                onClick: openEdit,
                className: 'p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors',
            },
            {
                key: 'delete',
                label: 'Xóa',
                onClick: handleDelete,
                className: 'p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors',
            },
        ]} addLabel="Thêm nhân viên"/>) }
      {isCreating && (<div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <button onClick={closeEmployeeForm} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowLeftIcon className="h-4 w-4"/>
              Quay lại
            </button>
            <h3 className="text-base font-semibold text-gray-900">Thêm nhân viên mới</h3>
          </div>
          {employeeFormContent}
        </div>)}
      <Modal isOpen={modalOpen && !!editingEmployee} onClose={closeEmployeeForm} title="Sửa nhân viên" size="xl">
        {employeeFormContent}
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Thông tin nhân viên" size="xl">
        {viewLoading ? (<p className="text-sm text-gray-600">Đang tải thông tin...</p>) : viewError ? (<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{viewError}</p>) : viewDetail ? (<div className="space-y-4 text-sm text-gray-800">
            {(() => {
            const employeeAvatarSrc = resolveImageSource(viewDetail.hinhAnh) || anhthe;
            return (<>
            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
              <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4 h-fit">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase mb-3"></p>            
                <img 
                  src={employeeAvatarSrc} 
                  alt={`Ảnh thẻ ${viewDetail.fullName}`} 
                  className="h-64 w-full rounded-lg border border-gray-200 object-cover shadow-sm"
                />
                <p className="mt-3 text-sm font-bold text-gray-700 break-words text-center">
                  {viewDetail.fullName}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Mã nhân viên</p>
                <p className="font-semibold">NV{String(viewDetail.mnv).padStart(3, '0')}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Tài khoản</p>
                <p className="font-semibold">{viewDetail.username || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Họ tên</p>
                <p className="font-semibold">{viewDetail.fullName}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Nhóm quyền</p>
                <p className="font-semibold">{viewDetail.groupName || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Chức vụ</p>
                <p className="font-semibold">{viewDetail.chucVu || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Bộ phận</p>
                <p className="font-semibold">{viewDetail.boPhan || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Giới tính</p>
                <p className="font-semibold">{formatGender(viewDetail.gioiTinh)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Ngày sinh</p>
                <p className="font-semibold">{formatDisplayDate(viewDetail.ngaySinh)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Số điện thoại</p>
                <p className="font-semibold">{viewDetail.soDienThoai || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words sm:col-span-2 xl:col-span-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold">{viewDetail.email || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words sm:col-span-2 xl:col-span-3">
                <p className="text-xs text-gray-500">Địa chỉ</p>
                <p className="font-semibold">{viewDetail.diaChi || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Quê quán</p>
                <p className="font-semibold">{viewDetail.queQuan || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">CCCD</p>
                <p className="font-semibold">{viewDetail.cccd || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Ngày vào làm</p>
                <p className="font-semibold">{formatDisplayDate(viewDetail.ngayVaoLam)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Trạng thái làm việc</p>
                <p className="font-semibold">{formatWorkStatus(viewDetail.trangThai)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Trạng thái tài khoản</p>
                <p className="font-semibold">{viewDetail.trangThaiTaiKhoan === 1 ? 'Hoạt động' : 'Khóa'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Lương cơ bản</p>
                <p className="font-semibold">{new Intl.NumberFormat('vi-VN').format(viewDetail.luongCoBan)} đ</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Tỷ lệ hoa hồng</p>
                <p className="font-semibold">{viewDetail.tyLeHoaHong}%</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words sm:col-span-2 xl:col-span-1">
                <p className="text-xs text-gray-500">Số tài khoản ngân hàng</p>
                <p className="font-semibold">{viewDetail.soTaiKhoanNganHang || 'Chưa cập nhật'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 break-words">
                <p className="text-xs text-gray-500">Tên ngân hàng</p>
                <p className="font-semibold">{viewDetail.tenNganHang || 'Chưa cập nhật'}</p>
              </div>
              </div>
            </div>
            </>);
        })()}
          </div>) : (<p className="text-sm text-gray-500">Không có dữ liệu.</p>)}
      </Modal>
    </>);
}
