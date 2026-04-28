import { useState, useEffect } from 'react'
import { licenseKeysApi, LicenseKey, Company } from '../services/api'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Alert, Spin, Flex, Tag, Typography, Card, Row, Col, Space, Descriptions, Tooltip } from 'antd'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const licenseTypeColors = { trial: 'orange', monthly: 'blue', annual: 'green', lifetime: 'purple' }

export default function LicenseKeysPage() {
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showValidateModal, setShowValidateModal] = useState(false)
  const [editTarget, setEditTarget] = useState<LicenseKey | null>(null)
  const [form] = Form.useForm()
  const [validateForm] = Form.useForm()
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const load = () => {
    setLoading(true)
    licenseKeysApi.list()
      .then(setLicenseKeys)
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

  const handleCreate = async (values: any) => {
    setFormSubmitting(true)
    try {
      await licenseKeysApi.create({
        key: values.key,
        licenseType: values.licenseType,
        maxDevices: values.maxDevices,
        maxCustomers: values.maxCustomers,
        companyId: values.companyId,
        expiryDate: values.expiryDate,
        isActive: values.isActive,
        description: values.description,
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
      await licenseKeysApi.update(id, {
        licenseType: values.licenseType,
        maxDevices: values.maxDevices,
        maxCustomers: values.maxCustomers,
        companyId: values.companyId,
        expiryDate: values.expiryDate,
        isActive: values.isActive,
        description: values.description,
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
      await licenseKeysApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }

  const handleActivate = async (key: string) => {
    try {
      await licenseKeysApi.activate(key, 0)
      load()
      setError('License key activated successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Activation failed')
    }
  }

  const handleDeactivate = async (key: string) => {
    try {
      await licenseKeysApi.deactivate(key)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Deactivation failed')
    }
  }

  const handleValidate = async (values: any) => {
    setValidating(true)
    setValidationResult(null)
    try {
      const result = await licenseKeysApi.validate(values.key)
      setValidationResult(result)
      if (result.isValid) {
        setError('License key is valid')
      } else {
        setError(result.message || 'License key is invalid')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  const handleGenerate = async () => {
    try {
      const result = await licenseKeysApi.generateKey({
        licenseType: 'monthly',
        maxDevices: 10,
        maxCustomers: 100,
      })
      setError(`Generated key: ${result.key}`)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Generation failed')
    }
  }

  const openEdit = (lk: LicenseKey) => {
    setEditTarget(lk)
    form.setFieldsValue({
      key: lk.key,
      licenseType: lk.licenseType,
      maxDevices: lk.maxDevices,
      maxCustomers: lk.maxCustomers,
      companyId: lk.companyId,
      expiryDate: lk.expiryDate,
      isActive: lk.isActive,
      description: lk.description,
    })
    setShowModal(true)
  }

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setShowModal(true)
  }

  const columns = [
    {
      title: 'License Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <Tooltip title={key}>
          <Text code>{key.substring(0, 16)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'licenseType',
      key: 'licenseType',
      render: (type: string) => (
        <Tag color={(licenseTypeColors as any)[type] || 'gray'}>{type}</Tag>
      ),
      width: 120,
    },
    {
      title: 'Status',
      key: 'status',
      render: (lk: LicenseKey) => (
        <Tag color={lk.isActive ? 'green' : 'red'}>
          {lk.isActive ? (lk.expiryDate && new Date(lk.expiryDate) < new Date() ? 'Expired' : 'Active') : 'Inactive'}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Company',
      key: 'company',
      render: (lk: LicenseKey) => (
        lk.company ? <Tag color="blue">{lk.company.name}</Tag> : <Text type="secondary">Unassigned</Text>
      ),
      width: 150,
    },
    {
      title: 'Max Devices',
      dataIndex: 'maxDevices',
      key: 'maxDevices',
      width: 120,
    },
    {
      title: 'Max Customers',
      dataIndex: 'maxCustomers',
      key: 'maxCustomers',
      width: 120,
    },
    {
      title: 'Expires',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (lk: LicenseKey) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(lk)}>Edit</Button>
          {lk.isActive ? (
            <>
              <Button type="link" size="small" onClick={() => handleDeactivate(lk.key)}>Deactivate</Button>
              {lk.expiryDate && new Date(lk.expiryDate) < new Date() && (
                <Tooltip title="Expired"><Button type="link" size="small" disabled>Expired</Button></Tooltip>
              )}
            </>
          ) : (
            <Button type="link" size="small" onClick={() => handleActivate(lk.key)}>Activate</Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(lk.id)}>Delete</Button>
        </Space>
      ),
    },
  ]

  const getStats = () => ({
    total: licenseKeys.length,
    active: licenseKeys.filter(lk => lk.isActive).length,
    expired: licenseKeys.filter(lk => lk.expiryDate && new Date(lk.expiryDate) < new Date()).length,
    unassigned: licenseKeys.filter(lk => !lk.companyId).length,
  })

  return (
    <div className="p-6">
      <Flex justify="space-between" align="center" className="mb-6">
        <Flex vertical>
          <Title level={2} className="m-0">License Keys</Title>
          <Paragraph className="m-0">Manage system license keys and subscriptions</Paragraph>
        </Flex>
        <Space>
          <Button onClick={() => setShowValidateModal(true)}>Validate Key</Button>
          <Button onClick={handleGenerate}>Generate Key</Button>
          <Button type="primary" onClick={openCreate} className="bg-primary hover:bg-primary/90">
            + Add License Key
          </Button>
        </Space>
      </Flex>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} className="mb-6" />
      )}

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm">
            <Tag color="blue" className="mb-2">Total</Tag>
            <Title level={2} className="m-0">{getStats().total}</Title>
            <Text type="secondary">license keys</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm">
            <Tag color="green" className="mb-2">Active</Tag>
            <Title level={2} className="m-0">{getStats().active}</Title>
            <Text type="secondary">active licenses</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm">
            <Tag color="red" className="mb-2">Expired</Tag>
            <Title level={2} className="m-0">{getStats().expired}</Title>
            <Text type="secondary">expired licenses</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm">
            <Tag color="orange" className="mb-2">Unassigned</Tag>
            <Title level={2} className="m-0">{getStats().unassigned}</Title>
            <Text type="secondary">unassigned keys</Text>
          </Card>
        </Col>
      </Row>

      <Card title="License Keys" className="shadow-sm">
        {loading ? (
          <Flex vertical align="center" gap="small" className="py-8">
            <Spin size="large" />
            <Text type="secondary">Loading license keys...</Text>
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={licenseKeys}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} license keys`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <Modal
        title={editTarget ? `Edit License: ${editTarget.key.substring(0, 16)}...` : 'Add New License Key'}
        open={showModal}
        onOk={() => form.submit()}
        onCancel={() => setShowModal(false)}
        confirmLoading={formSubmitting}
        width={700}
        className="top-8"
      >
        <Form form={form} onFinish={editTarget ? () => handleUpdate(editTarget.id, form.getFieldsValue(true)) : handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="License Key" name="key" rules={[{ required: true, message: 'Please enter license key' }]}>
                <Input placeholder="XXXX-XXXX-XXXX-XXXX" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="License Type" name="licenseType" rules={[{ required: true, message: 'Please select type' }]}>
                <Select placeholder="Select type">
                  <Option value="trial">Trial</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="annual">Annual</Option>
                  <Option value="lifetime">Lifetime</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Company" name="companyId">
                <Select placeholder="Select company" allowClear>
                  {companies.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Max Devices" name="maxDevices" rules={[{ required: true, message: 'Please enter max devices' }]}>
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Max Customers" name="maxCustomers" rules={[{ required: true, message: 'Please enter max customers' }]}>
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Expiry Date" name="expiryDate">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Active" name="isActive" valuePropName="checked">
                <Select placeholder="Select status">
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <TextArea placeholder="Brief description of this license" rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Validate License Key"
        open={showValidateModal}
        onOk={() => validateForm.submit()}
        onCancel={() => { setShowValidateModal(false); setValidationResult(null) }}
        confirmLoading={validating}
        width={600}
        className="top-8"
      >
        <Form form={validateForm} onFinish={handleValidate} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="License Key" name="key" rules={[{ required: true, message: 'Please enter license key' }]}>
                <Input placeholder="XXXX-XXXX-XXXX-XXXX" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {validationResult && (
          <>
            <Divider />
            <Descriptions title="Validation Result" layout="horizontal" column={1} bordered>
              <Descriptions.Item label="Valid">{validationResult.isValid ? '✓ Yes' : '✗ No'}</Descriptions.Item>
              <Descriptions.Item label="License Type">{validationResult.licenseType || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Max Devices">{validationResult.maxDevices || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Max Customers">{validationResult.maxCustomers || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Company">{validationResult.companyId || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">{validationResult.expiryDate || 'Never'}</Descriptions.Item>
              <Descriptions.Item label="Is Active">{validationResult.isActive ? '✓ Yes' : '✗ No'}</Descriptions.Item>
            </Descriptions>
            {validationResult.message && (
              <Alert message={validationResult.message} type={validationResult.isValid ? 'success' : 'error'} className="mt-4" />
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

import { Divider } from 'antd'
