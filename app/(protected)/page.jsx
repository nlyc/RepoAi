'use client';
// app/(protected)/page.jsx - 主工作区（汇报生成）
import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Select, Button, Input, Upload, Checkbox, App, Spin, Empty, Space, Tag } from 'antd';
import { InboxOutlined, ThunderboltFilled, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateReport, exportReport } from '@/api/reports';
import { getTemplates } from '@/api/templates';
import { getQuotaStatus } from '@/api/quota';
import useAppStore from '@/store/useAppStore';

const { Dragger } = Upload;
const { TextArea } = Input;

const REPORT_TYPES = [
  { value: 'weekly',  label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'standup', label: '晨会/站会' },
  { value: 'review',  label: '述职报告' },
];

const AUDIENCE_STYLES = [
  { value: 'manager',   label: '直属上级' },
  { value: 'executive', label: '高层领导' },
  { value: 'peer',      label: '同级同事' },
  { value: 'hr',        label: 'HR' },
];

const categoryLabels = { weekly: '周报', monthly: '月报', standup: '晨会', review: '述职', general: '通用' };

export default function MainPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const { currentReport, setCurrentReport, setQuota } = useAppStore();
  const { message } = App.useApp();

  useEffect(() => {
    getTemplates().then(setTemplates).catch(() => {});
  }, []);

  const handleGenerate = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reportType', values.reportType);
      formData.append('audienceStyle', values.audienceStyle || 'manager');
      formData.append('inputText', values.inputText || '');
      formData.append('templateIds', JSON.stringify(selectedTemplates));
      fileList.forEach(f => formData.append('files', f.originFileObj));

      const result = await generateReport(formData);
      setCurrentReport(result);
      getQuotaStatus().then(setQuota).catch(() => {});
      message.success('汇报生成成功');
    } catch (err) {
      message.error(err.error || '生成失败，请检查 API Key 配置');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentReport.outputText);
    message.success('已复制到剪贴板');
  };

  const handleExport = async (format) => {
    try {
      await exportReport(currentReport.reportId, format);
    } catch {
      message.error('导出失败');
    }
  };

  const templateGroups = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <Row gutter={16} style={{ height: '100%' }}>
      <Col span={10} style={{ height: '100%' }}>
        <Card
          title="输入工作内容"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px' } }}
        >
          <Form form={form} layout="vertical" onFinish={handleGenerate}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="reportType" label="汇报类型" rules={[{ required: true, message: '请选择' }]}>
                  <Select options={REPORT_TYPES} placeholder="选择类型" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="audienceStyle" label="汇报对象" initialValue="manager">
                  <Select options={AUDIENCE_STYLES} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="上传工作记录（可选）">
              <Dragger
                multiple fileList={fileList} beforeUpload={() => false}
                onChange={({ fileList }) => setFileList(fileList)}
                accept=".txt,.md,.json,.docx"
                style={{ padding: '8px 0' }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p style={{ margin: 0 }}>拖拽或点击上传工作记录</p>
                <p style={{ color: '#999', fontSize: 12 }}>支持 txt / md / json / docx，最多5个文件</p>
              </Dragger>
            </Form.Item>

            <Form.Item name="inputText" label="或直接粘贴工作内容">
              <TextArea rows={5} placeholder="粘贴聊天记录、任务清单、工作笔记等..." showCount maxLength={3000} />
            </Form.Item>

            <Form.Item label="选择话术模板（可多选）">
              {Object.entries(templateGroups).map(([cat, items]) => {
                const catIds = items.map(t => t.id);
                const catSelected = selectedTemplates.filter(id => catIds.includes(id));
                return (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <Tag color="blue" style={{ marginBottom: 6 }}>{categoryLabels[cat] || cat}</Tag>
                    <Checkbox.Group
                      value={catSelected}
                      onChange={(checked) => setSelectedTemplates(prev => [...prev.filter(id => !catIds.includes(id)), ...checked])}
                      style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
                    >
                      {items.map(t => (
                        <Checkbox key={t.id} value={t.id} style={{ marginLeft: 0 }}>
                          <span style={{ fontSize: 12 }}>{t.name}</span>
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </div>
                );
              })}
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<ThunderboltFilled />}>
                {loading ? '生成中...' : '一键生成汇报'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col span={14} style={{ height: '100%' }}>
        <Card
          title={currentReport?.title || '汇报预览'}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { flex: 1, minHeight: 0, overflowY: 'auto' } }}
          extra={
            currentReport && (
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('md')}>MD</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('docx')}>Word</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('pdf')}>PDF</Button>
              </Space>
            )
          }
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <Spin size="large" tip="AI 正在生成汇报..." />
            </div>
          ) : currentReport ? (
            <div style={{ padding: '0 8px' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentReport.outputText}</ReactMarkdown>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="填写工作内容后点击生成" style={{ marginTop: 80 }} />
          )}
        </Card>
      </Col>
    </Row>
  );
}
