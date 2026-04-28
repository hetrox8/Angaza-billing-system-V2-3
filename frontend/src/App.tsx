import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CompaniesPage from './pages/CompaniesPage'
import CustomersPage from './pages/CustomersPage'
import PlansPage from './pages/PlansPage'
import DevicesPage from './pages/DevicesPage'
import RadiusUsersPage from './pages/RadiusUsersPage'
import InvoicesPage from './pages/InvoicesPage'
import PaymentsPage from './pages/PaymentsPage'
import MpesaPage from './pages/MpesaPage'
import VouchersPage from './pages/VouchersPage'
import MonitoringPage from './pages/MonitoringPage'
import SessionsPage from './pages/SessionsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import LicenseKeysPage from './pages/LicenseKeysPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="animate spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto" />
        <p className="mt-4 text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        
        {/* Companies */}
        <Route path="companies" element={<CompaniesPage />} />
        
        {/* Customers */}
        <Route path="customers" element={<CustomersPage />} />
        
        {/* Plans */}
        <Route path="plans" element={<PlansPage />} />
        
        {/* Devices */}
        <Route path="devices" element={<DevicesPage />} />
        
        {/* Radius Users */}
        <Route path="radius-users" element={<RadiusUsersPage />} />
        
        {/* Billing */}
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="mpesa" element={<MpesaPage />} />
        
        {/* Vouchers */}
        <Route path="vouchers" element={<VouchersPage />} />
        
        {/* Monitoring */}
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        
        {/* System */}
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="license-keys" element={<LicenseKeysPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
