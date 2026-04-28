import { useState, useEffect } from 'react'
import { customersApi, Customer, CustomerPayload, Company } from '../services/api'
import { Table, Button, Modal, Form, Input, Select, Alert, Spin, Flex, Avatar, Tag, Typography, Space, Card, Row, Col, DatePicker } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Search } = Input

const EMPTY_FORM: Partial<CustomerPayload> = {
  firstName: '', lastName: '', email: '', phone: '', address: '', isActive: true,
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [form] = Form.useForm<CustomerPayload>()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [companyFilter, setCompanyFilter] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      customersApi.list(),
      customersApi.list().then(() => {}) // Already have customers
    ])
      .then(([customersData]) => {
        setCustomers(customersData)
      })
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

  useEffect(() => {
    if (searchQuery || companyFilter) {
      const timer = setTimeout(() => {
        setLoading(true)
        let promise: Promise<any>
        if (companyFilter) {
          promise = customersApi.getByCompany(companyFilter)
        } else if (searchQuery) {
          promise = customersApi.search(searchQuery)
        } else {
          promise = customersApi.list()
        }
        promise.then(setCustomers).catch((e) => setError(e?.message || 'Search failed')).finally(() => setLoading(false))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, companyFilter])

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setShowModal(true)
  }

  const openEdit = (c: Customer) => {
    setEditTarget(c)
    form.setFieldsValue({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      address: c.address,
      companyId: c.companyId,
      planId: c.planId,
      isActive: c.isActive,
    })
    setShowModal(true)
  }

  const handleSave = async (values: CustomerPayload) => {
    setFormSubmitting(true)
    try {
      if (editTarget) {
        await customersApi.update(editTarget.id, values)
      } else {
        await customersApi.create(values)
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
      await customersApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (c: Customer) => (
        <Flex align="center" gap="small">
          <Avatar size={40} className="bg-primary text-white">
            {c.firstName[0]}{c.lastName[0]}
          </Avatar>
          <Flex vertical>
            <Text strong>{c.firstName} {c.lastName}</Text>
            <Text type="secondary" className="text-xs">{c.email}</Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Company',
      key: 'company',
      render: (c: Customer) => (
        <Tag color="blue">{c.company?.name || `ID: ${c.companyId}`}</Tag>
      ),
    },
    {
      title: 'Plan',
      key: 'plan',
      render: (c: Customer) => (
        c.plan ? <Tag color="green">{c.plan.name}</Tag> : <Text type="secondary">None</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (c: Customer) => (
        <Tag color={c.isActive ? 'green' : 'red'}>
          {c.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      key: 'createdAt',
      render: (c: Customer) => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (c: Customer) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(c)}>Edit</Button>
          {deleteId === c.id ? (
            <>
              <Button type="link" size="small" danger onClick={() => handleDelete(c.id)}>
                Confirm
              </Button>
              <Button type="text" size="small" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="link" size="small" danger onClick={() => setDeleteId(c.id)}>
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
          <Title level={2} className="m-0"> Customers</Title>
          <Paragraph className="m-0"> Manage customer accounts and their subscriptions</Paragraph>
        </Flex>
        <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
          + Add Customer
        </Button>
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

      <Card className="shadow-sm mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Filter by company"
              value={companyFilter}
              onChange={setCompanyFilter}
              allowClear
              style={{ width: 200 }}
            >
              {companies.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading customers...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Showing ${range[0]} to ${range[1]} of ${total} customers`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit ${editTarget.firstName} ${editTarget.lastName}` : 'New Customer'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={600}
        className="top-8"
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="john@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+254 700 000000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Mombasa, Kenya" rows={2} />
          </Form.Item>

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
              <Form.Item label="Plan" name="planId">
                <Select placeholder="Select plan" allowClear disabled>
                  <Option value={null}>Select plan</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Select placeholder="Select status">
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
