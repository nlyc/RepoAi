// utils/promptBuilder.js - 构建大模型提示词
// 【修改点】在此调整各汇报类型的 Prompt 结构

const REPORT_TYPE_LABELS = {
  weekly:   '周报',
  monthly:  '月报',
  standup:  '晨会/站会汇报',
  review:   '述职报告',
};

const AUDIENCE_STYLE_PROMPTS = {
  manager:   '汇报对象是直属上级，语气专业务实，重点突出工作成果和问题解决',
  executive: '汇报对象是高层领导，语言简洁精炼，突出战略价值和关键数据',
  peer:      '汇报对象是同级同事，语气轻松协作，重点说明进展和协作需求',
  hr:        '汇报对象是HR，语言规范正式，突出个人成长和团队贡献',
};

const REPORT_FORMAT_GUIDES = {
  weekly: `请按以下结构生成周报：
## 本周工作总结
（列举本周完成的主要工作，每项用数字编号，尽量量化成果）

## 下周工作计划
（列举下周重点工作计划，每项用数字编号）

## 问题与风险
（列举遇到的问题、风险或需要协调的事项，如无则写"本周无明显问题"）`,

  monthly: `请按以下结构生成月报：
## 本月工作总结
（分类列举本月完成的重点工作，突出成果和数据）

## 关键指标完成情况
（列举可量化的指标完成情况）

## 亮点与创新
（本月工作亮点或创新点）

## 存在的不足与改进
（客观分析不足，提出改进措施）

## 下月工作计划
（下月重点工作安排）`,

  standup: `请按以下简洁结构生成晨会汇报（每项不超过3条，语言简短）：
**昨日完成**
- （完成事项）

**今日计划**
- （计划事项）

**阻塞/需要协助**
- （如无则写"无"）`,

  review: `请按以下结构生成述职报告：
## 一、岗位职责履行情况
（描述本岗位核心职责及履行情况）

## 二、重点工作业绩
（用 STAR 法则描述 2-3 个重点工作：背景-行动-结果）

## 三、个人成长与能力提升
（本考核期内的成长和能力提升）

## 四、不足与改进计划
（客观分析不足，提出具体改进措施）

## 五、下一阶段工作规划
（未来工作目标和发展规划）`,
};

/**
 * 构建汇报生成的完整 Prompt
 * @param {Object} params
 * @param {string} params.reportType - weekly/monthly/standup/review
 * @param {string} params.audienceStyle - manager/executive/peer/hr
 * @param {string} params.inputText - 用户输入的原始工作记录
 * @param {string[]} params.templateContents - 选中的话术模板内容列表
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildReportPrompt({ reportType, audienceStyle, inputText, templateContents = [] }) {
  const typeLabel = REPORT_TYPE_LABELS[reportType] || '工作汇报';
  const audienceGuide = AUDIENCE_STYLE_PROMPTS[audienceStyle] || AUDIENCE_STYLE_PROMPTS.manager;
  const formatGuide = REPORT_FORMAT_GUIDES[reportType] || REPORT_FORMAT_GUIDES.weekly;

  const systemPrompt = `你是一位专业的职场写作助手，擅长将零散的工作记录整理成结构清晰、表达专业的工作汇报。
${audienceGuide}。
输出格式使用 Markdown，语言为中文，避免空洞套话，尽量保留具体数据和细节。`;

  let userPrompt = `请根据以下工作记录，生成一份${typeLabel}。\n\n`;

  userPrompt += `【原始工作记录】\n${inputText || '（用户未提供具体内容，请根据模板生成示例）'}\n\n`;

  if (templateContents.length > 0) {
    userPrompt += `【参考话术模板】\n以下是用户选择的话术模板，请在生成时参考这些表达方式：\n`;
    templateContents.forEach((t, i) => {
      userPrompt += `模板${i + 1}：\n${t}\n\n`;
    });
  }

  userPrompt += `【输出格式要求】\n${formatGuide}`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildReportPrompt };
