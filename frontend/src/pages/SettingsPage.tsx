import { useState, useEffect } from 'react'
import { settingsApi, Setting } from '../services/api'
import { Table, Button, Modal, Form, Input, Select, Alert, Spin, Flex, Tag, Typography, Card, Row, Col, Space, Descriptions } from 'antd'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [systemSettings, setSystemSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Setting | null>(null)
  const [form] = Form.useForm()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      settingsApi.list(),
      settingsApi.getSystemSettings(),
    ]).then(([settingsData, systemData]) => {
      setSettings(settingsData)
      setSystemSettings(systemData)
    }).catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (groupFilter) {
      setLoading(true)
      settingsApi.list().then((data) => {
        const filtered = data.filter((s: Setting) => s.group === groupFilter)
        setSettings(filtered)
      }).catch((e) => setError(e?.message || 'Filter failed')).finally(() => setLoading(false))
    } else {
      load()
    }
  }, [groupFilter])

  const handleCreate = async (values: any) => {
    setFormSubmitting(true)
    try {
      await settingsApi.create({
        key: values.key,
        value: values.value,
        description: values.description,
        group: values.group,
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

  const handleUpdate = async (id: number, values: any) => {
    setFormSubmitting(true)
    try {
      await settingsApi.update(id, {
        key: values.key,
        value: values.value,
        description: values.description,
        group: values.group,
      })
      setShowModal(false)
      form.resetFields()
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Update failed')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await settingsApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }

  const openEdit = (s: Setting) => {
    setEditTarget(s)
    form.setFieldsValue({
      key: s.key,
      value: s.value,
      description: s.description,
      group: s.group,
    })
    setShowModal(true)
  }

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setShowModal(true)
  }

  const openUpdateByKey = (s: Setting) => {
    Modal.confirm({
      title: `Update ${s.key}`,
      content: (
        <Form form={form} layout="vertical">
          <Form.Item label="New Value" name="value" initialValue={s.value}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const values = await form.validateFields()
        try {
          await settingsApi.updateByKey(s.key, values.value)
          load()
        } catch (err: any) {
          setError(err?.response?.data?.message || 'Update failed')
        }
      },
    })
  }

  const getUniqueGroups = () => {
    const groups = new Set(settings.map(s => s.group).filter(Boolean) as string[])
    return ['All', ...Array.from(groups).sort()]
  }

  const handleGroupFilterChange = (val: string) => {
    setGroupFilter(val === 'All' ? null : val)
  }

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => <Text code>{key}</Text>,
    },
    {
      title: 'Group',
      dataIndex: 'group',
      key: 'group',
      render: (group: string) => group ? <Tag color="blue">{group}</Tag> : <Text type="secondary">N/A</Text>,
      width: 150,
    },
    {
      title: 'Value',
      key: 'value',
      render: (s: Setting) => (
        <div className="max-w-sm">
          {typeof s.value === 'string' && (s.value as string).length > 100 ?
            `${(s.value as string).substring(0, 100)}...` :
            JSON.stringify(s.value || '')}
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (s: Setting) => (
        <Space>
          <Button type="link" size="small" onClick={() => openUpdateByKey(s)}>Quick Edit</Button>
          <Button type="link" size="small" onClick={() => openEdit(s)}>Edit</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(s.id)}>Delete</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Settings</Title>
          <Paragraph className="m-0">Manage system configuration</Paragraph>
        </Flex>
        <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
          + Add Setting
        </Button>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      {systemSettings && (
        <Card title="System Overview" className="shadow-sm mb-6">
          <Descriptions layout="horizontal" column={2} bordered>
            <Descriptions.Item label="Total Settings">{systemSettings.totalSettings || '0'}</Descriptions.Item>
            <Descriptions.Item label="Groups">{systemSettings.groups || '0'}</Descriptions.Item>
            <Descriptions.Item label="Database Version">{systemSettings.dbVersion || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="App Version">v3.0.0</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card className="shadow-sm mb-6">
        <Select
          placeholder="Filter by group"
          value={groupFilter || 'All'}
          onChange={handleGroupFilterChange}
          style={{ width: 200 }}
        >
          {getUniqueGroups().map((g) => (
            <Option key={g} value={g}>{g}</Option>
          ))}
        </Select>
      </Card>

      <Card title="All Settings" className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading settings...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={settings}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} settings`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit Setting: ${editTarget.key}` : 'Add New Setting'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={600}
        className="top-8"
      >
        <Form form={form} onFinish={editTarget ? () => handleUpdate(editTarget.id, form.getFieldsValue(true)) : handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Key" name="key" rules={[{ required: true, message: 'Please enter key' }]}>
                <Input placeholder="setting.key.name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Value" name="value" rules={[{ required: true, message: 'Please enter value' }]}>
                <TextArea placeholder="Setting value" rows={4} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <TextArea placeholder="Brief description of this setting" rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Group" name="group">
                <Input placeholder="app, database, api, etc." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
