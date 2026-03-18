// app/api/templates/export/route.js - 导出用户自定义模板
import { getAuthUser, unauthorized } from '@/lib/auth';
import { exportTemplates } from '@/services/templateService';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const templates = await exportTemplates(authUser.id);
    const json = JSON.stringify(templates, null, 2);
    return new Response(json, {
      headers: {
        'Content-Disposition': 'attachment; filename="templates.json"',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('[Templates/Export]', err);
    return Response.json({ error: '导出失败' }, { status: 500 });
  }
}
