'use client';
// app/login/page.jsx - 登录/注册页
import { useState, useMemo } from 'react';
import { Card, Form, Input, Button, Tabs, Typography, App, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { login, register } from '@/api/auth';
import useAppStore from '@/store/useAppStore';

function useLandscapeBg() {
  return useMemo(() => {
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/1920/1080`;
  }, []);
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [bgBlur, setBgBlur] = useState(false);
  const [loginForm] = Form.useForm();
  const router = useRouter();
  const setAuth = useAppStore(s => s.setAuth);
  const { message } = App.useApp();
  const bgUrl = useLandscapeBg();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);
      setAuth(res.user, res.token);
      message.success('登录成功');
      router.push('/');
    } catch (err) {
      message.error(err.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const res = await register(values);
      setAuth(res.user, res.token);
      message.success('注册成功，欢迎使用 RepoAI');
      router.push('/');
    } catch (err) {
      message.error(err.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email, password) => {
    setActiveTab('login');
    loginForm.setFieldsValue({ email, password });
    loginForm.submit();
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: bgBlur ? 'blur(10px)' : 'blur(0px)',
        transform: 'scale(1.06)',
        transition: 'filter 0.2s ease',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: bgBlur ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)',
        transition: 'background 0.2s ease',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }} onMouseEnter={() => setBgBlur(true)} onMouseLeave={() => setBgBlur(false)}>
        <Card style={{
          width: 400,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          borderRadius: 12,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Typography.Title level={3} style={{ color: '#1677ff', margin: 0 }}>RepoAI</Typography.Title>
            <Typography.Text type="secondary">智能职场汇报生成工具</Typography.Text>
          </div>
          <Tabs activeKey={activeTab} onChange={setActiveTab} centered items={[
            {
              key: 'login', label: '登录',
              children: (
                <Form form={loginForm} onFinish={handleLogin} size="large">
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                    <Input prefix={<MailOutlined />} placeholder="邮箱" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
                  </Form.Item>

                </Form>
              ),
            },
            {
              key: 'register', label: '注册',
              children: (
                <Form onFinish={handleRegister} size="large">
                  <Form.Item name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
                    <Input prefix={<UserOutlined />} placeholder="昵称" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                    <Input prefix={<MailOutlined />} placeholder="邮箱" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>注册</Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]} />
          {activeTab === 'login' && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Typography.Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                或使用以下账号快速登录
              </Typography.Text>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<LoginOutlined />}
                  onClick={() => handleQuickLogin('admin@repoai.com', 'admin123456')}
                  style={{ background: '#fff7e6', borderColor: '#ffa940', color: '#d46b08' }}
                >
                  👑 管理员 &nbsp;<Typography.Text type="secondary" style={{ fontSize: 11 }}>admin@repoai.com / admin123456</Typography.Text>
                </Button>
                <Button
                  block
                  icon={<LoginOutlined />}
                  onClick={() => handleQuickLogin('demo@repoai.com', 'demo123456')}
                  style={{ background: '#f0f5ff', borderColor: '#adc6ff', color: '#2f54eb' }}
                >
                  🧑 演示账号 &nbsp;<Typography.Text type="secondary" style={{ fontSize: 11 }}>demo@repoai.com / demo123456</Typography.Text>
                </Button>
              </Space>
            </div>
          )}
        </Card>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            联系我们：
          </Typography.Text>
          <Typography.Link href="mailto:ncly800101@gmail.com" style={{ fontSize: 12 }}>
            ncly800101@gmail.com
          </Typography.Link>
        </div>
      </div>
    </div>
  );
}
