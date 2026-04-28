import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('angaza_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('angaza_token')
      localStorage.removeItem('angaza_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  register: (data: RegisterPayload) =>
    api.post('/auth/register', data).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),
}

// ── Companies ─────────────────────────────────────────────────────────────────
export const companiesApi = {
  list: () => api.get('/companies').then((r) => r.data),
  get: (id: number) => api.get(`/companies/${id}`).then((r) => r.data),
  create: (data: Partial<CompanyPayload>) =>
    api.post('/companies', data).then((r) => r.data),
  update: (id: number, data: Partial<CompanyPayload>) =>
    api.put(`/companies/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/companies/${id}`).then((r) => r.data),
}

// ── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  list: () => api.get('/customers').then((r) => r.data),
  get: (id: number) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (data: Partial<CustomerPayload>) =>
    api.post('/customers', data).then((r) => r.data),
  update: (id: number, data: Partial<CustomerPayload>) =>
    api.put(`/customers/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/customers/${id}`).then((r) => r.data),
  getByCompany: (companyId: number) =>
    api.get(`/customers/company/${companyId}`).then((r) => r.data),
  search: (query: string) =>
    api.get(`/customers/search?q=${query}`).then((r) => r.data),
  getStats: () => api.get('/customers/stats').then((r) => r.data),
}

// ── Plans ─────────────────────────────────────────────────────────────────────
export const plansApi = {
  list: () => api.get('/plans').then((r) => r.data),
  get: (id: number) => api.get(`/plans/${id}`).then((r) => r.data),
  create: (data: Partial<PlanPayload>) =>
    api.post('/plans', data).then((r) => r.data),
  update: (id: number, data: Partial<PlanPayload>) =>
    api.put(`/plans/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/plans/${id}`).then((r) => r.data),
  activate: (id: number) => api.patch(`/plans/${id}/activate`).then((r) => r.data),
  deactivate: (id: number) => api.patch(`/plans/${id}/deactivate`).then((r) => r.data),
  reorder: (ids: number[]) => api.post('/plans/reorder', { ids }).then((r) => r.data),
  getStats: () => api.get('/plans/stats').then((r) => r.data),
}

// ── Devices ──────────────────────────────────────────────────────────────────
export const devicesApi = {
  list: () => api.get('/devices').then((r) => r.data),
  get: (id: number) => api.get(`/devices/${id}`).then((r) => r.data),
  create: (data: Partial<DevicePayload>) =>
    api.post('/devices', data).then((r) => r.data),
  update: (id: number, data: Partial<DevicePayload>) =>
    api.put(`/devices/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/devices/${id}`).then((r) => r.data),
  testConnection: (id: number) =>
    api.post(`/devices/${id}/test-connection`).then((r) => r.data),
  getTelemetry: (id: number) =>
    api.get(`/devices/${id}/telemetry`).then((r) => r.data),
  provision: (id: number, data: any) =>
    api.post(`/devices/${id}/provision`, data).then((r) => r.data),
  generateScript: (id: number) =>
    api.get(`/devices/${id}/script`).then((r) => r.data),
  bulkProvision: (data: any) =>
    api.post('/devices/bulk-provision', data).then((r) => r.data),
  getStats: () => api.get('/devices/stats').then((r) => r.data),
}

// ── Radius Users ────────────────────────────────────────────────────────────
export const radiusUsersApi = {
  list: () => api.get('/radius-users').then((r) => r.data),
  get: (id: number) => api.get(`/radius-users/${id}`).then((r) => r.data),
  create: (data: Partial<RadiusUserPayload>) =>
    api.post('/radius-users', data).then((r) => r.data),
  update: (id: number, data: Partial<RadiusUserPayload>) =>
    api.put(`/radius-users/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/radius-users/${id}`).then((r) => r.data),
  bulkCreate: (data: Partial<RadiusUserPayload>[]) =>
    api.post('/radius-users/bulk', data).then((r) => r.data),
  lock: (id: number) => api.patch(`/radius-users/${id}/lock`).then((r) => r.data),
  unlock: (id: number) => api.patch(`/radius-users/${id}/unlock`).then((r) => r.data),
  activate: (id: number) => api.patch(`/radius-users/${id}/activate`).then((r) => r.data),
  deactivate: (id: number) => api.patch(`/radius-users/${id}/deactivate`).then((r) => r.data),
  getByCustomer: (customerId: number) =>
    api.get(`/radius-users/customer/${customerId}`).then((r) => r.data),
  getActiveSessions: (id: number) =>
    api.get(`/radius-users/${id}/sessions`).then((r) => r.data),
  getStats: () => api.get('/radius-users/stats').then((r) => r.data),
}

