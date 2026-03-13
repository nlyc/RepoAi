// models/Template.js - PostgreSQL 版本
const pool = require('../config/db');

const Template = {
  // 查询内置模板 + 用户模板（可按 category 过滤）
  async find({ userId, category } = {}) {
    const params = [userId];
    let where = 'WHERE (is_builtin = true OR user_id = $1)';
    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }
    const { rows } = await pool.query(
      `SELECT * FROM templates ${where} ORDER BY is_builtin DESC, sort_order ASC, created_at DESC`,
      params
    );
    return rows;
  },

  // 按 id 列表查询（用于生成报告时获取模板内容）
  async findByIds(ids) {
    if (!ids || !ids.length) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT id, content FROM templates WHERE id IN (${placeholders})`,
      ids
    );
    return rows;
  },

  async create({ user_id = null, name, category = 'general', content, is_builtin = false, sort_order = 0 }) {
    const { rows } = await pool.query(
      `INSERT INTO templates (user_id, name, category, content, is_builtin, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, name, category, content, is_builtin, sort_order]
    );
    return rows[0];
  },

  // 更新用户自定义模板（不可修改内置模板）
  async findOneAndUpdate(id, userId, { name, category, content }) {
    const { rows } = await pool.query(
      `UPDATE templates SET name = $1, category = $2, content = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5 AND is_builtin = false RETURNING *`,
      [name, category, content, id, userId]
    );
    return rows[0] || null;
  },

  // 删除用户自定义模板
  async findOneAndDelete(id, userId) {
    const { rows } = await pool.query(
      'DELETE FROM templates WHERE id = $1 AND user_id = $2 AND is_builtin = false RETURNING id',
      [id, userId]
    );
    return rows[0] || null;
  },

  // 删除所有内置模板（用于 seed 重建）
  async deleteBuiltin() {
    await pool.query('DELETE FROM templates WHERE is_builtin = true');
  },

  // 批量插入
  async insertMany(docs) {
    const results = [];
    for (const d of docs) {
      const r = await Template.create(d);
      results.push(r);
    }
    return results;
  },

  // 导出用户自定义模板
  async findUserTemplates(userId) {
    const { rows } = await pool.query(
      'SELECT id, name, category, content FROM templates WHERE user_id = $1 AND is_builtin = false',
      [userId]
    );
    return rows;
  },
};

module.exports = Template;
