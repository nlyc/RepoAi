// app/api/admin/users/[id]/history/route.js - 管理员：查看用户操作历史
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  if (authUser.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const page     = parseInt(searchParams.get('page')     || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const offset   = (page - 1) * pageSize;

  try {
    const { rows } = await query(
      `SELECT r.id, r.report_type, r.audience_style, r.title, r.status, r.created_at,
              lc.model_name, lc.prompt_tokens, lc.completion_tokens, lc.latency_ms, lc.status AS llm_status
       FROM reports r
       LEFT JOIN llm_calls lc ON lc.report_id = r.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [params.id, pageSize, offset]
    );
    const { rows: countRows } = await query(
      'SELECT COUNT(*) FROM reports WHERE user_id = $1',
      [params.id]
    );
    return NextResponse.json({ history: rows, total: parseInt(countRows[0].count), page, pageSize });
  } catch (err) {
    console.error('[Admin/History]', err);
    return NextResponse.json({ error: '获取操作历史失败' }, { status: 500 });
  }
}
