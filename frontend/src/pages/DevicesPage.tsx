import { useState, useEffect } from 'react'
import { devicesApi, Device, DevicePayload, Company } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col, Select, Tooltip } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const EMPTY_FORM: Partial<DevicePayload> = {
  name: '', ipAddress: '', type: '', model: '', location: '', isActive: true,
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Device | null>(null)
  const [form] = Form.useForm<DevicePayload>()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string }>>({})

  const load = () => {
    setLoading(true)
    devicesApi.list()
      .then(setDevices)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadCompanies = () => {
    import('../services/api').then(({ companiesApi }) => {
      companiesApi.list().then(setCompanies).catch(() => {})
    })
  }

  useEffect(() => {
    load()
    loadCompanies()
  }, [])

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setShowModal(true)
  }

  const openEdit = (d: Device) => {
    setEditTarget(d)
    form.setFieldsValue({
      name: d.name,
      ipAddress: d.ipAddress,
      type: d.type,
      model: d.model,
      location: d.location,
      companyId: d.companyId,
      isActive: d.isActive,
    })
    setShowModal(true)
  }

  const handleSave = async (values: DevicePayload) => {
    setFormSubmitting(true)
    try {
      if (editTarget) {
        await devicesApi.update(editTarget.id, values)
      } else {
        await devicesApi.create(values)
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await devicesApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const handleTestConnection = async (id: number) => {
    setTestingId(id)
    try {
      await devicesApi.testConnection(id)
      setTestResults((prev) => ({ ...prev, [id]: { success: true, message: 'Connection successful' } }))
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, message: err?.message || 'Connection failed' } }))
    } finally {
      setTestingId(null)
    }
  }

  const handleProvision = async (id: number) => {
    try {
      await devicesApi.provision(id, {})
      setError('Provisioning started successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Provisioning failed')
    }
  }

  const handleGenerateScript = async (id: number) => {
    try {
      const { data } = await devicesApi.generateScript(id)
      // In a real app, you might download or display the script
      setError(`Script generated: ${data.length} bytes`)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Script generation failed')
    }
  }

  const columns = [
    {
      title: 'Device Name',
      key: 'name',
      render: (d: Device) => (
        <Flex align="center" gap="small">
          <Tag color={d.isActive ? 'green' : 'red'}> {d.isActive ? '●' : '○'}</Tag>
          <Text strong>{d.name}</Text>
        </Flex>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type || 'Unknown'}</Tag>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Company',
      key: 'company',
      render: (d: Device) => (
        <Tag color="geekblue">{d.company?.name || `ID: ${d.companyId}`}</Tag>
      ),
    },
    {
      title: 'Connection',
      key: 'connection',
      render: (d: Device) => (
        <Flex gap="small">
          <Tooltip title={testResults[d.id]?.message || 'Test connection'}> 
            <Button
              size="small"
              loading={testingId === d.id}
              onClick={() => handleTestConnection(d.id)}
            >
              Test
            </Button>
          </Tooltip>
          {testResults[d.id] && (
            <Tag color={testResults[d.id].success ? 'green' : 'red'}> 
              {testResults[d.id].success ? '✓' : '✗'}
            </Tag>
          )}
        </Flex>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (d: Device) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(d)}>Edit</Button>
          <Button type="link" size="small" onClick={() => handleProvision(d.id)}>Provision</Button>
          <Button type="link" size="small" onClick={() => handleGenerateScript(d.id)}>Script</Button>
          {deleteId === d.id ? (
            <>
              <Button type="link" size="small" danger onClick={() => handleDelete(d.id)}> 
                Confirm
              </Button>
              <Button type="text" size="small" onClick={() => setDeleteId(null)}> 
                Cancel
              </Button>
            </>
          ) : (
            <Button type="link" size="small" danger onClick={() => setDeleteId(d.id)}> Delete </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Devices</Title>
          <Paragraph className="m-0">Manage network devices (MikroTik, Ubiquiti, etc.)</Paragraph>
        </Flex>
        <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
          + Add Device
        </Button>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Card className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8"> 
            <Spin size="large" />
            <Text type="secondary">Loading devices...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={devices}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} devices`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit ${editTarget.name}` : 'New Device'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={600}
        className="top-8"
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Device Name" name="name" rules={[{ required: true, message: 'Please enter device name' }]}>
                <Input placeholder="MikroTik Router" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="IP Address" name="ipAddress" rules={[{ required: true, message: 'Please enter IP address' }]}>
                <Input placeholder="192.168.1.1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Type" name="type">
                <Input placeholder="MikroTik Hotspot" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Model" name="model">
                <Input placeholder="RB951Ui-2HnD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Location" name="location">
                <Input placeholder="Main Office, 3rd Floor" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Company" name="companyId" rules={[{ required: true, message: 'Please select company' }]}>
                <Select placeholder="Select company" allowClear>
                  {companies.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Active" name="isActive" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
