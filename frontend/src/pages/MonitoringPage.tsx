import { useState, useEffect } from 'react'
import { monitoringApi, Monitoring, Device, RadiusUser } from '../services/api'
import { Table, Button, Alert, Spin, Flex, Tag, Typography, Card, Row, Col, DatePicker, Select, Space } from 'antd'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

export default function MonitoringPage() {
  const [monitoringData, setMonitoringData] = useState<Monitoring[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [radiusUsers, setRadiusUsers] = useState<RadiusUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deviceFilter, setDeviceFilter] = useState<number | null>(null)
  const [radiusUserFilter, setRadiusUserFilter] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<any>(null)

  const load = () => {
    setLoading(true)
    monitoringApi.list()
      .then(setMonitoringData)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadDependencies = () => {
    Promise.all([
      import('../services/api').then(({ devicesApi }) => devicesApi.list()),
      import('../services/api').then(({ radiusUsersApi }) => radiusUsersApi.list()),
    ]).then(([devicesData, radiusUsersData]) => {
      setDevices(devicesData)
      setRadiusUsers(radiusUsersData)
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    loadDependencies()
  }, [])

  useEffect(() => {
    if (deviceFilter || radiusUserFilter || dateRange) {
      setLoading(true)
      let promise: Promise<any>
      if (deviceFilter) {
        promise = monitoringApi.getByDevice(deviceFilter)
      } else if (radiusUserFilter) {
        promise = monitoringApi.getByRadiusUser(radiusUserFilter)
      } else {
        promise = monitoringApi.list()
      }
      promise.then(setMonitoringData).catch((e) => setError(e?.message || 'Filter failed')).finally(() => setLoading(false))
    }
  }, [deviceFilter, radiusUserFilter, dateRange])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green'
      case 'offline': return 'red'
      case 'degraded': return 'orange'
      default: return 'gray'
    }
  }

  const columns = [
    {
      title: 'Device',
      key: 'device',
      render: (m: Monitoring) => (
        m.device ? <Tag color="blue">{m.device.name}</Tag> : <Text type="secondary">N/A</Text>
      ),
    },
    {
      title: 'Radius User',
      key: 'radiusUser',
      render: (m: Monitoring) => (
        m.radiusUser ? <Tag color="green">{m.radiusUser.username}</Tag> : <Text type="secondary">N/A</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'deviceStatus',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'CPU (%)',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu: number) => cpu ? <Tag color={cpu > 80 ? 'red' : cpu > 60 ? 'orange' : 'green'}>{cpu}%</Tag> : 'N/A',
    },
    {
      title: 'Memory (%)',
      dataIndex: 'memory',
      key: 'memory',
      render: (memory: number) => memory ? <Tag color={memory > 80 ? 'red' : memory > 60 ? 'orange' : 'green'}>{memory}%</Tag> : 'N/A',
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: number) => uptime ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` : 'N/A',
    },
    {
      title: 'Speed',
      key: 'speed',
      render: (m: Monitoring) => (
        <Flex vertical>
          <Text className="text-xs">↑ {m.speedUp || 0} Mbps</Text>
          <Text className="text-xs">↓ {m.speedDown || 0} Mbps</Text>
        </Flex>
      ),
    },
    {
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      render: (latency: number) => latency ? `${latency}ms` : 'N/A',
    },
    {
      title: 'Timestamp',
      key: 'timestamp',
      render: (m: Monitoring) => new Date(m.timestamp).toLocaleString(),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Monitoring</Title>
          <Text type="secondary">Real-time device and user monitoring</Text>
        </Flex>
        <Space>
          <Select
            placeholder="Filter by device"
            value={deviceFilter}
            onChange={setDeviceFilter}
            allowClear
            style={{ width: 200 }}
          >
            {devices.map((d) => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by radius user"
            value={radiusUserFilter}
            onChange={setRadiusUserFilter}
            allowClear
            style={{ width: 200 }}
          >
            {radiusUsers.map((ru) => (
              <Option key={ru.id} value={ru.id}>{ru.username}</Option>
            ))}
          </Select>
          <RangePicker showTime onChange={setDateRange} />
          <Button type="primary" onClick={load} className="bg-primary hover:bg-primary/90">
            Refresh
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Row gutter={16} className="mb-6">
        <Col span={24}>
          <Card title="Performance Metrics" className="shadow-sm">
            {monitoringData.length > 0 ? (
              <Space direction="vertical" size="large">
                <Flex vertical>
                  <Text strong>CPU Usage Statistics</Text>
                  <Text>Chart visualization would appear here (requires recharts library)</Text>
                </Flex>
                <Flex vertical>
                  <Text strong>Memory Usage Statistics</Text>
                  <Text>Chart visualization would appear here (requires recharts library)</Text>
                </Flex>
                <Flex vertical>
                  <Text strong>Bandwidth Usage</Text>
                  <Text>Chart visualization would appear here (requires recharts library)</Text>
                </Flex>
              </Space>
            ) : (
              <Flex vertical align="center" gap="small" className="py-8">
                <Text type="secondary">No monitoring data available</Text>
              </Flex>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Monitoring Data" className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading monitoring data...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={monitoringData}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} records`,
            }}
          />
        )}
      </Card>
    </div>
  )
}

// Note: For full chart functionality, install recharts:
// npm install recharts
// Then import from 'recharts' instead of 'antd'
