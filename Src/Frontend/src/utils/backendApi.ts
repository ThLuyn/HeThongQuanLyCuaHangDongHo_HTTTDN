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
    role: string
    groupName: string
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

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest<ApiEnvelope<LoginResponse>>('/api/admin/auth/login', {
    method: 'POST',
    body: { username, password },
  })
  return response.data
}

export async function getEmployeesApi(): Promise<EmployeeItem[]> {
  const response = await apiRequest<ApiEnvelope<EmployeeItem[]>>('/api/hr/employees')
  return response.data
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