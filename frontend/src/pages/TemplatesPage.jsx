// pages/TemplatesPage.jsx - 话术库管理页
import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm,
  Upload, App, Tag, Tooltip, Pagination, Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, importTemplates, exportTemplates } from '../api/templates';

const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { value: 'general', label: '通用' },
  { value: 'weekly',  label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'standup', label: '晨会' },
  { value: 'review',  label: '述职' },
];

const CATEGORY_COLORS = { general: 'default', weekly: 'blue', monthly: 'green', standup: 'orange', review: 'purple' };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingTemplate(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, values);
        message.success('模板已更新');
      } else {
        await createTemplate(values);
        message.success('模板已创建');
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      message.error(err.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTemplate(id);
      message.success('已删除');
      fetchTemplates();
    } catch (err) {
      message.error(err.error || '删除失败');
    }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const arr = Array.isArray(data) ? data : [data];
        const res = await importTemplates(arr);
        message.success(`成功导入 ${res.imported} 条模板`);
        fetchTemplates();
      } catch {
        message.error('导入失败，请检查 JSON 格式');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleExport = async () => {
    try {
      const data = await exportTemplates();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'my-templates.json'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('导出失败');
    }
  };

  const columns = [
    {
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_, __, index) => (tablePage - 1) * tablePageSize + index + 1,
    },
    { title: '模板名称', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: '分类', dataIndex: 'category', key: 'category', width: 100,
      render: (cat) => <Tag color={CATEGORY_COLORS[cat]}>{CATEGORY_OPTIONS.find(o => o.value === cat)?.label || cat}</Tag>,
    },
    {
      title: '内容预览', dataIndex: 'content', key: 'content',
      render: (text) => <Tooltip title={text}><span style={{ color: '#666' }}>{text.slice(0, 60)}...</span></Tooltip>,
    },
    {
      title: '来源', dataIndex: 'is_builtin', key: 'is_builtin', width: 80,
      render: (v) => <Tag color={v ? 'cyan' : 'default'}>{v ? '内置' : '自定义'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => record.is_builtin ? null : (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="话术库"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 } }}
      extra={
        <Space>
          <Upload beforeUpload={handleImport} accept=".json" showUploadList={false}>
            <Button icon={<ImportOutlined />}>导入 JSON</Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出我的模板</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模板</Button>
        </Space>
      }
    >
      <Table
        dataSource={templates.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ y: 'calc(100vh - 325px)' }}
        pagination={false}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
        <Pagination
          current={tablePage}
          total={templates.length}
          pageSize={tablePageSize}
          showSizeChanger
          pageSizeOptions={['10', '20', '50', '100']}
          onChange={(p, size) => { setTablePage(p); setTablePageSize(size); }}
          size="small"
        />
        <Typography.Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          共 {templates.length} 条
        </Typography.Text>
      </div>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
            <Input placeholder="如：本周工作完成情况" />
          </Form.Item>
          <Form.Item name="category" label="分类" initialValue="general" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="content" label="话术内容" rules={[{ required: true }]}>
            <TextArea rows={8} placeholder="输入话术模板内容，支持 [占位符] 格式..." showCount maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
