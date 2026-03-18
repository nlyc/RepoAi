// lib/db.js - PostgreSQL 连接池（兼容本地 pg 和 Neon Serverless）
import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      // Neon / 生产环境启用 SSL
      ssl: connectionString?.includes('neon.tech') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}
