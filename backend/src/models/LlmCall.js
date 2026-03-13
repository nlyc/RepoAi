// models/LlmCall.js - PostgreSQL 版本
const pool = require('../config/db');

const LlmCall = {
  async create({ report_id, user_id, model_name = 'deepseek-reasoner', prompt_tokens = 0, completion_tokens = 0, latency_ms = 0, status = 'success', error_message = null }) {
    const { rows } = await pool.query(
      `INSERT INTO llm_calls (report_id, user_id, model_name, prompt_tokens, completion_tokens, latency_ms, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [report_id, user_id, model_name, prompt_tokens, completion_tokens, latency_ms, status, error_message]
    );
    return rows[0];
  },
};

module.exports = LlmCall;
