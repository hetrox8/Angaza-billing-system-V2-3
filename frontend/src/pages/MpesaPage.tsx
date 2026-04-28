import { useState, useEffect } from 'react'
import { mpesaApi } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Alert, Spin, Flex, Tag, Typography, Space, Card, Row, Col, Descriptions, Divider } from 'antd'

const { Title, Text, Paragraph } = Typography

export default function MpesaPage() {
  const [status, setStatus] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSTKModal, setShowSTKModal] = useState(false)
  const [stkLoading, setSTKLoading] = useState(false)
  const [stkResult, setSTKResult] = useState<any>(null)
  const [form] = Form.useForm()

  const loadStatus = () => {
    setLoading(true)
    mpesaApi.getStatus()
      .then(setStatus)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load status'))
      .finally(() => setLoading(false))
  }

  const loadBalance = () => {
    setLoading(true)
    mpesaApi.getBalance()
      .then((res) => setBalance(res?.balance || ''))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load balance'))
      .finally(() => setLoading(false))
  }

  const loadTransactions = () => {
    setLoading(true)
    mpesaApi.getTransactions({})
      .then(setTransactions)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load transactions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStatus()
    loadBalance()
    loadTransactions()
  }, [])

  const handleSendSTK = async (values: any) => {
    setSTKLoading(true)
    setSTKResult(null)
    try {
      const result = await mpesaApi.sendSTKPush(
        values.phone,
        values.amount,
        values.accountReference,
        values.description
      )
      setSTKResult(result)
      setError('STK Push initiated successfully. Waiting for user confirmation...')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'STK Push failed')
    } finally {
      setSTKLoading(false)
    }
  }

  const handleReconcile = async () => {
    try {
      await mpesaApi.reconcile({})
      setError('Reconciliation started successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Reconciliation failed')
    }
  }

  const transactionColumns = [
    { title: 'Transaction ID', dataIndex: 'transactionId', key: 'tid' },
    { title: 'Receipt', dataIndex: 'receipt', key: 'receipt' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => `KES ${a}` },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'success' ? 'green' : 'red'}>{s}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date' },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">M-Pesa Integration</Title>
          <Paragraph className="m-0">Safaricom Daraja API Integration</Paragraph>
        </Flex>
        <Space>
          <Button onClick={() => { loadStatus(); loadBalance(); loadTransactions() }}>Refresh</Button>
          <Button onClick={handleReconcile}>Reconcile</Button>
          <Button type="primary" onClick={() => setShowSTKModal(true)} className="bg-primary hover:bg-primary/90">
            Send STK Push
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="System Status" className="shadow-sm">
            {loading ? (
              <Spin />
            ) : status ? (
              <Descriptions layout="horizontal" column={1}>
                <Descriptions.Item label="API Status">
                  <Tag color={status.connected ? 'green' : 'red'}>
                    {status.connected ? 'Connected' : 'Disconnected'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Short Code">{status.shortCode || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Pass Key">{status.passKey ? '••••••••' : 'Not set'}</Descriptions.Item>
                <Descriptions.Item label="Last Sync">{status.lastSync || 'Never'}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">No status data available</Text>
            )}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Account Balance" className="shadow-sm">
            {loading ? (
              <Spin />
            ) : balance ? (
              <Title level={2} className="m-0 text-green-600">KES {balance}</Title>
            ) : (
              <Text type="secondary">Balance not loaded</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Recent Transactions" className="shadow-sm">
        <Table
          columns={transactionColumns}
          dataSource={transactions}
          rowKey={(r: any) => r.transactionId || r.id}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Send STK Push"
        open={showSTKModal}
        onOk={() => form.submit()}
        onCancel={() => setShowSTKModal(false)}
        confirmLoading={stkLoading}
        width={600}
        className="top-8"
      >
        <Form form={form} onFinish={handleSendSTK} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="254712345678" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Amount (KES)"
                name="amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Account Reference"
                name="accountReference"
                rules={[{ required: true, message: 'Please enter account reference' }]}
              >
                <Input placeholder="invoice_12345" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea placeholder="Payment for internet service" rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {stkResult && (
          <>
            <Divider />
            <Descriptions title="STK Result" layout="horizontal" column={1}>
              <Descriptions.Item label="Request ID">{stkResult.requestId || stkResult.RequestID}</Descriptions.Item>
              <Descriptions.Item label="Status">{stkResult.status || stkResult.ResultCode}</Descriptions.Item>
              <Descriptions.Item label="Message">{stkResult.message || stkResult.ResultDesc}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}
