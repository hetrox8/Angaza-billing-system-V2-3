import { useState, useEffect } from 'react'
import { paymentsApi, Payment, Customer, Invoice } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col, DatePicker } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const statusColors = { completed: 'green', pending: 'blue', failed: 'red', reversed: 'orange' }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form] = Form.useForm()
  const [formSubmitting, setFormSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    paymentsApi.list()
      .then(setPayments)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadDependencies = () => {
    Promise.all([
      import('../services/api').then(({ customersApi }) => customersApi.list()),
      import('../services/api').then(({ invoicesApi }) => invoicesApi.list()),
    ]).then(([customersData, invoicesData]) => {
      setCustomers(customersData)
      setInvoices(invoicesData)
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    loadDependencies()
  }, [])

  const columns = [
    {
      title: 'Payment #',
      key: 'paymentNumber',
      render: (p: Payment) => <Text code>{p.uuid.substring(0, 8)}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (p: Payment) => (
        p.customer ? <Tag color="blue">{p.customer.firstName} {p.customer.lastName}</Tag> : <Text type="secondary">ID: {p.customerId}</Text>
      ),
    },
    {
      title: 'Invoice',
      key: 'invoice',
      render: (p: Payment) => (
        p.invoice ? <Tag color="green">{p.invoice.uuid.substring(0, 8)}</Tag> : <Text type="secondary">None</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `KES ${amount.toLocaleString()}`,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Tag color="purple">{method}</Tag>,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
    },
    {
      title: 'MPesa Receipt',
      dataIndex: 'mpesaReceipt',
      key: 'mpesaReceipt',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={(statusColors as any)[status] || 'gray'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (p: Payment) => new Date(p.createdAt).toLocaleString(),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Payments</Title>
          <Paragraph className="m-0">View and manage all payments</Paragraph>
        </Flex>
        <Button type="primary" onClick={load} className="bg-primary hover:bg-primary/90">
          Refresh
        </Button>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Card className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading payments...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={payments}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} payments`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Payment Details"
        open={showModal}
        onOk={() => setShowModal(false)}
        onCancel={() => setShowModal(false)}
        width={700}
        className="top-8"
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Payment Information">
                <Text>Payment details will be displayed here</Text>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
