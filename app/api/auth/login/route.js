// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } });
  } catch (err) {
    console.error('[Auth/Login]', err);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
