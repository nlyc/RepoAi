// models/Report.js
import { query } from '@/lib/db';

const Report = {
  async create({ user_id, report_type, audience_style, input_snapshot, template_ids = [], status = 'pending', output_text = null, title = null }) {
    const { rows } = await query(
      `INSERT INTO reports (user_id, report_type, audience_style, input_snapshot, template_ids, status, output_text, title)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, report_type, audience_style, JSON.stringify(input_snapshot), template_ids, status, output_text, title]
    );
    return rows[0];
  },

  async updateById(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(id);
    const { rows } = await query(
      `UPDATE reports SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async findOne(id, userId) {
    const { rows } = await query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );
    return rows[0] || null;
  },

  async findUserReports(userId, { page = 1, pageSize = 20, reportType } = {}) {
    const offset = (page - 1) * pageSize;
    const conditions = ["user_id = $1", "status != 'error'"];
    const values = [userId];
    if (reportType) { values.push(reportType); conditions.push(`report_type = $${values.length}`); }
    values.push(pageSize, offset);
    const { rows } = await query(
      `SELECT id, report_type, audience_style, title, status, created_at
       FROM reports WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return rows;
  },

  async countUserReports(userId, reportType) {
    const conditions = ["user_id = $1", "status != 'error'"];
    const values = [userId];
    if (reportType) { values.push(reportType); conditions.push(`report_type = $${values.length}`); }
    const { rows } = await query(
      `SELECT COUNT(*)::int AS total FROM reports WHERE ${conditions.join(' AND ')}`,
      values
    );
    return rows[0].total;
  },

  async deleteOne(id, userId) {
    const { rows } = await query(
      'DELETE FROM reports WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return rows[0] || null;
  },
};

export default Report;
