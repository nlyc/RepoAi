// ============================================================
// app.js - Express 应用入口
// ============================================================
require('dotenv').config();
require('./config/db'); // 初始化 PostgreSQL 连接
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ---- 安全中间件 ----
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ---- 全局限流（防止暴力攻击）----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api/', globalLimiter);

// ---- 基础中间件 ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ---- 路由注册 ----
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/export',    require('./routes/export'));
app.use('/api/quota',     require('./routes/quota'));

// ---- 健康检查 ----
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ---- 全局错误处理 ----
app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RepoAI 后端服务启动，端口: ${PORT}`);
});

module.exports = app;
