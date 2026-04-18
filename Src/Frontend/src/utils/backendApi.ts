import { apiRequest } from './apiClient'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type PermissionGrant = {
  mcn: string
  hanhDong: string
}

export type LoginResponse = {
  accessToken: string
  user: {
    mnv: number
    username: string
    fullName: string
    hinhAnh: string | null
    role: string
    groupName: string
    permissions: PermissionGrant[]
  }
}

export type MyProfile = {
  mnv: number
  username: string
  fullName: string
  mnq: number
  role: string
  groupName: string
  permissions: PermissionGrant[]
  ngaySinh: string | null
  gioiTinh: number | null
  soDienThoai: string | null
  email: string | null
  trangThai: number | null
  queQuan: string | null
  diaChi: string | null
  hinhAnh: string | null
  chucVu: string | null
  ngayVaoLam: string | null
  cccd: string | null
  boPhan: string | null
  trangThaiLamViec: number | null
  luongCoBan: number
  soTaiKhoanNganHang: string | null
  tenNganHang: string | null
  maSoThueCaNhan: string | null
  khauTruBaoHiem: {
    bhxhRate: number
    bhytRate: number
    bhtnRate: number
    bhxhAmount: number
    bhytAmount: number
    bhtnAmount: number
  }
}

export type EmployeeItem = {
  MNV: number
  HOTEN: string
  TENCHUCVU: string
  SDT: string
  EMAIL: string
  TT: number
}

export type EmployeeDetail = {
  mnv: number
  username: string | null
  fullName: string
  groupName: string | null
  chucVu: string | null
  gioiTinh: number | null
  ngaySinh: string | null
  soDienThoai: string | null
  email: string | null
  trangThai: number
  trangThaiTaiKhoan: number
  queQuan: string | null
  diaChi: string | null
  hinhAnh: string | null
  ngayVaoLam: string | null
  cccd: string | null
  boPhan: string | null
  soTaiKhoanNganHang: string | null
  tenNganHang: string | null
  luongCoBan: number
  tyLeHoaHong: number
}

export type CreateEmployeePayload = {
  fullName: string
  gender: number
  birthDate: string
  phone: string
  email: string
  positionName: string
  status: number
  hometown: string
  startDate: string
  citizenId: string
  department: string
}

export type PositionSalaryItem = {
  id: number
  positionName: string
  baseSalary: number
  commissionRate: number
  status: number
}

export type PositionWorkHistoryItem = {
  id: number
  employeeId: number
  employeeName: string
  oldPositionId: number | null
  oldPositionName: string | null
  oldBaseSalary: number
  newPositionId: number
  newPositionName: string | null
  newBaseSalary: number
  effectiveDate: string | null
  endDate: string | null
  note: string | null
  approverId: number | null
  approverName: string | null
}

export type SalaryRecord = {
  MNV: number
  HOTEN: string
  TENCHUCVU?: string
  LUONGCOBAN: number
  PHUCAP: number
  NGAYCONG: number
  BHXH?: number
  BHYT?: number
  BHTN?: number
  KHAUTRU_KHAC?: number
  KHAUTRU?: number
  NGAYCONG_THUCTE?: number
  SO_NGAY_LE_DI_LAM?: number
  NGAYCONG_LE_QUYDOI_THEM?: number
  DOANH_SO?: number
  TY_LE_HOA_HONG?: number
  HOA_HONG?: number
  NGAYNGHI_DA_DUNG?: number
  NGAYNGHI_CONLAI?: number
  NGAY_NGHI_KHONG_LUONG?: number
  LUONGTHUCLANH: number
  TT: number
}

export type LeaveRequestItem = {
  MDN: number
  MNV: number
  HOTEN: string
  LOAI: number
  NGAYNGHI: string
  NGAYKETTHUC?: string | null
  NGAY_NGHIVIEC?: string | null
  SONGAY?: number
  LYDO: string | null
  MINHCHUNG?: string | null
  TRANGTHAI: number
  NGUOIDUYET: number | null
  NGAYTAO: string
  GHICHU: string | null
}

