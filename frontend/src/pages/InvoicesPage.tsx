import { useState, useEffect } from 'react'
import { invoicesApi, Invoice, Customer, Plan } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col, DatePicker } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Invoice | null>(null)
  const [form] = Form.useForm()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    invoicesApi.list()
      .then(setInvoices)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadDependencies = () => {
    Promise.all([
      import('../services/api').then(({ customersApi }) => customersApi.list()),
      import('../services/api').then(({ plansApi }) => plansApi.list()),
    ]).then(([customersData, plansData]) => {
      setCustomers(customersData)
      setPlans(plansData)
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    loadDependencies()
  }, [])

  useEffect(() => {
    if (statusFilter) {
      setLoading(true)
      invoicesApi.list().then((data) => {
        const filtered = data.filter((i: Invoice) => i.status === statusFilter)
        setInvoices(filtered)
      }).catch((e) => setError(e?.message || 'Filter failed')).finally(() => setLoading(false))
    } else {
      load()
    }
  }, [statusFilter])

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setShowModal(true)
  }

  const openEdit = (i: Invoice) => {
    setEditTarget(i)
    form.setFieldsValue({
      customerId: i.customerId,
      planId: i.planId,
      amount: i.amount,
      description: i.description,
      dueDate: i.dueDate ? new Date(i.dueDate) : null,
      status: i.status,
    })
    setShowModal(true)
  }

  const handleSave = async (values: any) => {
    setFormSubmitting(true)
    try {
      const payload = {
        ...values,
        customerId: values.customerId,
        planId: values.planId,
        amount: values.amount,
        description: values.description,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        status: values.status || 'pending',
      }
      if (editTarget) {
        await invoicesApi.update(editTarget.id, payload)
      } else {
        await invoicesApi.create(payload)
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
      await invoicesApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const handleMarkAsPaid = async (id: number) => {
    try {
      await invoicesApi.markAsPaid(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mark as paid failed')
    }
  }

  const handleSend = async (id: number) => {
    try {
      await invoicesApi.send(id)
      setError('Invoice sent successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Send failed')
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await invoicesApi.cancel(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cancel failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green'
      case 'pending': return 'blue'
      case 'sent': return 'geekblue'
      case 'cancelled': return 'red'
      case 'overdue': return 'orange'
      default: return 'gray'
    }
  }

  const columns = [
    {
      title: 'Invoice #',
      key: 'invoiceNumber',
      render: (i: Invoice) => <Text code>{i.uuid.substring(0, 8)}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (i: Invoice) => (
        i.customer ? <Tag color="blue">{i.customer.firstName} {i.customer.lastName}</Tag> : <Text type="secondary">ID: {i.customerId}</Text>
      ),
    },
    {
      title: 'Plan',
      key: 'plan',
      render: (i: Invoice) => (
        i.plan ? <Tag color="green">{i.plan.name}</Tag> : <Text type="secondary">None</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `KES ${amount.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (i: Invoice) => i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Created',
      key: 'createdAt',
      render: (i: Invoice) => new Date(i.createdAt).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (i: Invoice) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(i)}>Edit</Button>
          <Button type="link" size="small" onClick={() => handleSend(i.id)}>Send</Button>
          {i.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleMarkAsPaid(i.id)}>Mark Paid</Button>
          )}
          {i.status !== 'cancelled' && (
            <Button type="link" size="small" onClick={() => handleCancel(i.id)}>Cancel</Button>
          )}
          {deleteId === i.id ? (
            <>
              <Button type="link" size="small" danger onClick={() => handleDelete(i.id)}>Confirm</Button>
              <Button type="text" size="small" onClick={() => setDeleteId(null)}>Cancel</Button>
            </>
          ) : (
            <Button type="link" size="small" danger onClick={() => setDeleteId(i.id)}>Delete</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Invoices</Title>
          <Paragraph className="m-0">Manage customer invoices and billing</Paragraph>
        </Flex>
        <Space>
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 150 }}
          >
            <Option value="pending">Pending</Option>
            <Option value="sent">Sent</Option>
            <Option value="paid">Paid</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="overdue">Overdue</Option>
          </Select>
          <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
            + Add Invoice
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Card className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading invoices...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={invoices}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} invoices`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit Invoice #${editTarget.uuid.substring(0, 8)}` : 'New Invoice'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={700}
        className="top-8"
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Customer" name="customerId" rules={[{ required: true, message: 'Please select customer' }]}>
                <Select placeholder="Select customer" allowClear>
                  {customers.map((c) => (
                    <Option key={c.id} value={c.id}>{c.firstName} {c.lastName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Plan" name="planId">
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
              <Form.Item label="Amount (KES)" name="amount" rules={[{ required: true, message: 'Please enter amount' }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Due Date" name="dueDate">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea placeholder="Invoice description" rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Status" name="status">
                <Select placeholder="Select status">
                  <Option value="pending">Pending</Option>
                  <Option value="sent">Sent</Option>
                  <Option value="paid">Paid</Option>
                  <Option value="cancelled">Cancelled</Option>
                  <Option value="overdue">Overdue</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

