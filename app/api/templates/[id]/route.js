// app/api/templates/[id]/route.js - 更新 / 删除模板
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { updateTemplate, deleteTemplate } from '@/services/templateService';

export async function PUT(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const { name, category, content } = await request.json();
    const template = await updateTemplate(params.id, authUser.id, { name, category, content });
    return NextResponse.json(template);
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    await deleteTemplate(params.id, authUser.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