export type CreateMyLeaveRequestPayload = {
  type: 0 | 1 | 2 | 3
  startDate: string
  endDate?: string
  resignationDate?: string
  reason: string
  evidenceFile?: File | null
}

export type DailyAttendanceEmployee = {
  mnv: number
  fullName: string
  positionName: string | null
  status: number
  present: boolean
}

export type DailyAttendanceData = {
  date: string
  employees: DailyAttendanceEmployee[]
}

export type MyAttendanceShiftItem = {
  mpcl: number
  shiftId: number
  shiftName: string | null
  startTime: string | null
  endTime: string | null
  checkIn: string | null
  checkOut: string | null
  status: number
}

export type MyAttendanceStatus = {
  date: string
  hasShift: boolean
  canCheckIn: boolean
  canCheckOut: boolean
  shifts: MyAttendanceShiftItem[]
}

export type AttendanceShiftItem = {
  mca: number
  shiftName: string
  startTime: string | null
  endTime: string | null
  status: number
}

export type AttendanceShiftAssignmentItem = {
  mpcl: number
  mnv: number
  fullName: string
  positionName: string | null
  shiftId: number
  shiftName: string | null
  startTime: string | null
  endTime: string | null
  date: string
  checkIn: string | null
  checkOut: string | null
  status: number
}

export type AttendanceShiftAssignmentData = {
  date: string
  shifts: AttendanceShiftItem[]
  assignments: AttendanceShiftAssignmentItem[]
}

export type HolidayMultiplierItem = {
  id: number
  name: string
  date: string
  multiplier: number
  note: string | null
}

export type ImportReceiptItem = {
  MPN: number
  MNCC: number
  TENNHACUNGCAP?: string
  TENNHANVIEN?: string
  TIEN: number
  TG: string
  TT: number
  LYDOHUY?: string | null
  SO_DONG_SANPHAM?: number
  TONG_SO_LUONG?: number
}

export type ImportReceiptDetail = {
  MPN: number
  MNV: number
  TENNHANVIEN: string
  MNCC: number
  TENNHACUNGCAP: string
  TIEN: number
  TG: string
  TT: number
  LYDOHUY?: string | null
  SO_DONG_SANPHAM: number
  TONG_SO_LUONG: number
  ITEMS: Array<{
    MSP: number
    TENSP: string
    SL: number
    TIENNHAP: number
    HINHTHUC: number
    THANHTIEN: number
  }>
}

export type ProductItem = {
  MSP: number
  TEN: string
  TENVITRI: string | null
  THUONGHIEU: string | null
  TENNHACUNGCAP: string
  MNCC: number
  GIANHAP: number
  GIABAN: number
  SOLUONG: number
  TT: number
  NAMSANXUAT: number | null
}

export type SupplierItem = {
  MNCC: number
  TEN: string
  DIACHI: string | null
  SDT: string | null
  EMAIL: string | null
  TT: number
  THUONGHIEU_CUNG_CAP?: string | null
}

export type DisplayLocationItem = {
  MVT: number
  TEN: string
  GHICHU: string | null
  PRODUCT_COUNT?: number
}

export type InventoryReport = {
  year: number
  month: number | null
  summary: {
    TONG_SANPHAM: number
    SANPHAM_HOATDONG: number
    TONG_TON_KHO: number
    GIA_TRI_TON_THEO_GIANHAP: number
    GIA_TRI_TON_THEO_GIABAN: number
  }
  imports: {
    SO_PHIEU_NHAP: number
    SO_LUONG_NHAP: number
    TONG_GIA_TRI_NHAP: number
  }
  products: Array<{
    MSP: number
    TEN: string
    THUONGHIEU: string | null
    TENNHACUNGCAP: string
    TON_DAU_KY: number
    SOLUONG: number
    XUAT_TRONG_KY: number
    GIANHAP: number
    GIABAN: number
    NHAP_TRONG_KY: number
    TT: number
  }>
}

export type DashboardOverview = {
  year: number
  summary: {
    doanhThu: number
    hoaDonMoi: number
    sanPhamTonThap: number
    nhanSu: number
  }
  chart: Array<{
    month: string
    revenue: number
    profit: number
  }>
  recentTransactions: Array<{
    id: string
    customer: string
    total: number
    time: string
    type?: string
    status?: string
  }>
}

