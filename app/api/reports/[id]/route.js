// app/api/reports/[id]/route.js - 获取单条 / 删除汇报
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getReportById } from '@/services/reportService';
import Report from '@/models/Report';

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const report = await getReportById(params.id, authUser.id);
    if (!report) return NextResponse.json({ error: '汇报不存在' }, { status: 404 });
    return NextResponse.json(report);
  } catch (err) {
    console.error('[Reports/Get]', err);
    return NextResponse.json({ error: '获取汇报失败' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const result = await Report.deleteOne(params.id, authUser.id);
    if (!result) return NextResponse.json({ error: '汇报不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Reports/Delete]', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
