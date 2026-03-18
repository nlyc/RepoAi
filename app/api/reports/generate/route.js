// app/api/reports/generate/route.js - 生成汇报
// maxDuration 设为 60s，使用 deepseek-chat 可在此时限内完成
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import QuotaUsage from '@/models/QuotaUsage';
import { createAndGenerateReport } from '@/services/reportService';

const DAILY_QUOTA = parseInt(process.env.DAILY_QUOTA_FREE || '3');

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  // 检查额度
  const today = new Date().toISOString().slice(0, 10);
  try {
    const record = await QuotaUsage.findOne({ user_id: authUser.id, date: today });
    const used = record?.count || 0;
    if (used >= DAILY_QUOTA) {
      return NextResponse.json(
        { error: `今日汇报生成次数已达上限（${DAILY_QUOTA}次），明日再来`, used, limit: DAILY_QUOTA },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error('[Reports/Quota]', err);
  }

  try {
    const formData = await request.formData();
    const reportType   = formData.get('reportType');
    const audienceStyle = formData.get('audienceStyle') || 'manager';
    const inputText    = formData.get('inputText') || '';
    const templateIdsRaw = formData.get('templateIds') || '[]';
    const templateIds  = JSON.parse(templateIdsRaw);
    // 过滤掉空 File 占位符
    const files = formData.getAll('files').filter(f => f instanceof File && f.size > 0);

    if (!reportType) return NextResponse.json({ error: '请选择汇报类型' }, { status: 400 });

    const result = await createAndGenerateReport({
      userId: authUser.id, reportType, audienceStyle, inputText, templateIds, files,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[Reports/Generate]', err);
    return NextResponse.json({ error: err.message || '生成失败，请稍后重试' }, { status: 500 });
  }
}
