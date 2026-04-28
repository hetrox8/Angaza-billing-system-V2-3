import { useState, useEffect } from 'react'
import { vouchersApi, Voucher, Plan } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [form] = Form.useForm()
  const [bulkForm] = Form.useForm()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    vouchersApi.list()
      .then(setVouchers)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  const loadPlans = () => {
    import('../services/api').then(({ plansApi }) => {
      plansApi.list().then(setPlans).catch(() => {})
    })
  }

  useEffect(() => {
    load()
    loadPlans()
  }, [])

  const handleBulkGenerate = async (values: any) => {
    setFormSubmitting(true)
    try {
      await vouchersApi.bulkGenerate({
        count: values.count,
        planId: values.planId,
        prefix: values.prefix,
        length: values.length,
      })
      setShowBulkModal(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Bulk generate failed')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleRedeem = async (code: string) => {
    try {
      await vouchersApi.redeem(code, 0)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Redeem failed')
    }
  }

  const handleValidate = async (code: string) => {
    try {
      const result = await vouchersApi.validate(code)
      setError(`Voucher valid: ${result.isValid ? 'Yes' : 'No'}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Validation failed')
    }
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record: Voucher) => (
        <Flex align="center" gap="small">
          <Tag color={record.isRedeemed ? 'red' : 'green'}>
            {record.isRedeemed ? 'REDEEMED' : 'AVAILABLE'}
          </Tag>
          <Text code>{code}</Text>
        </Flex>
      ),
    },
    {
      title: 'Plan',
      key: 'plan',
      render: (v: Voucher) => (
        v.plan ? <Tag color="blue">{v.plan.name}</Tag> : <Text type="secondary">None</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount ? `KES ${amount}` : 'N/A',
    },
    {
      title: 'Duration',
      dataIndex: 'durationDays',
      key: 'durationDays',
      render: (days: number) => days ? `${days} days` : 'N/A',
    },
    {
      title: 'Redeemed By',
      key: 'redeemedBy',
      render: (v: Voucher) => (
        v.redeemedByCustomer ? <Tag color="purple">{v.redeemedByCustomer.firstName}</Tag> : 'N/A'
      ),
    },
    {
      title: 'Redeemed At',
      dataIndex: 'redeemedAt',
      key: 'redeemedAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : 'N/A',
    },
    {
      title: 'Expires',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (v: Voucher) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleValidate(v.code)}>Validate</Button>
          {!v.isRedeemed && (
            <Button type="link" size="small" onClick={() => handleRedeem(v.code)}>Redeem</Button>
          )}
          {deleteId === v.id ? (
            <>
              <Button type="link" size="small" danger onClick={() => { /* handle delete */ setDeleteId(null) }}>Confirm</Button>
              <Button type="text" size="small" onClick={() => setDeleteId(null)}>Cancel</Button>
            </>
          ) : (
            <Button type="link" size="small" danger onClick={() => setDeleteId(v.id)}>Delete</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Vouchers</Title>
          <Paragraph className="m-0">Manage prepaid vouchers for customers</Paragraph>
        </Flex>
        <Space>
          <Button type="primary" onClick={() => setShowBulkModal(true)} className="bg-primary hover:bg-primary/90">
            Bulk Generate
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
            <Text type="secondary">Loading vouchers...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={vouchers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} vouchers`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Bulk Generate Vouchers"
        open={showBulkModal}
        onOk={() => bulkForm.submit()}
        onCancel={() => setShowBulkModal(false)}
        confirmLoading={formSubmitting}
        width={600}
        className="top-8"
      >
        <Form form={bulkForm} onFinish={handleBulkGenerate} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Count" name="count" rules={[{ required: true, message: 'Please enter count' }]}>
                <InputNumber min={1} max={1000} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Plan" name="planId" rules={[{ required: true, message: 'Please select plan' }]}>
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
              <Form.Item label="Prefix" name="prefix">
                <Input placeholder="ANG-" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Code Length" name="length">
                <InputNumber min={8} max={20} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Single Voucher"
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        width={600}
        className="top-8"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Code" name="code">
                <Input placeholder="VOUCHER123" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
