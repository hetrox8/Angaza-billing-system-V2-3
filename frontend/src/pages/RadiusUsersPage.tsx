import { useState, useEffect } from 'react'
import { radiusUsersApi, RadiusUser, RadiusUserPayload, Customer, Plan, Device } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col, Select, Tooltip } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Search } = Input

const EMPTY_FORM: Partial<RadiusUserPayload> = {
  username: '', password: '', customerId: 0, planId: 0, isActive: true, isLocked: false, maxSessions: 1,
}

export default function RadiusUsersPage() {
  const [radiusUsers, setRadiusUsers] = useState<RadiusUser[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<RadiusUser | null>(null)
  const [form] = Form.useForm<RadiusUserPayload>()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkCount, setBulkCount] = useState(1)

  const load = () => {
    setLoading(true)
    radiusUsersApi.list()
      .then(setRadiusUsers)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadDependencies = () => {
    Promise.all([
      import('../services/api').then(({ customersApi }) => customersApi.list()),
      import('../services/api').then(({ plansApi }) => plansApi.list()),
      import('../services/api').then(({ devicesApi }) => devicesApi.list()),
    ]).then(([customersData, plansData, devicesData]) => {
      setCustomers(customersData)
      setPlans(plansData)
      setDevices(devicesData)
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    loadDependencies()
  }, [])

  const openCreate = () => {
    setEditTarget(null)
    setBulkMode(false)
    form.resetFields()
    setShowModal(true)
  }

  const openBulkCreate = () => {
    setBulkMode(true)
    form.resetFields()
    setShowModal(true)
  }

  const openEdit = (ru: RadiusUser) => {
    setEditTarget(ru)
    setBulkMode(false)
    form.setFieldsValue({
      username: ru.username,
      customerId: ru.customerId,
      planId: ru.planId,
      deviceId: ru.deviceId,
      macAddress: ru.macAddress,
      ipAddress: ru.ipAddress,
      isActive: ru.isActive,
      isLocked: ru.isLocked,
      maxSessions: ru.maxSessions,
    })
    setShowModal(true)
  }

  const handleSave = async (values: any) => {
    if (bulkMode) {
      const count = values.count || bulkCount
      try {
        setFormSubmitting(true)
        const users: Partial<RadiusUserPayload>[] = []
        for (let i = 0; i < count; i++) {
          users.push({
            username: `user${Date.now() + i}`,
            password: Math.random().toString(36).substring(2, 10),
            customerId: values.customerId as number,
            planId: values.planId as number,
          })
        }
        await radiusUsersApi.bulkCreate(users)
        setShowModal(false)
        load()
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Bulk create failed')
      } finally {
        setFormSubmitting(false)
      }
      return
    }

    setFormSubmitting(true)
    try {
      const payload = values as RadiusUserPayload
      if (editTarget) {
        await radiusUsersApi.update(editTarget.id, payload)
      } else {
        await radiusUsersApi.create(payload)
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
      await radiusUsersApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const handleLock = async (id: number) => {
    try {
      await radiusUsersApi.lock(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lock failed')
    }
  }

  const handleUnlock = async (id: number) => {
    try {
      await radiusUsersApi.unlock(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unlock failed')
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await radiusUsersApi.activate(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Activation failed')
    }
  }

  const handleDeactivate = async (id: number) => {
    try {
      await radiusUsersApi.deactivate(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Deactivation failed')
    }
  }

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: RadiusUser) => (
        <Flex align="center" gap="small">
          <Tag color={record.isLocked ? 'red' : record.isActive ? 'green' : 'gray'}> 
            {record.isLocked ? '🔒' : record.isActive ? '✓' : '○'}
          </Tag>
          <Text code>{username}</Text>
        </Flex>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (ru: RadiusUser) => (
        <Tag color="blue">{ru.customer?.firstName} {ru.customer?.lastName}</Tag>
      ),
    },
    {
      title: 'Plan',
      key: 'plan',
      render: (ru: RadiusUser) => (
        <Tag color="green">{ru.plan?.name || `ID: ${ru.planId}`}</Tag>
      ),
    },
    {
      title: 'Device',
      key: 'device',
      render: (ru: RadiusUser) => (
        ru.device ? <Tag color="geekblue">{ru.device.name}</Tag> : <Text type="secondary">None</Text>
      ),
    },
    {
      title: 'MAC Address',
      dataIndex: 'macAddress',
      key: 'macAddress',
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Max Sessions',
      dataIndex: 'maxSessions',
      key: 'maxSessions',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (ru: RadiusUser) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(ru)}>Edit</Button>
          {ru.isActive ? (
            <Button type="link" size="small" onClick={() => handleDeactivate(ru.id)}>Deactivate</Button>
          ) : (
            <Button type="link" size="small" onClick={() => handleActivate(ru.id)}>Activate</Button>
          )}
          {ru.isLocked ? (
            <Button type="link" size="small" onClick={() => handleUnlock(ru.id)}>Unlock</Button>
          ) : (
            <Button type="link" size="small" onClick={() => handleLock(ru.id)}>Lock</Button>
          )}
          {deleteId === ru.id ? (
            <>
              <Button type="link" size="small" danger onClick={() => handleDelete(ru.id)}>Confirm</Button>
              <Button type="text" size="small" onClick={() => setDeleteId(null)}>Cancel</Button>
            </>
          ) : (
            <Button type="link" size="small" danger onClick={() => setDeleteId(ru.id)}>Delete</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Radius Users</Title>
          <Paragraph className="m-0">Manage RADIUS authentication credentials</Paragraph>
        </Flex>
        <Space>
          <Button onClick={openBulkCreate}>Bulk Create</Button>
          <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
            + Add Radius User
          </Button>
        </Space>
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

      <Card className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading radius users...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={radiusUsers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} radius users`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit ${editTarget.username}` : bulkMode ? 'Bulk Create Radius Users' : 'New Radius User'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={700}
        className="top-8"
      >
        {bulkMode ? (
          <Form form={form} onFinish={handleSave} layout="vertical">
            <Alert message="Bulk create will generate random usernames and passwords" type="info" className="mb-4" />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Count"
                  name="count"
                  rules={[{ required: true, message: 'Please enter count' }]}
                >
                  <InputNumber min={1} max={100} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Customer"
                  name="customerId"
                  rules={[{ required: true, message: 'Please select customer' }]}
                >
                  <Select placeholder="Select customer" allowClear>
                    {customers.map((c) => (
                      <Option key={c.id} value={c.id}>{c.firstName} {c.lastName}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Plan"
                  name="planId"
                  rules={[{ required: true, message: 'Please select plan' }]}
                >
                  <Select placeholder="Select plan" allowClear>
                    {plans.map((p) => (
                      <Option key={p.id} value={p.id}>{p.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Form form={form} onFinish={handleSave} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: 'Please enter username' }]}
                >
                  <Input placeholder="johndoe" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter password' }]}
                >
                  <Input.Password placeholder="••••••••" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Customer"
                  name="customerId"
                  rules={[{ required: true, message: 'Please select customer' }]}
                >
                  <Select placeholder="Select customer" allowClear>
                    {customers.map((c) => (
                      <Option key={c.id} value={c.id}>{c.firstName} {c.lastName}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Plan"
                  name="planId"
                  rules={[{ required: true, message: 'Please select plan' }]}
                >
                  <Select placeholder="Select plan" allowClear>
                    {plans.map((p) => (
                      <Option key={p.id} value={p.id}>{p.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Device" name="deviceId">
                  <Select placeholder="Select device" allowClear>
                    {devices.map((d) => (
                      <Option key={d.id} value={d.id}>{d.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="MAC Address" name="macAddress">
                  <Input placeholder="00:1A:2B:3C:4D:5E" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="IP Address" name="ipAddress">
                  <Input placeholder="192.168.1.100" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Max Sessions"
                  name="maxSessions"
                >
                  <InputNumber min={1} max={10} className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Active" name="isActive" valuePropName="checked">
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Locked" name="isLocked" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>
    </div>
  )
}
