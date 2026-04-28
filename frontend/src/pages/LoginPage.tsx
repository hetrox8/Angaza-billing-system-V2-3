import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, Form, Input, Button, Typography, Alert, Flex, Avatar } from 'antd'

const { Title, Text } = Typography

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (user) { navigate('/'); return null }

  const handleSubmit = async () => {

    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Invalid credentials. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-gradient-to-br from-primary to-blue-700 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <Flex vertical align="center" gap="middle" className="mb-6">
          <Flex align="center" gap="small">
            <Avatar size={48} className="bg-primary text-white">A</Avatar>
            <Title level={3} className="m-0">Angaza</Title>
          </Flex>
          
          <Title level={4} className="m-0 text-center">
            Welcome back
          </Title>
          <Text type="secondary" className="text-center">
            Sign in to your billing dashboard
          </Text>
        </Flex>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            className="mb-4"
          />
        )}

        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Email address"
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              className="bg-primary hover:bg-primary/90"
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" className="text-center text-xs mt-4 block">
          Angaza Billing System · ISP Management Platform
        </Text>
      </Card>
    </Flex>
  )
}
