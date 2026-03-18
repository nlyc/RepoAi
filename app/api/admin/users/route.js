// app/api/admin/users/route.js - 管理员：获取用户列表
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (authUser.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const page     = parseInt(searchParams.get('page')     || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search   = searchParams.get('search') || '';

  try {
    const { users, total } = await User.findAll({ page, pageSize, search });
    return NextResponse.json({ users, total, page, pageSize });
  } catch (err) {
    console.error('[Admin/Users]', err);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}
