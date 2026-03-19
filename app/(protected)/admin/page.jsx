'use client';
// app/(protected)/admin/page.jsx - 管理员控制台
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select,
  Typography, message, Drawer, Badge, Tooltip, Popconfirm,
} from 'antd';
import {
  SearchOutlined, EditOutlined, UnlockOutlined, HistoryOutlined, ReloadOutlined, SafetyOutlined,
} from '@ant-design/icons';
import useAppStore from '@/store/useAppStore';
import client from '@/apiclient/client';

const { Title, Text } = Typography;

const ROLE_CONFIG = {
  admin: { color: 'red',     label: '管理员' },
  pro:   { color: 'blue',    label: 'Pro' },
  free:  { color: 'default', label: '免费' },
};

const REPORT_TYPE_LABELS = {
  weekly:  '周报',
  monthly: '月报',
  standup: '晨会',
  review:  '述职',
};

export default function AdminPage() {
  const router = useRouter();
  const user = useAppStore(s => s.user);

  // 用户列表状态
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);

  // 编辑弹窗
  const [editVisible, setEditVisible]   = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [editForm] = Form.useForm();

  // 重置密码弹窗
  const [pwdVisible, setPwdVisible]   = useState(false);
  const [pwdTarget, setPwdTarget]     = useState(null);
  const [pwdForm] = Form.useForm();

  // 历史记录抽屉
  const [histVisible, setHistVisible]   = useState(false);
  const [histTarget, setHistTarget]     = useState(null);
  const [history, setHistory]           = useState([]);
  const [histTotal, setHistTotal]       = useState(0);
  const [histPage, setHistPage]         = useState(1);
  const [histLoading, setHistLoading]   = useState(false);

  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'admin') {
      message.error('无权访问');
      router.push('/');
    }
  }, [user, router]);

  const fetchUsers = useCallback(async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await client.get('/admin/users', { params: { page: p, pageSize: 20, search: s } });
      setUsers(res.users);
      setTotal(res.total);
    } catch {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers(page, search);
  }, [page, search, user]);

  // 编辑用户
  const openEdit = (record) => {
    if (isProtected(record.email)) {
      message.warning('系统内置账号不允许修改');
      return;
    }
    setEditTarget(record);
    editForm.setFieldsValue({ nickname: record.nickname, role: record.role });
    setEditVisible(true);
  };
  const submitEdit = async () => {
    const values = await editForm.validateFields();
    try {
      await client.patch(`/admin/users/${editTarget.id}`, values);
      message.success('修改成功');
      setEditVisible(false);
      editForm.resetFields();
      fetchUsers(page, search);
    } catch (err) {
      message.error(err?.response?.data?.error || '修改失败，请检查管理员 KEY');
    }
  };

  // 重置密码
  const openPwd = (record) => {
    setPwdTarget(record);
    pwdForm.resetFields();
    setPwdVisible(true);
  };
  const submitPwd = async () => {
    const { newPassword, adminKey } = await pwdForm.validateFields();
    try {
      await client.post(`/admin/users/${pwdTarget.id}/reset-password`, { newPassword, adminKey });
      message.success('密码已重置');
      setPwdVisible(false);
    } catch (err) {
      message.error(err?.response?.data?.error || '重置失败');
    }
  };

  // 操作历史
  const openHist = async (record, p = 1) => {
    setHistTarget(record);
    setHistVisible(true);
    setHistPage(p);
    setHistLoading(true);
    try {
      const res = await client.get(`/admin/users/${record.id}/history`, { params: { page: p, pageSize: 15 } });
      setHistory(res.history);
      setHistTotal(res.total);
    } catch {
      message.error('获取历史失败');
    } finally {
      setHistLoading(false);
    }
  };

  const isProtected = (email) => ['admin@repoai.com', 'demo@repoai.com'].includes(email);

  const columns = [
    {
      title: '用户',
      dataIndex: 'email',
      render: (email, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.nickname}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{email}</Text>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 90,
      render: (role) => {
        const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.free;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v) => new Date(v).toLocaleString('zh-CN', { hour12: false }),
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => {
        const locked = isProtected(record.email);
        return (
          <Space>
            <Tooltip title={locked ? '系统内置账号，不可编辑' : '编辑用户'}>
              <Button
                size="small" icon={<EditOutlined />}
                onClick={() => openEdit(record)}
                disabled={locked}
              />
            </Tooltip>
            <Tooltip title={locked ? '系统内置账号，不可重置密码' : '重置密码'}>
              <Button
                size="small" icon={<UnlockOutlined />}
                onClick={() => openPwd(record)}
                disabled={locked}
              />
            </Tooltip>
            <Tooltip title="操作历史">
              <Button size="small" icon={<HistoryOutlined />} onClick={() => openHist(record)} />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const histColumns = [
    {
      title: '类型',
      dataIndex: 'report_type',
      width: 70,
      render: (v) => REPORT_TYPE_LABELS[v] || v,
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (v) => v || <Text type="secondary">（无标题）</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v) => <Badge status={v === 'done' ? 'success' : v === 'error' ? 'error' : 'processing'} text={v} />,
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: '耗时',
      dataIndex: 'latency_ms',
      width: 80,
      render: (v) => v ? `${(v / 1000).toFixed(1)}s` : '-',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 150,
      render: (v) => new Date(v).toLocaleString('zh-CN', { hour12: false }),
    },
  ];

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={5} style={{ margin: 0 }}>用户管理 <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>共 {total} 人</Text></Title>
        <Space>
          <Input
            placeholder="搜索邮箱/昵称"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 220 }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(page, search)}>刷新</Button>
        </Space>
      </div>

      {/* 用户表格 */}
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={columns}
        pagination={{
          current: page, pageSize: 20, total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p) => setPage(p),
        }}
        style={{ flex: 1 }}
      />

      {/* 编辑用户弹窗 */}
      <Modal
        title={`编辑用户 — ${editTarget?.nickname || editTarget?.email}`}
        open={editVisible}
        onOk={submitEdit}
        onCancel={() => { setEditVisible(false); editForm.resetFields(); }}
        okText="保存"
        cancelText="取消"
        width={420}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="管理员 KEY"
            name="adminKey"
            rules={[{ required: true, message: '请输入管理员安全 KEY' }]}
          >
            <Input.Password prefix={<SafetyOutlined />} placeholder="请输入管理员安全 KEY" />
          </Form.Item>
          <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: '请填写昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true }]}>
            <Select options={[
              { value: 'free',  label: '免费用户' },
              { value: 'pro',   label: 'Pro 用户' },
              { value: 'admin', label: '管理员' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title={`重置密码 — ${pwdTarget?.nickname || pwdTarget?.email}`}
        open={pwdVisible}
        onOk={submitPwd}
        onCancel={() => setPwdVisible(false)}
        okText="确认重置"
        cancelText="取消"
        width={400}
      >
        <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="管理员 KEY"
            name="adminKey"
            rules={[{ required: true, message: '请输入管理员 KEY' }]}
          >
            <Input.Password placeholder="请输入管理员安全 KEY" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少6位' }]}
          >
            <Input.Password placeholder="至少6位" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 操作历史抽屉 */}
      <Drawer
        title={`操作历史 — ${histTarget?.nickname || histTarget?.email}`}
        open={histVisible}
        onClose={() => setHistVisible(false)}
        width={720}
      >
        <Table
          size="small"
          rowKey="id"
          loading={histLoading}
          dataSource={history}
          columns={histColumns}
          pagination={{
            current: histPage, pageSize: 15, total: histTotal,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => openHist(histTarget, p),
          }}
        />
      </Drawer>
    </div>
  );
}
