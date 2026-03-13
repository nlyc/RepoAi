// middleware/quota.js
const QuotaUsage = require('../models/QuotaUsage');

const DAILY_QUOTA = parseInt(process.env.DAILY_QUOTA_FREE) || 10;

module.exports = async function quotaMiddleware(req, res, next) {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const record = await QuotaUsage.findOne({ user_id: userId, date: today });
    const used = record?.count || 0;
    if (used >= DAILY_QUOTA) {
      return res.status(429).json({
        error: `今日汇报生成次数已达上限（${DAILY_QUOTA}次），明日再来`,
        used, limit: DAILY_QUOTA,
      });
    }
    req.quotaUsed = used;
    next();
  } catch (err) {
    console.error('[Quota] 额度检查失败:', err.message);
    next();
  }
};
