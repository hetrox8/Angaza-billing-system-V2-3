import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
