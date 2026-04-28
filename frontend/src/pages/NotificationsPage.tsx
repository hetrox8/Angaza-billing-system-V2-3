import { useState, useEffect } from 'react'
import { notificationsApi, Notification } from '../services/api'
import { Table, Button, Modal, Form, Input, Select, Alert, Spin, Flex, Tag, Typography, Card, Row, Col, Space } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const typeColors = { info: 'blue', success: 'green', warning: 'orange', error: 'red' }
const channelColors = { in_app: 'geekblue', email: 'purple', sms: 'cyan' }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form] = Form.useForm()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [readFilter, setReadFilter] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    notificationsApi.list()
      .then(setNotifications)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (typeFilter || channelFilter || readFilter) {
      setLoading(true)
      notificationsApi.filter({
        type: typeFilter,
        channel: channelFilter,
        isRead: readFilter === 'read',
      }).then(setNotifications).catch((e) => setError(e?.message || 'Filter failed')).finally(() => setLoading(false))
    }
  }, [typeFilter, channelFilter, readFilter])

  const handleCreate = async (values: any) => {
    setFormSubmitting(true)
    try {
      await notificationsApi.create({
        title: values.title,
        message: values.message,
        type: values.type,
        channel: values.channel,
        recipientId: values.recipientId,
      })
      setShowModal(false)
      form.resetFields()
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Create failed')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mark as read failed')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mark all as read failed')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={(typeColors as any)[type] || 'gray'}>{type}</Tag>,
      width: 100,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => <Tag color={(channelColors as any)[channel] || 'gray'}>{channel}</Tag>,
      width: 100,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (msg: string) => <div className="max-w-md">{msg}</div>,
    },
    {
      title: 'Read',
      key: 'isRead',
      render: (n: Notification) => (
        <Tag color={n.isRead ? 'green' : 'red'}>{n.isRead ? 'Read' : 'Unread'}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Recipient',
      key: 'recipient',
      render: (n: Notification) => (
        n.recipientEmail ? <Tag color="blue">{n.recipientEmail}</Tag> :
        n.recipientPhone ? <Tag color="purple">{n.recipientPhone}</Tag> :
        n.recipientId ? <Tag color="geekblue">{n.recipientId}</Tag> :
        <Text type="secondary">All</Text>
      ),
      width: 150,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (n: Notification) => new Date(n.createdAt).toLocaleString(),
      width: 180,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (n: Notification) => (
        <Space>
          {!n.isRead && (
            <Button type="link" size="small" onClick={() => handleMarkAsRead(n.id)}>Mark Read</Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(n.id)}>Delete</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Notifications</Title>
          <Paragraph className="m-0">Manage system notifications</Paragraph>
        </Flex>
        <Space>
          <Button onClick={handleMarkAllAsRead}>Mark All as Read</Button>
          <Button type="primary" onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90">
            + Create Notification
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Card className="shadow-sm mb-6">
        <Row gutter={16} align="middle">
          <Col>
            <Select
              placeholder="Filter by type"
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="info">Info</Option>
              <Option value="success">Success</Option>
              <Option value="warning">Warning</Option>
              <Option value="error">Error</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Filter by channel"
              value={channelFilter}
              onChange={setChannelFilter}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="in_app">In App</Option>
              <Option value="email">Email</Option>
              <Option value="sms">SMS</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Filter by read status"
              value={readFilter}
              onChange={setReadFilter}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="read">Read</Option>
              <Option value="unread">Unread</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card title="Notifications" className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading notifications...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} notifications`,
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      <Modal
        title="Create Notification"
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={600}
        className="top-8"
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
                <Input placeholder="Notification title" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Message" name="message" rules={[{ required: true, message: 'Please enter message' }]}>
                <TextArea placeholder="Notification message" rows={4} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select type' }]}>
                <Select placeholder="Select type">
                  <Option value="info">Info</Option>
                  <Option value="success">Success</Option>
                  <Option value="warning">Warning</Option>
                  <Option value="error">Error</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Channel" name="channel" rules={[{ required: true, message: 'Please select channel' }]}>
                <Select placeholder="Select channel">
                  <Option value="in_app">In App</Option>
                  <Option value="email">Email</Option>
                  <Option value="sms">SMS</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Recipient ID" name="recipientId">
                <Input placeholder="User ID" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
