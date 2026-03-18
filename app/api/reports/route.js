// app/api/reports/route.js - 获取历史汇报列表
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getUserReports } from '@/services/reportService';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const reportType = searchParams.get('reportType') || undefined;
    const data = await getUserReports(authUser.id, { page, pageSize, reportType });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[Reports/List]', err);
    return NextResponse.json({ error: '获取历史汇报失败' }, { status: 500 });
  }
}
