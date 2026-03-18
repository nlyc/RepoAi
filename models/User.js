// models/User.js
import { query } from '@/lib/db';

const User = {
  async findOne({ email }) {
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email?.toLowerCase()]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, email, nickname, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, password_hash, nickname, role = 'free' }) {
    const { rows } = await query(
      'INSERT INTO users (email, password_hash, nickname, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [email?.toLowerCase(), password_hash, nickname, role]
    );
    return rows[0];
  },

  async findAll({ page = 1, pageSize = 20, search = '' } = {}) {
    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : '%';
    const { rows } = await query(
      `SELECT id, email, nickname, role, created_at, updated_at
       FROM users
       WHERE email ILIKE $1 OR nickname ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchParam, pageSize, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM users WHERE email ILIKE $1 OR nickname ILIKE $1`,
      [searchParam]
    );
    return { users: rows, total: parseInt(countRows[0].count) };
  },

  async updateById(id, { nickname, role }) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (nickname !== undefined) { fields.push(`nickname = $${idx++}`); values.push(nickname); }
    if (role !== undefined)     { fields.push(`role = $${idx++}`);     values.push(role); }
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, nickname, role, created_at, updated_at`,
      values
    );
    return rows[0] || null;
  },

  async updatePasswordById(id, password_hash) {
    const { rows } = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
      [password_hash, id]
    );
    return rows[0] || null;
  },

  async countTodayRegistrations() {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await query(
      `SELECT COUNT(*) FROM users WHERE DATE(created_at) = $1`,
      [today]
    );
    return parseInt(rows[0].count);
  },
};

export default User;
