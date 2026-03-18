// app/api/user/password/route.js - 用户修改自己的密码
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthUser, unauthorized } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请填写当前密码和新密码' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
    }

    // 查询含 password_hash 的完整记录
    const user = await User.findOne({ email: authUser.email });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: '当前密码不正确' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await User.updatePasswordById(user.id, password_hash);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[User/Password]', err);
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
  }
}