// ── Invoices ────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: () => api.get('/invoices').then((r) => r.data),
  get: (id: number) => api.get(`/invoices/${id}`).then((r) => r.data),
  create: (data: Partial<InvoicePayload>) =>
    api.post('/invoices', data).then((r) => r.data),
  update: (id: number, data: Partial<InvoicePayload>) =>
    api.put(`/invoices/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/invoices/${id}`).then((r) => r.data),
  send: (id: number) => api.post(`/invoices/${id}/send`).then((r) => r.data),
  markAsPaid: (id: number) => api.patch(`/invoices/${id}/paid`).then((r) => r.data),
  cancel: (id: number) => api.patch(`/invoices/${id}/cancel`).then((r) => r.data),
  bulkGenerate: (data: any) => api.post('/invoices/bulk-generate', data).then((r) => r.data),
  getByCustomer: (customerId: number) =>
    api.get(`/invoices/customer/${customerId}`).then((r) => r.data),
  getByPlan: (planId: number) => api.get(`/invoices/plan/${planId}`).then((r) => r.data),
  getStats: () => api.get('/invoices/stats').then((r) => r.data),
}

// ── Payments ────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: () => api.get('/payments').then((r) => r.data),
  get: (id: number) => api.get(`/payments/${id}`).then((r) => r.data),
  create: (data: Partial<PaymentPayload>) =>
    api.post('/payments', data).then((r) => r.data),
  update: (id: number, data: Partial<PaymentPayload>) =>
    api.put(`/payments/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/payments/${id}`).then((r) => r.data),
  markAsCompleted: (id: number) =>
    api.patch(`/payments/${id}/complete`).then((r) => r.data),
  markAsFailed: (id: number) => api.patch(`/payments/${id}/failed`).then((r) => r.data),
  markAsReversed: (id: number) =>
    api.patch(`/payments/${id}/reversed`).then((r) => r.data),
  reconcileMpesa: (data: any) =>
    api.post('/payments/reconcile-mpesa', data).then((r) => r.data),
  getByInvoice: (invoiceId: number) =>
    api.get(`/payments/invoice/${invoiceId}`).then((r) => r.data),
  getByCustomer: (customerId: number) =>
    api.get(`/payments/customer/${customerId}`).then((r) => r.data),
  getStats: () => api.get('/payments/stats').then((r) => r.data),
}

// ── M-Pesa ──────────────────────────────────────────────────────────────────
export const mpesaApi = {
  getStatus: () => api.get('/mpesa/status').then((r) => r.data),
  sendSTKPush: (phone: string, amount: number, accountReference: string, description: string) =>
    api.post('/mpesa/stk-push', { phone, amount, accountReference, description }).then((r) => r.data),
  validateCallback: (data: any) =>
    api.post('/mpesa/callback', data).then((r) => r.data),
  getTransactions: (params: any) =>
    api.get('/mpesa/transactions', { params }).then((r) => r.data),
  getBalance: () => api.get('/mpesa/balance').then((r) => r.data),
  reconcile: (data: any) => api.post('/mpesa/reconcile', data).then((r) => r.data),
}

// ── Vouchers ────────────────────────────────────────────────────────────────
export const vouchersApi = {
  list: () => api.get('/vouchers').then((r) => r.data),
  get: (id: number) => api.get(`/vouchers/${id}`).then((r) => r.data),
  create: (data: Partial<VoucherPayload>) =>
    api.post('/vouchers', data).then((r) => r.data),
  update: (id: number, data: Partial<VoucherPayload>) =>
    api.put(`/vouchers/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/vouchers/${id}`).then((r) => r.data),
  bulkGenerate: (data: { count: number; planId: number; prefix?: string; length?: number }) =>
    api.post('/vouchers/bulk-generate', data).then((r) => r.data),
  redeem: (code: string, customerId: number) =>
    api.post('/vouchers/redeem', { code, customerId }).then((r) => r.data),
  validate: (code: string) => api.get(`/vouchers/validate/${code}`).then((r) => r.data),
  getByPlan: (planId: number) => api.get(`/vouchers/plan/${planId}`).then((r) => r.data),
  getByCustomer: (customerId: number) =>
    api.get(`/vouchers/customer/${customerId}`).then((r) => r.data),
  getStats: () => api.get('/vouchers/stats').then((r) => r.data),
}

