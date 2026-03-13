// components/layout/AppShell.jsx - 主布局（侧边栏 + 顶栏）
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  FileTextOutlined,
  BookOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import useAppStore from '../../store/useAppStore';
import QuotaBadge from '../quota/QuotaBadge';
import { getQuotaStatus } from '../../api/quota';

const { Sider, Content, Header } = Layout;

const menuItems = [
  { key: '/',          icon: <FileTextOutlined />, label: '生成汇报' },
  { key: '/templates', icon: <BookOutlined />,     label: '话术库' },
  { key: '/history',   icon: <HistoryOutlined />,  label: '历史汇报' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setQuota } = useAppStore();

  useEffect(() => {
    getQuotaStatus().then(setQuota).catch(() => {});
  }, []);

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') { logout(); navigate('/login'); }
    },
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={200} theme="light" style={{ borderRight: '1px solid #f0f0f0', height: '100%', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#1677ff' }}>
            RepoAI
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>智能汇报生成</Typography.Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {menuItems.find(m => m.key === location.pathname)?.label || '生成汇报'}
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
