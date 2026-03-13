// config/llm.js - 大模型客户端配置
// 使用 openai 兼容 SDK，切换模型只需修改环境变量
const OpenAI = require('openai');

// 【修改点】切换其他大模型时，修改以下环境变量：
// DEEPSEEK_BASE_URL - API 基础地址
// DEEPSEEK_API_KEY  - API 密钥
// DEEPSEEK_MODEL    - 模型名称
const llmClient = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey:  process.env.DEEPSEEK_API_KEY  || 'sk-placeholder',
});

const LLM_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-reasoner';

module.exports = { llmClient, LLM_MODEL };
