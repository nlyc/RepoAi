// app/api/templates/import/route.js - 批量导入模板
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { bulkImportTemplates } from '@/services/templateService';

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const { templates } = await request.json();
    if (!Array.isArray(templates) || !templates.length) {
      return NextResponse.json({ error: '请提供模板数组' }, { status: 400 });
    }
    const inserted = await bulkImportTemplates(authUser.id, templates);
    return NextResponse.json({ imported: inserted.length, templates: inserted });
  } catch (err) {
    console.error('[Templates/Import]', err);
    return NextResponse.json({ error: '导入失败' }, { status: 500 });
  }
}
