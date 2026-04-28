import { useState, useEffect } from 'react'
import { sessionsApi, Session, RadiusUser } from '../services/api'
import { Table, Button, Alert, Spin, Flex, Tag, Typography, Card, Space } from 'antd'

const { Title, Text } = Typography

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [radiusUsers, setRadiusUsers] = useState<RadiusUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    sessionsApi.list()
      .then(setSessions)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadRadiusUsers = () => {
    import('../services/api').then(({ radiusUsersApi }) => {
      radiusUsersApi.list().then(setRadiusUsers).catch(() => {})
    })
  }

  useEffect(() => {
    load()
    loadRadiusUsers()
  }, [])

  const handleTerminate = async (id: number) => {
    try {
      await sessionsApi.terminate(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Terminate failed')
    }
  }

  const handleCleanup = async () => {
    try {
      await sessionsApi.cleanup(30)
      load()
      setError('Old sessions cleaned up successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cleanup failed')
    }
  }

  const columns = [
    {
      title: 'Radius User',
      key: 'radiusUser',
      render: (s: Session) => (
        s.radiusUser ? <Tag color="blue">{s.radiusUser.username}</Tag> : <Text type="secondary">N/A</Text>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'MAC Address',
      dataIndex: 'macAddress',
      key: 'macAddress',
    },
    {
      title: 'Status',
      key: 'status',
      render: (s: Session) => (
        <Tag color={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Ended'}</Tag>
      ),
    },
    {
      title: 'Started',
      key: 'startedAt',
      render: (s: Session) => new Date(s.startedAt).toLocaleString(),
    },
    {
      title: 'Ended',
      dataIndex: 'endedAt',
      key: 'endedAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : 'Active',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (d: number) => d ? `${Math.floor(d / 60)}m ${d % 60}s` : '0s',
    },
    {
      title: 'Data',
      key: 'data',
      render: (s: Session) => (
        <Flex vertical>
          <Text className="text-xs">↑ {s.bytesUp ? (s.bytesUp / 1024 / 1024).toFixed(2) : 0} MB</Text>
          <Text className="text-xs">↓ {s.bytesDown ? (s.bytesDown / 1024 / 1024).toFixed(2) : 0} MB</Text>
        </Flex>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (s: Session) => (
        s.isActive && (
          <Button type="link" size="small" danger onClick={() => handleTerminate(s.id)}>
            Terminate
          </Button>
        )
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Sessions</Title>
          <Text type="secondary">View and manage active user sessions</Text>
        </Flex>
        <Button type="primary" onClick={handleCleanup} className="bg-primary hover:bg-primary/90">
          Cleanup Old Sessions
        </Button>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Card title="Active Sessions" className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading sessions...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={sessions}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} sessions`,
            }}
          />
        )}
      </Card>
    </div>
  )
}
