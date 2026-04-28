import { useState, useEffect } from 'react'
import { auditLogsApi, AuditLog } from '../services/api'
import { Table, Button, Alert, Spin, Flex, Tag, Typography, Card, Row, Col, Input, Select } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { Option } = Select

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [moduleFilter, setModuleFilter] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    auditLogsApi.list()
      .then(setLogs)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (searchQuery || actionFilter || moduleFilter) {
      const timer = setTimeout(() => {
        setLoading(true)
        auditLogsApi.filter({
          action: actionFilter,
          module: moduleFilter,
          search: searchQuery,
        }).then(setLogs).catch((e) => setError(e?.message || 'Filter failed')).finally(() => setLoading(false))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, actionFilter, moduleFilter])

  const handleCleanup = async () => {
    try {
      await auditLogsApi.cleanup(90)
      load()
      setError('Logs older than 90 days cleaned up successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cleanup failed')
    }
  }

  const getUniqueActions = () => {
    const actions = new Set(logs.map(l => l.action))
    return Array.from(actions).sort()
  }

  const getUniqueModules = () => {
    const modules = new Set(logs.map(l => l.module))
    return Array.from(modules).sort()
  }

  const columns = [
    {
      title: 'Timestamp',
      key: 'timestamp',
      render: (l: AuditLog) => new Date(l.createdAt).toLocaleString(),
      width: 180,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="blue">{action}</Tag>,
      width: 120,
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => <Tag color="green">{module}</Tag>,
      width: 150,
    },
    {
      title: 'Company',
      dataIndex: 'companyId',
      key: 'companyId',
      render: (id: number) => id ? <Tag color="geekblue">{id}</Tag> : <Text type="secondary">N/A</Text>,
      width: 100,
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (id: number) => id ? <Tag color="purple">{id}</Tag> : <Text type="secondary">N/A</Text>,
      width: 100,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150,
    },
    {
      title: 'Details',
      key: 'details',
      render: (l: AuditLog) => (
        <div className="max-w-xs truncate">
          {JSON.stringify(l.details || {}).substring(0, 100)}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Audit Logs</Title>
          <Paragraph className="m-0">Track all system actions and changes</Paragraph>
        </Flex>
        <Button type="primary" onClick={handleCleanup} className="bg-primary hover:bg-primary/90">
          Cleanup Old Logs
        </Button>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Card className="shadow-sm mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search in details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Filter by action"
              value={actionFilter}
              onChange={setActionFilter}
              allowClear
              style={{ width: 150 }}
            >
              {getUniqueActions().map((action) => (
                <Option key={action} value={action}>{action}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Filter by module"
              value={moduleFilter}
              onChange={setModuleFilter}
              allowClear
              style={{ width: 150 }}
            >
              {getUniqueModules().map((module) => (
                <Option key={module} value={module}>{module}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card title="Audit Logs" className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading audit logs...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} logs`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  )
}
