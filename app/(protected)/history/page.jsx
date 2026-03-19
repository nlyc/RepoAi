'use client';
// app/(protected)/history/page.jsx - 历史汇报列表
import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Tag, Modal, Space, Popconfirm, App, Empty, Select, Pagination, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getReports, getReport, deleteReport, exportReport } from '@/apiclient/reports';

const TYPE_LABELS = { weekly: '周报', monthly: '月报', standup: '晨会', review: '述职' };
const TYPE_COLORS = { weekly: 'blue', monthly: 'green', standup: 'orange', review: 'purple' };
const TYPE_OPTIONS = [{ value: '', label: '全部类型' }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))];

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterType, setFilterType] = useState('');
  const [previewReport, setPreviewReport] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { message } = App.useApp();

  const fetchReports = useCallback(async (p = 1, size = pageSize, type = filterType) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: size };
      if (type) params.reportType = type;
      const data = await getReports(params);
      setReports(data.list);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [filterType, pageSize]);

  useEffect(() => { fetchReports(page, pageSize); }, [page, pageSize, fetchReports]);

  const handleTypeFilter = (val) => { setFilterType(val); setPage(1); fetchReports(1, pageSize, val); };

  const handleTableChange = (p, size) => {
    if (size !== pageSize) { setPageSize(size); setPage(1); } else { setPage(p); }
  };

  const handlePreview = async (record) => {
    setPreviewReport(record);
    if (!record.output_text) {
      setPreviewLoading(true);
      try { setPreviewReport(await getReport(record.id)); }
      catch { message.error('加载内容失败'); }
      finally { setPreviewLoading(false); }
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReport(id);
      message.success('已删�?);
      const remaining = reports.length - 1;
      const targetPage = remaining === 0 && page > 1 ? page - 1 : page;
      setPage(targetPage);
      fetchReports(targetPage, pageSize);
    } catch { message.error('删除失败'); }
  };

  const handleExport = async (id, format) => {
    try { await exportReport(id, format); }
    catch { message.error('导出失败'); }
  };

  const handleCopy = async () => {
    if (!previewReport?.output_text) return;
    try { await navigator.clipboard.writeText(previewReport.output_text); message.success('已复制到剪贴�?); }
    catch { message.error('复制失败，请手动选择文本复制'); }
  };

  const columns = [
    { title: '序号', key: 'index', width: 60, align: 'center', render: (_, __, i) => (page - 1) * pageSize + i + 1 },
    {
      title: '标题', dataIndex: 'title', key: 'title',
      render: (text, record) => <Button type="link" style={{ padding: 0 }} onClick={() => handlePreview(record)}>{text || '未命名汇�?}</Button>,
    },
    { title: '类型', dataIndex: 'report_type', key: 'report_type', width: 90, render: (t) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t] || t}</Tag> },
    { title: '生成时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (t) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(t).toLocaleString('zh-CN')}</span> },
    {
      title: '操作', key: 'action', width: 280,
      render: (_, record) => (
        <Space style={{ whiteSpace: 'nowrap' }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record.id, 'md')}>MD</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record.id, 'docx')}>Word</Button>
          <Popconfirm title="确认删除�? onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={`历史汇报（共 ${total} 条）`}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 } }}
        extra={<Select value={filterType} onChange={handleTypeFilter} options={TYPE_OPTIONS} style={{ width: 120 }} size="small" />}
      >
        <Table dataSource={reports} columns={columns} rowKey="id" loading={loading}
          locale={{ emptyText: <Empty description="暂无历史汇报" /> }}
          scroll={{ y: 'calc(100vh - 325px)' }} pagination={false} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
          <Pagination current={page} total={total} pageSize={pageSize} showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']} onChange={handleTableChange} size="small" />
          <Typography.Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>�?{total} �?/Typography.Text>
        </div>
      </Card>

      <Modal
        title={previewReport?.title || '汇报预览'}
        open={!!previewReport} onCancel={() => setPreviewReport(null)}
        footer={previewReport && (
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
            <Button onClick={() => handleExport(previewReport.id, 'md')}>导出 MD</Button>
            <Button onClick={() => handleExport(previewReport.id, 'docx')}>导出 Word</Button>
            <Button onClick={() => handleExport(previewReport.id, 'pdf')}>导出 PDF</Button>
            <Button type="primary" onClick={() => setPreviewReport(null)}>关闭</Button>
          </Space>
        )}
        width={800}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>加载中�?/div>
        ) : previewReport?.output_text ? (
          <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '0 8px' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewReport.output_text}</ReactMarkdown>
          </div>
        ) : <Empty description="内容为空" />}
      </Modal>
    </div>
  );
}