// ── Monitoring ─────────────────────────────────────────────────────────────
export const monitoringApi = {
  list: () => api.get('/monitoring').then((r) => r.data),
  get: (id: number) => api.get(`/monitoring/${id}`).then((r) => r.data),
  create: (data: Partial<MonitoringPayload>) =>
    api.post('/monitoring', data).then((r) => r.data),
  remove: (id: number) => api.delete(`/monitoring/${id}`).then((r) => r.data),
  bulk: (data: any[]) => api.post('/monitoring/bulk', data).then((r) => r.data),
  getByDevice: (deviceId: number) =>
    api.get(`/monitoring/device/${deviceId}`).then((r) => r.data),
  getByRadiusUser: (radiusUserId: number) =>
    api.get(`/monitoring/radius-user/${radiusUserId}`).then((r) => r.data),
  getMetrics: (deviceId: number, metric: string, range: string) =>
    api.get(`/monitoring/${deviceId}/metrics/${metric}?range=${range}`).then((r) => r.data),
  cleanup: (days: number) => api.delete(`/monitoring/cleanup/${days}`).then((r) => r.data),
  getStats: () => api.get('/monitoring/stats').then((r) => r.data),
}

// ── Audit Logs ─────────────────────────────────────────────────────────────
export const auditLogsApi = {
  list: () => api.get('/audit-logs').then((r) => r.data),
  get: (id: number) => api.get(`/audit-logs/${id}`).then((r) => r.data),
  create: (data: Partial<AuditLogPayload>) =>
    api.post('/audit-logs', data).then((r) => r.data),
  logAction: (action: string, module: string, details: any, companyId?: number) =>
    api.post('/audit-logs/log', { action, module, details, companyId }).then((r) => r.data),
  filter: (params: any) => api.get('/audit-logs/filter', { params }).then((r) => r.data),
  cleanup: (days: number) => api.delete(`/audit-logs/cleanup/${days}`).then((r) => r.data),
  getStats: () => api.get('/audit-logs/stats').then((r) => r.data),
}

// ── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  get: (id: number) => api.get(`/notifications/${id}`).then((r) => r.data),
  create: (data: Partial<NotificationPayload>) =>
    api.post('/notifications', data).then((r) => r.data),
  update: (id: number, data: Partial<NotificationPayload>) =>
    api.put(`/notifications/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/notifications/${id}`).then((r) => r.data),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => api.patch('/notifications/mark-all-read').then((r) => r.data),
  sendEmail: (data: any) => api.post('/notifications/send-email', data).then((r) => r.data),
  sendSms: (data: any) => api.post('/notifications/send-sms', data).then((r) => r.data),
  filter: (params: any) => api.get('/notifications/filter', { params }).then((r) => r.data),
  getStats: () => api.get('/notifications/stats').then((r) => r.data),
}

// ── Settings ────────────────────────────────────────────────────────────────
export const settingsApi = {
  list: () => api.get('/settings').then((r) => r.data),
  get: (id: number) => api.get(`/settings/${id}`).then((r) => r.data),
  getByKey: (key: string) => api.get(`/settings/key/${key}`).then((r) => r.data),
  getValue: (key: string) => api.get(`/settings/value/${key}`).then((r) => r.data),
  create: (data: Partial<SettingPayload>) =>
    api.post('/settings', data).then((r) => r.data),
  update: (id: number, data: Partial<SettingPayload>) =>
    api.put(`/settings/${id}`, data).then((r) => r.data),
  updateByKey: (key: string, value: any) =>
    api.put(`/settings/key/${key}`, { value }).then((r) => r.data),
  remove: (id: number) => api.delete(`/settings/${id}`).then((r) => r.data),
  getAllValues: () => api.get('/settings/values').then((r) => r.data),
  getSystemSettings: () => api.get('/settings/system').then((r) => r.data),
}

