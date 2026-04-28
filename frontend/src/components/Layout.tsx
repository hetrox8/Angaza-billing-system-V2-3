import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Layout as AntLayout, Menu, Button, Avatar, Flex, Typography } from 'antd'

const { Sider, Content } = AntLayout
const { Text } = Typography

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⬡', key: 'dashboard' },
  { to: '/companies', label: 'Companies', icon: '⬢', key: 'companies' },
  { to: '/customers', label: 'Customers', icon: '👥', key: 'customers' },
  { to: '/plans', label: 'Plans', icon: '📋', key: 'plans' },
  { to: '/devices', label: 'Devices', icon: '🖥️', key: 'devices' },
  { to: '/radius-users', label: 'Radius Users', icon: '🔑', key: 'radius-users' },
  { to: '/invoices', label: 'Invoices', icon: '💰', key: 'invoices' },
  { to: '/payments', label: 'Payments', icon: '💳', key: 'payments' },
  { to: '/vouchers', label: 'Vouchers', icon: '🎫', key: 'vouchers' },
  { to: '/monitoring', label: 'Monitoring', icon: '📊', key: 'monitoring' },
  { to: '/audit-logs', label: 'Audit Logs', icon: '📜', key: 'audit-logs' },
  { to: '/notifications', label: 'Notifications', icon: '🔔', key: 'notifications' },
  { to: '/settings', label: 'Settings', icon: '⚙️', key: 'settings' },
  { to: '/license-keys', label: 'License Keys', icon: '🔐', key: 'license-keys' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AntLayout className="min-h-screen">
      <Sider
        className="shadow-md"
        width={256}
        breakpoint="lg"
        collapsedWidth={80}
      >
        <Flex vertical align="center" gap="small" className="p-4">
          <Avatar size={40} className="bg-primary text-white">
            A
          </Avatar>
          <span className="text-white text-xl font-bold">Angaza</span>
        </Flex>
        
        <Menu
          mode="inline"
          className="flex-1 mt-4"
          items={NAV.map((item) => ({
            key: item.key,
            icon: <span>{item.icon}</span>,
            label: <NavLink to={item.to}>{item.label}</NavLink>,
          }))}
        />
        
        <Flex vertical align="center" gap="small" className="p-4 border-t border-gray-700">
          <Flex align="center" gap="small">
            <Avatar size={32} className="bg-primary text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Flex vertical>
              <Text className="text-white text-sm">{user?.firstName} {user?.lastName}</Text>
              <Text type="secondary" className="text-xs">{user?.role}</Text>
            </Flex>
          </Flex>
          <Button type="text" danger icon={<span>⏻</span>} onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </Flex>
      </Sider>
      
      <AntLayout>
        <Content className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