export type HeaderNotificationItem = {
  id: string
  text: string
  time: string | null
  unread: boolean
}

export type UserAccountItem = {
  mnv: number
  username: string
  fullName: string
  mnq: number
  roleName: string
  status: number
  startDate: string | null
}

export type UserMeta = {
  roles: Array<{
    mnq: number
    name: string
  }>
  availableEmployees: Array<{
    mnv: number
    fullName: string
  }>
}

export type PermissionItem = {
  mnq: number
  roleName: string
  status: number
}

export type PermissionMeta = {
  features: Array<{
    mcn: string
    name: string
  }>
  actions: Array<{
    key: string
    label: string
  }>
}

export type PermissionGroupDetail = {
  mnq: number
  roleName: string
  permissions: Array<{
    mcn: string
    actions: string[]
  }>
}

export type CustomerItem = {
  MKH: number
  HOTEN: string
  SDT: string | null
  EMAIL: string | null
  TT: number
}

export type SaleProductItem = {
  MSP: number
  TEN: string
  GIABAN: number
  SOLUONG: number
  TT: number
}

export type ExportReceiptItem = {
  MPX: number
  MNV: number | null
  TENNHANVIEN?: string | null
  MKH: number
  TENKHACHHANG?: string
  TIEN: number
  TG: string
  TT: number
  LYDOHUY?: string | null
  SO_DONG_sanPHAM?: number
  TONG_SO_LUONG?: number
}

export type ExportReceiptDetail = {
  MPX: number
  MNV: number | null
  TENNHANVIEN?: string | null
  MKH: number
  TENKHACHHANG?: string
  TIEN: number
  TG: string
  TT: number
  LYDOHUY?: string | null
  SO_DONG_sanPHAM: number
  TONG_SO_LUONG: number
  ITEMS: Array<{
    MSP: number
    TENSP: string
    SL: number
    TIENXUAT: number
    THANHTIEN: number
  }>
}

export type SalesReportData = {
  id: string
  reportName: string
  fromDate: string
  toDate: string
  createdAt: string
  revenue: number
  orders: number
  growth: number
  profitMargin: number
  totalCost: number
  grossProfit: number
  topProductName: string
  topProductUnits: number
  slowProductName: string
  slowProductUnits: number
  categoryData: Array<{ name: string; value: number }>
  monthlySales: Array<{ month: string; sales: number; orders: number }>
  dailySales?: Array<{ date: string; label: string; sales: number }>
  productRows: Array<{
    productName: string
    category: string
    units: number
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
}

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest<ApiEnvelope<LoginResponse>>('/api/admin/auth/login', {
    method: 'POST',
    body: { username, password },
  })
  return response.data
}

export async function getMyProfileApi(): Promise<MyProfile> {
  const response = await apiRequest<ApiEnvelope<MyProfile>>('/api/admin/auth/me')
  return response.data
}

export async function getDashboardOverviewApi(year: number): Promise<DashboardOverview> {
  const response = await apiRequest<ApiEnvelope<DashboardOverview>>(`/api/admin/dashboard/overview?year=${year}`)
  return response.data
}

export async function getHeaderNotificationsApi(): Promise<HeaderNotificationItem[]> {
  const response = await apiRequest<ApiEnvelope<HeaderNotificationItem[]>>('/api/admin/dashboard/notifications')
  return response.data
}

export async function getUserAccountsApi(): Promise<UserAccountItem[]> {
  const response = await apiRequest<ApiEnvelope<UserAccountItem[]>>('/api/admin/users')
  return response.data
}

export async function getUserMetaApi(): Promise<UserMeta> {
  const response = await apiRequest<ApiEnvelope<UserMeta>>('/api/admin/users/meta')
  return response.data
}

export async function createUserAccountApi(payload: {
  mnv: number
  username: string
  password: string
  mnq: number
  status: number
}): Promise<void> {
  await apiRequest<ApiEnvelope<null>>('/api/admin/users', {
    method: 'POST',
    body: payload,
  })
}

