// models/QuotaUsage.js - PostgreSQL 版本
const pool = require('../config/db');

const QuotaUsage = {
  async findOne({ user_id, date }) {
    const { rows } = await pool.query(
      'SELECT * FROM quota_usage WHERE user_id = $1 AND date = $2 LIMIT 1',
      [user_id, date]
    );
    return rows[0] || null;
  },

  // 存在则 count+1，不存在则插入 count=1
  async upsertIncrement({ user_id, date }) {
    const { rows } = await pool.query(
      `INSERT INTO quota_usage (user_id, date, count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, date) DO UPDATE SET count = quota_usage.count + 1
       RETURNING *`,
      [user_id, date]
    );
    return rows[0];
  },
};

module.exports = QuotaUsage;
