import { apiRequest } from './apiClient'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
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
  }
}

export type MyProfile = {
  mnv: number
  username: string
  fullName: string
  mnq: number
  role: string
  groupName: string
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
  note: string | null
  approverId: number | null
  approverName: string | null
}

export type SalaryRecord = {
  MNV: number
  HOTEN: string
  LUONGCOBAN: number
  PHUCAP: number
  NGAYCONG: number
  LUONGTHUCLANH: number
}

export type ImportReceiptItem = {
  MPN: number
  MNCC: number
  TENNHACUNGCAP?: string
  TENNHANVIEN?: string
  TIEN: number
  TG: string
  TT: number
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
    SOLUONG: number
    GIANHAP: number
    GIABAN: number
    NHAP_TRONG_KY: number
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

export async function getPositionSalaryApi(): Promise<PositionSalaryItem[]> {
  const response = await apiRequest<ApiEnvelope<PositionSalaryItem[]>>('/api/hr/positions')
  return response.data
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

export async function getInventoryReportApi(month: number | null, year: number): Promise<InventoryReport> {
  const query = month ? `month=${month}&year=${year}` : `year=${year}`
  const response = await apiRequest<ApiEnvelope<InventoryReport>>(`/api/admin/inventory/report?${query}`)
  return response.data
}