// ── License Keys ────────────────────────────────────────────────────────────
export const licenseKeysApi = {
  list: () => api.get('/license-keys').then((r) => r.data),
  get: (id: number) => api.get(`/license-keys/${id}`).then((r) => r.data),
  create: (data: Partial<LicenseKeyPayload>) =>
    api.post('/license-keys', data).then((r) => r.data),
  update: (id: number, data: Partial<LicenseKeyPayload>) =>
    api.put(`/license-keys/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/license-keys/${id}`).then((r) => r.data),
  validate: (key: string) => api.get(`/license-keys/validate/${key}`).then((r) => r.data),
  canActivateDevice: (key: string) =>
    api.get(`/license-keys/${key}/can-activate-device`).then((r) => r.data),
  canAddCustomer: (key: string) =>
    api.get(`/license-keys/${key}/can-add-customer`).then((r) => r.data),
  activate: (key: string, companyId: number) =>
    api.post(`/license-keys/${key}/activate`, { companyId }).then((r) => r.data),
  deactivate: (key: string) => api.patch(`/license-keys/${key}/deactivate`).then((r) => r.data),
  generateKey: (data: any) => api.post('/license-keys/generate', data).then((r) => r.data),
  getByCompany: (companyId: number) =>
    api.get(`/license-keys/company/${companyId}`).then((r) => r.data),
  getStats: () => api.get('/license-keys/stats').then((r) => r.data),
}

// ── Sessions ────────────────────────────────────────────────────────────────
export const sessionsApi = {
  list: () => api.get('/sessions').then((r) => r.data),
  get: (id: number) => api.get(`/sessions/${id}`).then((r) => r.data),
  create: (data: Partial<SessionPayload>) =>
    api.post('/sessions', data).then((r) => r.data),
  update: (id: number, data: Partial<SessionPayload>) =>
    api.put(`/sessions/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/sessions/${id}`).then((r) => r.data),
  getActive: () => api.get('/sessions/active').then((r) => r.data),
  getByRadiusUser: (radiusUserId: number) =>
    api.get(`/sessions/radius-user/${radiusUserId}`).then((r) => r.data),
  terminate: (id: number) => api.patch(`/sessions/${id}/terminate`).then((r) => r.data),
  cleanup: (days: number) => api.delete(`/sessions/cleanup/${days}`).then((r) => r.data),
  getStats: () => api.get('/sessions/stats').then((r) => r.data),
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'admin' | 'support' | 'accountant' | 'superadmin'
  companyId: number
}

export interface CompanyPayload {
  name: string
  email: string
  phone: string
  address: string
  licenseType: 'trial' | 'monthly' | 'annual' | 'lifetime'
}

export interface User {
  id: number
  uuid: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  company?: Company
}

export interface Company {
  id: number
  uuid: string
  name: string
  email: string
  phone?: string
  address?: string
  domain?: string
  licenseType: string
  licenseKey: string
  licenseExpiresAt?: string
  maxDevices: number
  maxCustomers: number
  isActive: boolean
  createdAt: string
  users?: User[]
}

export interface CustomerPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  companyId: number
  planId?: number
  isActive?: boolean
}

export interface Customer {
  id: number
  uuid: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  isActive: boolean
  createdAt: string
  companyId: number
  company?: Company
  planId?: number
  plan?: Plan
}

export interface PlanPayload {
  name: string
  description?: string
  price: number
  durationDays: number
  bandwidthUp: number
  bandwidthDown: number
  isActive?: boolean
  orderIndex?: number
  companyId: number
}

export interface Plan {
  id: number
  uuid: string
  name: string
  description?: string
  price: number
  durationDays: number
  bandwidthUp: number
  bandwidthDown: number
  isActive: boolean
  orderIndex: number
  createdAt: string
  companyId: number
  company?: Company
  radiusUsers?: RadiusUser[]
  vouchers?: Voucher[]
}

export interface DevicePayload {
  name: string
  ipAddress: string
  type?: string
  model?: string
  location?: string
  companyId: number
  isActive?: boolean
}

export interface Device {
  id: number
  uuid: string
  name: string
  ipAddress: string
  type?: string
  model?: string
  location?: string
  isActive: boolean
  createdAt: string
  companyId: number
  company?: Company
}

export interface RadiusUserPayload {
  username: string
  password?: string
  customerId: number
  planId: number
  deviceId?: number
  macAddress?: string
  ipAddress?: string
  isActive?: boolean
  isLocked?: boolean
  maxSessions?: number
}

