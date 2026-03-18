// services/reportService.js
import Report from '@/models/Report';
import Template from '@/models/Template';
import QuotaUsage from '@/models/QuotaUsage';
import { generateReport } from './llmService';
import { mergeFileContents } from './fileParser';

const TYPE_LABELS = { weekly: '周报', monthly: '月报', standup: '晨会汇报', review: '述职报告' };

// ── Prompt 构建（内联自原 utils/promptBuilder.js）──────────────────────────
const AUDIENCE_STYLE_PROMPTS = {
  manager:   '汇报对象是直属上级，语气专业务实，重点突出工作成果和问题解决',
  executive: '汇报对象是高层领导，语言简洁精炼，突出战略价值和关键数据',
  peer:      '汇报对象是同级同事，语气轻松协作，重点说明进展和协作需求',
  hr:        '汇报对象是HR，语言规范正式，突出个人成长和团队贡献',
};
const REPORT_FORMAT_GUIDES = {
  weekly:  `请按以下结构生成周报：\n## 本周工作总结\n（列举本周完成的主要工作，每项用数字编号，尽量量化成果）\n\n## 下周工作计划\n（列举下周重点工作计划，每项用数字编号）\n\n## 问题与风险\n（列举遇到的问题、风险或需要协调的事项，如无则写"本周无明显问题"）`,
  monthly: `请按以下结构生成月报：\n## 本月工作总结\n（分类列举本月完成的重点工作，突出成果和数据）\n\n## 关键指标完成情况\n（列举可量化的指标完成情况）\n\n## 亮点与创新\n（本月工作亮点或创新点）\n\n## 存在的不足与改进\n（客观分析不足，提出改进措施）\n\n## 下月工作计划\n（下月重点工作安排）`,
  standup: `请按以下简洁结构生成晨会汇报（每项不超过3条，语言简短）：\n**昨日完成**\n- （完成事项）\n\n**今日计划**\n- （计划事项）\n\n**阻塞/需要协助**\n- （如无则写"无"）`,
  review:  `请按以下结构生成述职报告：\n## 一、岗位职责履行情况\n（描述本岗位核心职责及履行情况）\n\n## 二、重点工作业绩\n（用 STAR 法则描述 2-3 个重点工作：背景-行动-结果）\n\n## 三、个人成长与能力提升\n（本考核期内的成长和能力提升）\n\n## 四、不足与改进计划\n（客观分析不足，提出具体改进措施）\n\n## 五、下一阶段工作规划\n（未来工作目标和发展规划）`,
};
function buildReportPrompt({ reportType, audienceStyle, inputText, templateContents = [] }) {
  const typeLabel      = TYPE_LABELS[reportType] || '工作汇报';
  const audienceGuide  = AUDIENCE_STYLE_PROMPTS[audienceStyle] || AUDIENCE_STYLE_PROMPTS.manager;
  const formatGuide    = REPORT_FORMAT_GUIDES[reportType] || REPORT_FORMAT_GUIDES.weekly;
  const systemPrompt   = `你是一位专业的职场写作助手，擅长将零散的工作记录整理成结构清晰、表达专业的工作汇报。\n${audienceGuide}。\n输出格式使用 Markdown，语言为中文，避免空洞套话，尽量保留具体数据和细节。`;
  let userPrompt = `请根据以下工作记录，生成一份${typeLabel}。\n\n【原始工作记录】\n${inputText || '（用户未提供具体内容，请根据模板生成示例）'}\n\n`;
  if (templateContents.length > 0) {
    userPrompt += `【参考话术模板】\n以下是用户选择的话术模板，请在生成时参考这些表达方式：\n`;
    templateContents.forEach((t, i) => { userPrompt += `模板${i + 1}：\n${t}\n\n`; });
  }
  userPrompt += `【输出格式要求】\n${formatGuide}`;
  return { systemPrompt, userPrompt };
}
// ──────────────────────────────────────────────────────────────────────────────

export async function createAndGenerateReport({ userId, reportType, audienceStyle, inputText, templateIds = [], files = [] }) {
  const fileText = await mergeFileContents(files);
  const fullInputText = [inputText, fileText].filter(Boolean).join('\n\n');

  const templates = await Template.findByIds(templateIds);
  const templateContents = templates.map(t => t.content);

  const report = await Report.create({
    user_id: userId, report_type: reportType, audience_style: audienceStyle,
    input_snapshot: { inputText: fullInputText.slice(0, 2000), fileCount: files.length },
    template_ids: templateIds, status: 'generating',
  });

  const { systemPrompt, userPrompt } = buildReportPrompt({ reportType, audienceStyle, inputText: fullInputText, templateContents });
  let outputText;
  try {
    outputText = await generateReport({ systemPrompt, userPrompt, userId, reportId: report.id });
  } catch (err) {
    await Report.updateById(report.id, { status: 'error' });
    throw err;
  }

  const titleMatch = outputText.match(/^#\s+(.+)/m);
  const title = titleMatch
    ? titleMatch[1]
    : `${TYPE_LABELS[reportType] || '汇报'} - ${new Date().toLocaleDateString('zh-CN')}`;

  await Report.updateById(report.id, { output_text: outputText, title, status: 'done' });

  const today = new Date().toISOString().slice(0, 10);
  await QuotaUsage.upsertIncrement({ user_id: userId, date: today });

  return { reportId: report.id, title, outputText };
}

export async function getUserReports(userId, { page = 1, pageSize = 20, reportType } = {}) {
  const [list, total] = await Promise.all([
    Report.findUserReports(userId, { page, pageSize, reportType }),
    Report.countUserReports(userId, reportType),
  ]);
  return { list, total, page, pageSize };
}

export async function getReportById(reportId, userId) {
  return Report.findOne(reportId, userId);
}
