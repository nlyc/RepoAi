// app/api/admin/users/[id]/reset-password/route.js - 管理员：重置用户密码
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import User from '@/models/User';

// 不允许重置密码的演示账号
const PROTECTED_EMAILS = ['admin@repoai.com', 'demo@repoai.com'];
const ADMIN_RESET_KEY = process.env.ADMIN_RESET_KEY;

export async function POST(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (authUser.role !== 'admin') return forbidden();

  try {
    const { newPassword, adminKey } = await request.json();

    if (!ADMIN_RESET_KEY || adminKey !== ADMIN_RESET_KEY) {
      return NextResponse.json({ error: '管理员 KEY 不正确' }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
    }

    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    if (PROTECTED_EMAILS.includes(target.email)) {
      return NextResponse.json({ error: '演示账号密码不可重置' }, { status: 403 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.updatePasswordById(params.id, password_hash);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin/ResetPassword]', err);
    return NextResponse.json({ error: '重置密码失败' }, { status: 500 });
  }
}