export interface RadiusUser {
  id: number
  uuid: string
  username: string
  customerId: number
  planId: number
  deviceId?: number
  macAddress?: string
  ipAddress?: string
  isActive: boolean
  isLocked: boolean
  maxSessions: number
  createdAt: string
  customer?: Customer
  plan?: Plan
  device?: Device
}

export interface InvoicePayload {
  customerId: number
  planId?: number
  amount: number
  description?: string
  dueDate?: string
  status?: 'pending' | 'sent' | 'paid' | 'cancelled' | 'overdue'
}

export interface Invoice {
  id: number
  uuid: string
  customerId: number
  planId?: number
  amount: number
  description?: string
  dueDate?: string
  status: string
  createdAt: string
  customer?: Customer
  plan?: Plan
}

export interface PaymentPayload {
  customerId: number
  invoiceId?: number
  amount: number
  method: string
  transactionId?: string
  mpesaReceipt?: string
  status?: 'pending' | 'completed' | 'failed' | 'reversed'
}

export interface Payment {
  id: number
  uuid: string
  customerId: number
  invoiceId?: number
  amount: number
  method: string
  transactionId?: string
  mpesaReceipt?: string
  status: string
  createdAt: string
  customer?: Customer
  invoice?: Invoice
}

export interface VoucherPayload {
  code: string
  planId: number
  amount?: number
  durationDays?: number
  isRedeemed?: boolean
  redeemedAt?: string
  redeemedBy?: number
  expiryDate?: string
}

export interface Voucher {
  id: number
  uuid: string
  code: string
  planId: number
  amount?: number
  durationDays?: number
  isRedeemed: boolean
  redeemedAt?: string
  redeemedBy?: number
  expiryDate?: string
  createdAt: string
  plan?: Plan
  redeemedByCustomer?: Customer
}

export interface MonitoringPayload {
  deviceId?: number
  radiusUserId?: number
  cpu?: number
  memory?: number
  speedUp?: number
  speedDown?: number
  latency?: number
  bandwidthUp?: number
  bandwidthDown?: number
  uptime?: number
  deviceStatus?: string
  timestamp?: string
}

export interface Monitoring {
  id: number
  uuid: string
  deviceId?: number
  radiusUserId?: number
  cpu: number
  memory: number
  speedUp: number
  speedDown: number
  latency: number
  bandwidthUp: number
  bandwidthDown: number
  uptime: number
  deviceStatus: string
  timestamp: string
  device?: Device
  radiusUser?: RadiusUser
}

export interface AuditLogPayload {
  action: string
  module: string
  details: any
  companyId?: number
  userId?: number
  ipAddress?: string
}

export interface AuditLog {
  id: number
  uuid: string
  action: string
  module: string
  details: any
  companyId?: number
  userId?: number
  ipAddress?: string
  createdAt: string
}

export interface NotificationPayload {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  channel: 'in_app' | 'email' | 'sms'
  recipientId?: number
  recipientEmail?: string
  recipientPhone?: string
  isRead?: boolean
}

export interface Notification {
  id: number
  uuid: string
  title: string
  message: string
  type: string
  channel: string
  recipientId?: number
  recipientEmail?: string
  recipientPhone?: string
  isRead: boolean
  createdAt: string
}

export interface SettingPayload {
  key: string
  value: any
  description?: string
  group?: string
}

export interface Setting {
  id: number
  uuid: string
  key: string
  value: any
  description?: string
  group?: string
  createdAt: string
}

export interface LicenseKeyPayload {
  key: string
  licenseType: 'trial' | 'monthly' | 'annual' | 'lifetime'
  maxDevices: number
  maxCustomers: number
  companyId?: number
  expiryDate?: string
  isActive?: boolean
  description?: string
}

export interface LicenseKey {
  id: number
  uuid: string
  key: string
  licenseType: string
  maxDevices: number
  maxCustomers: number
  companyId?: number
  expiryDate?: string
  isActive: boolean
  description?: string
  createdAt: string
  company?: Company
}

export interface SessionPayload {
  radiusUserId: number
  ipAddress: string
  macAddress?: string
  startedAt?: string
  endedAt?: string
  duration?: number
  bytesUp?: number
  bytesDown?: number
  isActive?: boolean
}

export interface Session {
  id: number
  uuid: string
  radiusUserId: number
  ipAddress: string
  macAddress?: string
  startedAt: string
  endedAt?: string
  duration: number
  bytesUp: number
  bytesDown: number
  isActive: boolean
  radiusUser?: RadiusUser
}
