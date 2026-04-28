import { useState, useEffect } from 'react'
import { companiesApi, Company } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Card, Col, Row, Statistic, Table, Typography, Alert, Spin, Flex, Avatar, Tag, Button } from 'antd'

const { Title, Text, Paragraph } = Typography

interface Stat {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    companiesApi.list()
      .then(setCompanies)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const stats: Stat[] = [
    {
      label: 'Total Companies',
      value: loading ? '—' : companies.length,
      sub: 'registered ISPs',
      color: 'var(--accent)',
    },
    {
      label: 'Active Companies',
      value: loading ? '—' : companies.filter((c) => c.isActive).length,
      sub: 'currently active',
      color: 'var(--info)',
    },
    {
      label: 'Total Users',
      value: loading ? '—' : companies.reduce((acc, c) => acc + (c.users?.length ?? 0), 0),
      sub: 'across all companies',
      color: 'var(--warning)',
    },
    {
      label: 'Trial Companies',
      value: loading ? '—' : companies.filter((c) => c.licenseType === 'trial').length,
      sub: 'on trial license',
      color: 'var(--danger)',
    },
  ]

  const columns = [
    {
      title: 'Company',
      key: 'company',
      render: (c: Company) => (
        <Flex align="center" gap="small">
          <Avatar size={40} className="bg-primary text-white">
            {c.name[0].toUpperCase()}
          </Avatar>
          <Flex vertical>
            <Text strong>{c.name}</Text>
            <Text type="secondary" className="text-xs">{c.email}</Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'License',
      key: 'licenseType',
      render: (c: Company) => (
        <Tag color={c.licenseType === 'trial' ? 'red' : c.licenseType === 'monthly' ? 'blue' : c.licenseType === 'annual' ? 'green' : 'purple' }>
          {c.licenseType}
        </Tag>
      ),
    },
    {
      title: 'Users',
      key: 'users',
      render: (c: Company) => c.users?.length ?? 0,
    },
    {
      title: 'Status',
      key: 'status',
      render: (c: Company) => (
        <Tag color={c.isActive ? 'green' : 'red' }>
          {c.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      key: 'createdAt',
      render: (c: Company) => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (c: Company) => (
        <Button type="link" href={`/companies/${c.id}`}>View</Button>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Dashboard</Title>
          <Paragraph className="m-0">
            Good to see you, <strong>{user?.firstName}</strong>. Here's your system overview.
          </Paragraph>
        </Flex>
        <Tag color="green" icon={<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}>
          System Online
        </Tag>
      </Flex>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {/* Stats Grid */}
      <Row gutter={16} className="mb-6">
        {stats.map((s, i) => (
          <Col xs={24} sm={12} lg={6} key={s.label}>
            <Card
              className="h-full"
              styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' } }}
            >
              <Flex flex={1} vertical gap="small">
                <Text type="secondary">{s.label}</Text>
                <Title level={2} className="m-0">{s.value}</Title>
                <Text type="secondary" className="text-xs">{s.sub}</Text>
              </Flex>
              <div className="h-2 rounded-full bg-gradient-to-r from-primary to-blue-500 mt-4" />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Companies Table */}
      <Card title="Recent Companies">
        <Flex justify="space-between" align="center" className="mb-4">
          <Title level={4} className="m-0">Recent Companies</Title>
          <Button type="link" href="/companies">View all</Button>
        </Flex>

        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading companies…</Text>
          </Flex>
        ) : companies.length === 0 ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Text type="secondary">No companies registered yet.</Text>
            <Text type="secondary">
              Head to <Button type="link" href="/companies">Companies</Button> to add your first ISP.
            </Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={companies.slice(0, 8)}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>
    </div>
  )
}
