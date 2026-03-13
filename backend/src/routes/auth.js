// routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET || 'dev_secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

/** POST /api/auth/register */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });
    if (await User.findOne({ email })) return res.status(409).json({ error: '该邮箱已注册' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, nickname: nickname || email.split('@')[0] });
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } });
  } catch (err) { next(err); }
});

/** POST /api/auth/login */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } });
  } catch (err) { next(err); }
});

/** GET /api/auth/me */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
});

module.exports = router;