export async function updateUserAccountApi(
  id: number,
  payload: {
    mnq?: number
    status?: number
    newPassword?: string
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteUserAccountApi(id: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  })
}

export async function getPermissionsApi(): Promise<PermissionItem[]> {
  const response = await apiRequest<ApiEnvelope<PermissionItem[]>>('/api/admin/permissions/groups')
  return response.data
}

export async function getPermissionMetaApi(): Promise<PermissionMeta> {
  const response = await apiRequest<ApiEnvelope<PermissionMeta>>('/api/admin/permissions/meta')
  return response.data
}

export async function getPermissionGroupDetailApi(id: number): Promise<PermissionGroupDetail> {
  const response = await apiRequest<ApiEnvelope<PermissionGroupDetail>>(`/api/admin/permissions/groups/${id}`)
  return response.data
}

export async function createPermissionApi(payload: {
  roleName: string
  permissions: Array<{ mcn: string; actions: string[] }>
}): Promise<void> {
  await apiRequest<ApiEnvelope<null>>('/api/admin/permissions/groups', {
    method: 'POST',
    body: payload,
  })
}

export async function updatePermissionApi(
  id: number,
  payload: {
    roleName: string
    permissions: Array<{ mcn: string; actions: string[] }>
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/permissions/groups/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deletePermissionApi(id: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/permissions/groups/${id}`, {
    method: 'DELETE',
  })
}

export async function updateMyProfileApi(payload: {
  fullName: string
  gioiTinh: number
  ngaySinh: string
  soDienThoai: string
  email: string
  trangThai: number
  queQuan: string
  diaChi: string
  hinhAnh: string
  ngayVaoLam: string
  cccd: string
  boPhan: string
  trangThaiLamViec: number
  soTaiKhoanNganHang: string
  tenNganHang: string
}): Promise<void> {
  await apiRequest<ApiEnvelope<null>>('/api/admin/auth/me', {
    method: 'PATCH',
    body: payload,
  })
}

export async function changeMyPasswordApi(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await apiRequest<ApiEnvelope<null>>('/api/admin/auth/change-password', {
    method: 'PATCH',
    body: payload,
  })
}

export async function getEmployeesApi(): Promise<EmployeeItem[]> {
  const response = await apiRequest<ApiEnvelope<EmployeeItem[]>>('/api/hr/employees')
  return response.data
}

export async function getEmployeeDetailApi(employeeId: number): Promise<EmployeeDetail> {
  const response = await apiRequest<ApiEnvelope<EmployeeDetail>>(`/api/hr/employees/${employeeId}`)
  return response.data
}

export async function createEmployeeApi(payload: CreateEmployeePayload): Promise<{ id: number }> {
  const response = await apiRequest<ApiEnvelope<{ id: number }>>('/api/hr/employees', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function resignEmployeeApi(employeeId: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/employees/${employeeId}/resign`, {
    method: 'PATCH',
  })
}

export async function getSalaryApi(month: number, year: number): Promise<SalaryRecord[]> {
  const response = await apiRequest<
    ApiEnvelope<{
      month: number
      year: number
      records: SalaryRecord[]
    }>
  >(`/api/hr/salary?month=${month}&year=${year}`)
  return response.data.records
}

export async function updateSalaryApi(mbl: number, payload: {
  khauTruKhac?: number
}): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/salary/${mbl}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function finalizeSalaryApi(mbl: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/salary/${mbl}/finalize`, {
    method: 'POST',
    body: {},
  })
}

export async function getTodayAttendanceApi(date?: string): Promise<DailyAttendanceData> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const response = await apiRequest<ApiEnvelope<DailyAttendanceData>>(`/api/hr/attendance/today${query}`)
  return response.data
}

export async function saveTodayAttendanceApi(payload: {
  presentEmployeeIds: number[]
  date?: string
}): Promise<{ date: string; presentCount: number }> {
  const response = await apiRequest<ApiEnvelope<{ date: string; presentCount: number }>>('/api/hr/attendance/today', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function getShiftAssignmentsApi(date?: string): Promise<AttendanceShiftAssignmentData> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const response = await apiRequest<ApiEnvelope<AttendanceShiftAssignmentData>>(`/api/hr/attendance/shifts${query}`)
  return response.data
}

export async function saveShiftAssignmentsApi(payload: {
  date?: string
  assignments: Array<{ employeeId: number; shiftIds: number[] }>
}): Promise<{ date: string; assignedCount: number }> {
  const response = await apiRequest<ApiEnvelope<{ date: string; assignedCount: number }>>('/api/hr/attendance/shifts', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function getMyAttendanceStatusApi(date?: string): Promise<MyAttendanceStatus> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const response = await apiRequest<ApiEnvelope<MyAttendanceStatus>>(`/api/hr/attendance/me${query}`)
  return response.data
}

export async function checkInAttendanceApi(payload?: { date?: string }): Promise<{ date: string }> {
  const response = await apiRequest<ApiEnvelope<{ date: string }>>('/api/hr/attendance/check-in', {
    method: 'POST',
    body: payload || {},
  })
  return response.data
}

export async function checkOutAttendanceApi(payload?: { date?: string }): Promise<{ date: string }> {
  const response = await apiRequest<ApiEnvelope<{ date: string }>>('/api/hr/attendance/check-out', {
    method: 'POST',
    body: payload || {},
  })
  return response.data
}

export async function getMySalaryApi(month: number, year: number): Promise<SalaryRecord | null> {
  const response = await apiRequest<
    ApiEnvelope<{
      month: number
      year: number
      record: SalaryRecord | null
    }>
  >(`/api/hr/salary/me?month=${month}&year=${year}`)
  return response.data.record || null
}

export async function getPositionSalaryApi(): Promise<PositionSalaryItem[]> {
  const response = await apiRequest<ApiEnvelope<PositionSalaryItem[]>>('/api/hr/positions')
  return response.data
}

export async function getHolidayMultipliersApi(year?: number): Promise<HolidayMultiplierItem[]> {
  const query = Number.isInteger(year) ? `?year=${year}` : ''
  const response = await apiRequest<ApiEnvelope<HolidayMultiplierItem[]>>(`/api/hr/holidays${query}`)
  return response.data
}

export async function createHolidayMultiplierApi(payload: {
  name: string
  date: string
  multiplier: number
  note?: string
}): Promise<{ id: number }> {
  const response = await apiRequest<ApiEnvelope<{ id: number }>>('/api/hr/holidays', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updateHolidayMultiplierApi(
  id: number,
  payload: {
    name: string
    date: string
    multiplier: number
    note?: string
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/holidays/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteHolidayMultiplierApi(id: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/holidays/${id}`, {
    method: 'DELETE',
  })
}

