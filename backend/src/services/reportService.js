// services/reportService.js
const Report = require('../models/Report');
const Template = require('../models/Template');
const QuotaUsage = require('../models/QuotaUsage');
const { buildReportPrompt } = require('../utils/promptBuilder');
const { generateReport } = require('./llmService');
const { mergeFileContents } = require('../utils/fileParser');

const TYPE_LABELS = { weekly: '周报', monthly: '月报', standup: '晨会汇报', review: '述职报告' };

async function createAndGenerateReport({ userId, reportType, audienceStyle, inputText, templateIds = [], files = [] }) {
  const fileText = await mergeFileContents(files);
  const fullInputText = [inputText, fileText].filter(Boolean).join('\n\n');

  // 查询选中模板内容
  const templates = await Template.findByIds(templateIds);
  const templateContents = templates.map(t => t.content);

  // 创建汇报记录
  const report = await Report.create({
    user_id: userId, report_type: reportType, audience_style: audienceStyle,
    input_snapshot: { inputText: fullInputText.slice(0, 2000), fileCount: files.length },
    template_ids: templateIds, status: 'generating',
  });

  // 调用大模型
  const { systemPrompt, userPrompt } = buildReportPrompt({ reportType, audienceStyle, inputText: fullInputText, templateContents });
  let outputText;
  try {
    outputText = await generateReport({ systemPrompt, userPrompt, userId, reportId: report.id });
  } catch (err) {
    await Report.updateById(report.id, { status: 'error' });
    throw err;
  }

  // 提取标题
  const titleMatch = outputText.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1] : `${TYPE_LABELS[reportType] || '汇报'} - ${new Date().toLocaleDateString('zh-CN')}`;

  await Report.updateById(report.id, { output_text: outputText, title, status: 'done' });

  // 更新额度
  const today = new Date().toISOString().slice(0, 10);
  await QuotaUsage.upsertIncrement({ user_id: userId, date: today });

  return { reportId: report.id, title, outputText };
}

async function getUserReports(userId, { page = 1, pageSize = 20, reportType } = {}) {
  const [list, total] = await Promise.all([
    Report.findUserReports(userId, { page, pageSize, reportType }),
    Report.countUserReports(userId, reportType),
  ]);
  return { list, total, page, pageSize };
}

async function getReportById(reportId, userId) {
  return Report.findOne(reportId, userId);
}

module.exports = { createAndGenerateReport, getUserReports, getReportById };
