// services/llmService.js - 大模型调用服务
import OpenAI from 'openai';
import LlmCall from '@/models/LlmCall';

const getLlmClient = () =>
  new OpenAI({
    baseURL: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.LLM_API_KEY || 'sk-placeholder',
  });

const LLM_MODEL = () => process.env.LLM_MODEL || 'deepseek-chat';

export async function generateReport({ systemPrompt, userPrompt, userId, reportId }) {
  const startTime = Date.now();
  let status = 'success', errorMessage = null, promptTokens = 0, completionTokens = 0, result = '';
  const model = LLM_MODEL();

  try {
    const response = await getLlmClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });
    result = response.choices[0]?.message?.content || '';
    promptTokens     = response.usage?.prompt_tokens     || 0;
    completionTokens = response.usage?.completion_tokens || 0;
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    throw new Error(`大模型调用失败: ${err.message}`);
  } finally {
    LlmCall.create({
      report_id: reportId, user_id: userId, model_name: model,
      prompt_tokens: promptTokens, completion_tokens: completionTokens,
      latency_ms: Date.now() - startTime, status, error_message: errorMessage,
    }).catch(e => console.error('[LLM] 记录日志失败:', e.message));
  }

  return result;
}