export async function getLeaveRequestsApi(status?: number): Promise<LeaveRequestItem[]> {
  const query = typeof status === 'number' ? `?status=${status}` : ''
  const response = await apiRequest<ApiEnvelope<LeaveRequestItem[]>>(`/api/hr/leave-requests${query}`)
  return response.data
}

export async function getMyLeaveRequestsApi(): Promise<LeaveRequestItem[]> {
  const response = await apiRequest<ApiEnvelope<LeaveRequestItem[]>>('/api/hr/my-leave-requests')
  return response.data
}

export async function createMyLeaveRequestApi(
  payload: CreateMyLeaveRequestPayload,
): Promise<{ id: number }> {
  const formData = new FormData()
  formData.append('type', String(payload.type))
  formData.append('startDate', payload.startDate)
  if (payload.endDate) {
    formData.append('endDate', payload.endDate)
  }
  if (payload.resignationDate) {
    formData.append('resignationDate', payload.resignationDate)
  }
  formData.append('reason', payload.reason)
  if (payload.evidenceFile) {
    formData.append('evidence', payload.evidenceFile)
  }

  const response = await apiRequest<ApiEnvelope<{ id: number }>>('/api/hr/my-leave-requests', {
    method: 'POST',
    body: formData,
  })
  return response.data
}

