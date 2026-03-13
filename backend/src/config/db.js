// config/db.js - PostgreSQL 连接池
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'repoai',
  user:     process.env.DB_USER     || 'repoai',
  password: process.env.DB_PASSWORD || 'repoai_password',
});

pool.connect()
  .then(client => {
    client.release();
    console.log('[DB] PostgreSQL 连接成功');
  })
  .catch(err => {
    console.error('[DB] PostgreSQL 连接失败:', err.message);
    process.exit(1);
  });

module.exports = pool;
