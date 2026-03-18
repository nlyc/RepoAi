// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const user = await User.findById(authUser.id);
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error('[Auth/Me]', err);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}
