// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

const DAILY_REG_LIMIT = parseInt(process.env.DAILY_REG_LIMIT || '10');

export async function POST(request) {
  try {
    const { email, password, nickname } = await request.json();
    if (!email || !password) return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    if (await User.findOne({ email })) return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });

    // 每日注册人数限制
    const todayCount = await User.countTodayRegistrations();
    if (todayCount >= DAILY_REG_LIMIT) {
      return NextResponse.json({ error: '今日注册人数已达上限，请明日再试' }, { status: 429 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, nickname: nickname || email.split('@')[0] });
    const token = await signToken({ id: user.id, email: user.email, role: user.role });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } });
  } catch (err) {
    console.error('[Auth/Register]', err);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
