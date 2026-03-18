'use client';
// components/layout/AppShell.jsx - 主布局（侧边栏 + 顶栏）
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Modal, Form, Input, message } from 'antd';
import {
  FileTextOutlined, BookOutlined, HistoryOutlined,
  LogoutOutlined, UserOutlined, TeamOutlined, LockOutlined,
} from '@ant-design/icons';
import useAppStore from '@/store/useAppStore';
import QuotaBadge from '@/components/quota/QuotaBadge';
import { getQuotaStatus } from '@/api/quota';
import client from '@/api/client';

const { Sider, Content, Header } = Layout;

const baseMenuItems = [
  { key: '/',           icon: <FileTextOutlined />, label: '生成汇报' },
  { key: '/templates',  icon: <BookOutlined />,     label: '话术库' },
  { key: '/history',    icon: <HistoryOutlined />,  label: '历史汇报' },
];

const adminMenuItem = { key: '/admin', icon: <TeamOutlined />, label: '用户管理' };

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, setQuota } = useAppStore();

  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdForm] = Form.useForm();

  const menuItems = user?.role === 'admin'
    ? [...baseMenuItems, adminMenuItem]
    : baseMenuItems;

  const allItems = [...baseMenuItems, adminMenuItem];

  useEffect(() => {
    getQuotaStatus().then(setQuota).catch(() => {});
  }, []);

  const handleChangePwd = async () => {
    const values = await pwdForm.validateFields();
    setPwdLoading(true);
    try {
      await client.post('/user/password', values);
      message.success('密码修改成功');
      setPwdVisible(false);
      pwdForm.resetFields();
    } catch (err) {
      message.error(err?.response?.data?.error || '修改失败');
    } finally {
      setPwdLoading(false);
    }
  };

  const userMenu = {
    items: [
      { key: 'changePwd', icon: <LockOutlined />, label: '修改密码' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') { logout(); router.push('/login'); }
      if (key === 'changePwd') { pwdForm.resetFields(); setPwdVisible(true); }
    },
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={200} theme="light" style={{ borderRight: '1px solid #f0f0f0', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#1677ff' }}>RepoAI</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>智能汇报生成</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none', marginTop: 8, flex: 1 }}
        />
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', marginTop: 'auto' }}>
          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: 'center' }}>
            联系我们
          </Typography.Text>
          <Typography.Link href="mailto:ncly800101@gmail.com" style={{ fontSize: 11, display: 'block', textAlign: 'center' }}>
            ncly800101@gmail.com
          </Typography.Link>
        </div>
      </Sider>

      <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header style={{
          background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {allItems.find(m => m.key === pathname)?.label || '生成汇报'}
          </Typography.Text>
          <Space size={16}>
            <QuotaBadge />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" style={{ background: '#1677ff' }} />
                <Typography.Text>{user?.nickname || user?.email}</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ flex: 1, minHeight: 0, padding: 24, background: '#f5f5f5', overflow: 'hidden' }}>
          {children}
        </Content>
      </Layout>

      <Modal
        title="修改密码"
        open={pwdVisible}
        onOk={handleChangePwd}
        onCancel={() => setPwdVisible(false)}
        confirmLoading={pwdLoading}
        okText="确认修改"
        cancelText="取消"
        width={400}
      >
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="当前密码" name="currentPassword" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
          </Form.Item>
          <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="新密码（至少6位）" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
