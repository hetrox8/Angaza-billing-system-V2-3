import { useState, useEffect, FormEvent } from 'react'
import { companiesApi, Company, CompanyPayload } from '../services/api'
import { Table, Button, Modal, Form, Input, Select, Alert, Spin, Flex, Avatar, Tag, Typography, Space, Card } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const EMPTY_FORM: Partial<CompanyPayload> = {
  name: '', email: '', phone: '', address: '', licenseType: 'trial',
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Company | null>(null)
  const [form] = Form.useForm<CompanyPayload>()
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    companiesApi.list()
      .then(setCompanies)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setShowModal(true)
  }

  const openEdit = (c: Company) => {
    setEditTarget(c)
    form.setFieldsValue({
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      licenseType: c.licenseType as 'trial' | 'monthly' | 'annual' | 'lifetime',
    })
    setShowModal(true)
  }

  const handleSave = async (values: CompanyPayload) => {
    setFormSubmitting(true)
    setSaving(true)
    try {
      if (editTarget) {
        await companiesApi.update(editTarget.id, values)
      } else {
        await companiesApi.create(values)
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setFormSubmitting(false)
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await companiesApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const columns = [
    {
      title: 'Company',
      key: 'company',
      render: (c: Company) => (
        <Flex align="center" gap="small">
          <Avatar size={40} className="bg-primary text-white">
            {c.name[0].toUpperCase()}
          </Avatar>
          <Flex vertical>
            <Text strong>{c.name}</Text>
            <Text type="secondary" className="text-xs">{c.email}</Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'License Key',
      dataIndex: 'licenseKey',
      key: 'licenseKey',
      render: (key: string) => <code className="bg-gray-100 px-2 py-1 rounded">{key}</code>,
    },
    {
      title: 'License Type',
      dataIndex: 'licenseType',
      key: 'licenseType',
      render: (type: string) => (
        <Tag color={type === 'trial' ? 'red' : type === 'monthly' ? 'blue' : type === 'annual' ? 'green' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Max Customers',
      dataIndex: 'maxCustomers',
      key: 'maxCustomers',
    },
    {
      title: 'Status',
      key: 'status',
      render: (c: Company) => (
        <Tag color={c.isActive ? 'green' : 'red'}>
          {c.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      key: 'createdAt',
      render: (c: Company) => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (c: Company) => (
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
      {/* Header */}
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">Companies</Title>
          <Paragraph className="m-0">Manage ISP tenants and their licenses</Paragraph>
        </Flex>
        <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
          + Add Company
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

      {/* Table */}
      <Card className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading…</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={companies}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Showing ${range[0]} to ${range[1]} of ${total} companies`,
            }}
          />
        )}
      </Card>

      {/* Modal */}
      <Modal
        title={editTarget ? `Edit ${editTarget.name}` : 'New Company'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        className="top-8"
        width={600}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Flex gap="middle" className="mb-4">
            <Form.Item
              label="Company Name"
              name="name"
              rules={[{ required: true, message: 'Please enter company name' }]}
              className="flex-1"
            >
              <Input placeholder="Mwananchi Telecom" />
            </Form.Item>
            
            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              className="flex-1"
            >
              <Input placeholder="admin@isp.co.ke" />
            </Form.Item>
          </Flex>

          <Flex gap="middle" className="mb-4">
            <Form.Item
              label="Phone"
              name="phone"
              className="flex-1"
            >
              <Input placeholder="+254 700 000000" />
            </Form.Item>
            
            <Form.Item
              label="License Type"
              name="licenseType"
              rules={[{ required: true, message: 'Please select license type' }]}
              className="flex-1"
            >
              <Select placeholder="Select license type">
                <Option value="trial">Trial</Option>
                <Option value="monthly">Monthly</Option>
                <Option value="annual">Annual</Option>
                <Option value="lifetime">Lifetime</Option>
              </Select>
            </Form.Item>
          </Flex>

          <Form.Item
            label="Address"
            name="address"
            className="mb-4"
          >
            <Input.TextArea placeholder="Mombasa, Kenya" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
