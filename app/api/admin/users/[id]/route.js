// app/api/admin/users/[id]/route.js - 管理员：查看/修改单个用户
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import User from '@/models/User';

const PROTECTED_EMAILS = ['admin@repoai.com', 'demo@repoai.com'];
const ADMIN_RESET_KEY = () => process.env.ADMIN_RESET_KEY;

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (authUser.role !== 'admin') return forbidden();

  try {
    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[Admin/Users/GET]', err);
    return NextResponse.json({ error: '获取用户失败' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (authUser.role !== 'admin') return forbidden();

  try {
    const { nickname, role, adminKey } = await request.json();

    const key = ADMIN_RESET_KEY();
    if (!key || adminKey !== key) {
      return NextResponse.json({ error: '管理员 KEY 不正确' }, { status: 403 });
    }

    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    if (PROTECTED_EMAILS.includes(target.email)) {
      return NextResponse.json({ error: '系统内置账号，不允许修改' }, { status: 403 });
    }

    const user = await User.updateById(params.id, { nickname, role });
    return NextResponse.json({ user });
  } catch (err) {
    console.error('[Admin/Users/PATCH]', err);
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
}
