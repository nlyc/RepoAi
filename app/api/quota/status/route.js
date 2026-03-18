// app/api/quota/status/route.js - 查询今日额度
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import QuotaUsage from '@/models/QuotaUsage';

const DAILY_QUOTA = parseInt(process.env.DAILY_QUOTA_FREE || '3');

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const record = await QuotaUsage.findOne({ user_id: authUser.id, date: today });
    const used = record?.count || 0;
    return NextResponse.json({
      used,
      limit: DAILY_QUOTA,
      remaining: Math.max(0, DAILY_QUOTA - used),
      resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    });
  } catch (err) {
    console.error('[Quota]', err);
    return NextResponse.json({ error: '获取额度失败' }, { status: 500 });
  }
}
