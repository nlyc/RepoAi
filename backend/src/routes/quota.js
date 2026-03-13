// routes/quota.js
const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const QuotaUsage = require('../models/QuotaUsage');

const DAILY_QUOTA = parseInt(process.env.DAILY_QUOTA_FREE) || 10;

router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const record = await QuotaUsage.findOne({ user_id: req.user.id, date: today });
    const used = record?.count || 0;
    res.json({
      used, limit: DAILY_QUOTA, remaining: Math.max(0, DAILY_QUOTA - used),
      resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    });
  } catch (err) { next(err); }
});

module.exports = router;
