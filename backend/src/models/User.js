// models/User.js - PostgreSQL 版本
const pool = require('../config/db');

const User = {
  async findOne({ email }) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email?.toLowerCase()]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, nickname, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, password_hash, nickname, role = 'free' }) {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, nickname, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [email?.toLowerCase(), password_hash, nickname, role]
    );
    return rows[0];
  },
};

module.exports = User;