export async function decideLeaveRequestApi(
  id: number,
  payload: { status: 1 | 2; note?: string },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/leave-requests/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function getPositionWorkHistoryApi(): Promise<PositionWorkHistoryItem[]> {
  const response = await apiRequest<ApiEnvelope<PositionWorkHistoryItem[]>>('/api/hr/positions/history')
  return response.data
}

export async function transferEmployeePositionApi(payload: {
  employeeId: number
  newPositionId: number
  effectiveDate: string
  note?: string
}): Promise<{ historyId: number; previousPositionId: number }> {
  const response = await apiRequest<ApiEnvelope<{ historyId: number; previousPositionId: number }>>('/api/hr/positions/transfer', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updatePositionSalaryApi(
  id: number,
  payload: {
    baseSalary: number
    commissionRate: number
    status: number
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/positions/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function createPositionSalaryApi(payload: {
  positionName: string
  baseSalary: number
  commissionRate: number
  status: number
}): Promise<{ id: number }> {
  const response = await apiRequest<ApiEnvelope<{ id: number }>>('/api/hr/positions', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function getImportReceiptsApi(limit = 50): Promise<ImportReceiptItem[]> {
  const response = await apiRequest<ApiEnvelope<ImportReceiptItem[]>>(
    `/api/admin/inventory/import-receipts?limit=${limit}`,
  )
  return response.data
}

export async function createImportReceiptApi(payload: {
  mnv?: number
  mncc: number
  items: Array<{ msp: number; sl: number; tienNhap: number; hinhThuc?: number }>
}): Promise<{ importReceiptId: number; total: number }> {
  const response = await apiRequest<ApiEnvelope<{ importReceiptId: number; total: number }>>(
    '/api/admin/inventory/import-receipts',
    {
      method: 'POST',
      body: payload,
    },
  )
  return response.data
}

export async function getProductsApi(): Promise<ProductItem[]> {
  const response = await apiRequest<ApiEnvelope<ProductItem[]>>('/api/admin/inventory/products')
  return response.data
}

export async function createProductApi(payload: {
  name: string
  image?: string
  mncc: number
  importPrice: number
  sellPrice: number
  stock: number
  displayPosition?: string
  brand?: string
  productionYear?: number | null
  status?: number
}): Promise<{ productId: number }> {
  const response = await apiRequest<ApiEnvelope<{ productId: number }>>('/api/admin/inventory/products', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updateProductApi(
  id: number,
  payload: {
    name: string
    image?: string
    mncc: number
    importPrice: number
    sellPrice: number
    stock: number
    displayPosition?: string
    brand?: string
    productionYear?: number | null
    status?: number
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/products/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteProductApi(id: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/products/${id}`, {
    method: 'DELETE',
  })
}

export async function getSuppliersApi(): Promise<SupplierItem[]> {
  const response = await apiRequest<ApiEnvelope<SupplierItem[]>>('/api/admin/inventory/suppliers')
  return response.data
}

export async function createSupplierApi(payload: {
  name: string
  phone?: string
  email?: string
  address?: string
  status?: number
  brands?: string[]
}): Promise<{ supplierId: number }> {
  const response = await apiRequest<ApiEnvelope<{ supplierId: number }>>('/api/admin/inventory/suppliers', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updateSupplierApi(
  id: number,
  payload: {
    name: string
    phone?: string
    email?: string
    address?: string
    status?: number
    brands?: string[]
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/suppliers/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteSupplierApi(id: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/suppliers/${id}`, {
    method: 'DELETE',
  })
}

export async function getDisplayLocationsApi(): Promise<DisplayLocationItem[]> {
  const response = await apiRequest<ApiEnvelope<DisplayLocationItem[]>>('/api/admin/inventory/display-locations')
  return response.data
}

export async function createDisplayLocationApi(payload: {
  name: string
  note?: string
}): Promise<{ locationId: number }> {
  const response = await apiRequest<ApiEnvelope<{ locationId: number }>>('/api/admin/inventory/display-locations', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function updateDisplayLocationApi(
  id: number,
  payload: {
    name: string
    note?: string
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/display-locations/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteDisplayLocationApi(id: number): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/display-locations/${id}`, {
    method: 'DELETE',
  })
}

export async function getInventoryReportApi(month: number | null, year: number): Promise<InventoryReport> {
  const query = month ? `month=${month}&year=${year}` : `year=${year}`
  const response = await apiRequest<ApiEnvelope<InventoryReport>>(`/api/admin/inventory/report?${query}`)
  return response.data
}

export async function getImportReceiptDetailApi(id: number): Promise<ImportReceiptDetail> {
  const response = await apiRequest<ApiEnvelope<ImportReceiptDetail>>(
    `/api/admin/inventory/import-receipts/${id}`,
  )
  return response.data
}

export async function decideImportReceiptApi(
  id: number,
  payload: { action: 'approve' | 'reject'; reason?: string },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/admin/inventory/import-receipts/${id}/decision`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function getCustomersApi(): Promise<CustomerItem[]> {
  const response = await apiRequest<ApiEnvelope<CustomerItem[]>>('/api/sales/customers')
  return response.data
}

export async function getSaleProductsApi(): Promise<SaleProductItem[]> {
  const response = await apiRequest<ApiEnvelope<SaleProductItem[]>>('/api/sales/products')
  return response.data
}

export async function getExportReceiptsApi(limit = 100): Promise<ExportReceiptItem[]> {
  const response = await apiRequest<ApiEnvelope<ExportReceiptItem[]>>(`/api/sales/export-receipts?limit=${limit}`)
  return response.data
}

export async function getExportReceiptDetailApi(id: number): Promise<ExportReceiptDetail> {
  const response = await apiRequest<ApiEnvelope<ExportReceiptDetail>>(`/api/sales/export-receipts/${id}`)
  return response.data
}

export async function getSalesReportApi(payload: {
  fromDate: string
  toDate: string
  reportName?: string
}): Promise<SalesReportData> {
  const query = new URLSearchParams({
    fromDate: payload.fromDate,
    toDate: payload.toDate,
    ...(payload.reportName ? { reportName: payload.reportName } : {}),
  })
  const response = await apiRequest<ApiEnvelope<SalesReportData>>(`/api/sales/reports?${query.toString()}`)
  return response.data
}

export async function cancelExportReceiptApi(id: number, reason?: string): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/sales/export-receipts/${id}/cancel`, {
    method: 'PATCH',
    body: { reason },
  })
}

export async function createExportReceiptApi(payload: {
  mnv?: number
  mkh: number
  items: Array<{ msp: number; sl: number; tienXuat: number; mkm?: string | null }>
}): Promise<{ exportReceiptId: number; total: number }> {
  const response = await apiRequest<ApiEnvelope<{ exportReceiptId: number; total: number }>>('/api/sales/export-receipts', {
    method: 'POST',
    body: payload,
  })
  return response.data
}

export async function uploadProductImageApi(file: File): Promise<{ imageUrl: string; fileName: string }> {
  const formData = new FormData()
  formData.append('image', file)
  const response = await apiRequest<ApiEnvelope<{ imageUrl: string; fileName: string }>>(
    '/api/admin/inventory/products/upload-image',
    {
      method: 'POST',
      body: formData,
    },
  )
  return response.data
}

export type ViolationPenaltyItem = {
  id: number
  mnv: number
  month: number
  year: number
  violationType: string // 'Đi trễ', 'Về sớm', 'Đi trễ và về sớm'
  violationCount: number
  penaltyAmount: number
  description?: string | null
}

export async function getViolationPenaltiesApi(mnv: number, month: number, year: number): Promise<ViolationPenaltyItem[]> {
  const response = await apiRequest<ApiEnvelope<ViolationPenaltyItem[]>>(`/api/hr/violations?mnv=${mnv}&month=${month}&year=${year}`)
  return Array.isArray(response.data) ? response.data : []
}

export async function updateEmployeeApi(
  id: number,
  payload: {
    fullName: string
    gender: number
    birthDate: string
    phone: string
    email: string
    positionName: string
    status: number
    hometown: string
    startDate: string
    citizenId: string
    department: string
  },
): Promise<void> {
  await apiRequest<ApiEnvelope<null>>(`/api/hr/employees/${id}`, {
    method: 'PUT',
    body: payload,
  })
}