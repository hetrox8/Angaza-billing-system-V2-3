import { useState, useEffect } from 'react'
import { plansApi, Plan, PlanPayload, Company } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col, Select } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const EMPTY_FORM: Partial<PlanPayload> = {
  name: '', description: '', price: 0, durationDays: 30, bandwidthUp: 1024, bandwidthDown: 1024, isActive: true, orderIndex: 0,
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Plan | null>(null)
  const [form] = Form.useForm<PlanPayload>()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    plansApi.list()
      .then(setPlans)
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

  const openEdit = (p: Plan) => {
    setEditTarget(p)
    form.setFieldsValue({
      name: p.name,
      description: p.description,
      price: p.price,
      durationDays: p.durationDays,
      bandwidthUp: p.bandwidthUp,
      bandwidthDown: p.bandwidthDown,
      isActive: p.isActive,
      orderIndex: p.orderIndex,
      companyId: p.companyId,
    })
    setShowModal(true)
  }

  const handleSave = async (values: PlanPayload) => {
    setFormSubmitting(true)
    try {
      if (editTarget) {
        await plansApi.update(editTarget.id, values)
      } else {
        await plansApi.create(values)
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
      await plansApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await plansApi.activate(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Activation failed')
    }
  }

  const handleDeactivate = async (id: number) => {
    try {
      await plansApi.deactivate(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Deactivation failed')
    }
  }

  const handleReorder = async () => {
    const ids = plans.map(p => p.id)
    try {
      await plansApi.reorder(ids)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Reorder failed')
    }
  }

  const columns = [
    {
      title: 'Order',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 60,
    },
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Plan) => (
        <Flex align="center" gap="small">
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'A' : 'I'}
          </Tag>
          <Text strong>{name}</Text>
        </Flex>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `KES ${price.toLocaleString()}`,
    },
    {
      title: 'Duration',
      dataIndex: 'durationDays',
      key: 'durationDays',
      render: (days: number) => `${days} days`,
    },
    {
      title: 'Bandwidth',
      key: 'bandwidth',
      render: (p: Plan) => (
        <Flex vertical>
          <Text className="text-xs">↑ {p.bandwidthUp} Mbps</Text>
          <Text className="text-xs">↓ {p.bandwidthDown} Mbps</Text>
        </Flex>
      ),
    },
    {
      title: 'Company',
      key: 'company',
      render: (p: Plan) => (
        <Tag color="blue">{p.company?.name || `ID: ${p.companyId}`}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (p: Plan) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(p)}>Edit</Button>
          {p.isActive ? (
            <Button type="link" size="small" onClick={() => handleDeactivate(p.id)}>
              Deactivate
            </Button>
          ) : (
            <Button type="link" size="small" onClick={() => handleActivate(p.id)}>
              Activate
            </Button>
          )}
          {deleteId === p.id ? (
            <>
              <Button type="link" size="small" danger onClick={() => handleDelete(p.id)}>
                Confirm
              </Button>
              <Button type="text" size="small" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="link" size="small" danger onClick={() => setDeleteId(p.id)}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Plans</Title>
          <Paragraph className="m-0"> Manage subscription plans and packages</Paragraph>
        </Flex>
        <Space>
          <Button onClick={handleReorder}>Reorder</Button>
          <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
            + Add Plan
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
            <Text type="secondary">Loading plans...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={plans}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Showing ${range[0]} to ${range[1]} of ${total} plans`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit ${editTarget.name}` : 'New Plan'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={700}
        className="top-8"
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Plan Name"
                name="name"
                rules={[{ required: true, message: 'Please enter plan name' }]}
              >
                <Input placeholder="Premium Package" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea placeholder="High-speed internet with unlimited data" rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Price (KES)"
                name="price"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Duration (Days)"
                name="durationDays"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <InputNumber min={1} max={365} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Order Index"
                name="orderIndex"
                rules={[{ required: true, message: 'Please enter order index' }]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Bandwidth Up (Mbps)"
                name="bandwidthUp"
                rules={[{ required: true, message: 'Please enter upload bandwidth' }]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bandwidth Down (Mbps)"
                name="bandwidthDown"
                rules={[{ required: true, message: 'Please enter download bandwidth' }]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Company"
                name="companyId"
                rules={[{ required: true, message: 'Please select company' }]}
              >
                <Select placeholder="Select company" allowClear>
                  {companies.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
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
