// app/api/templates/route.js - 获取模板列表 / 创建模板
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getTemplates, createTemplate } from '@/services/templateService';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const templates = await getTemplates(authUser.id, category);
    return NextResponse.json(templates);
  } catch (err) {
    console.error('[Templates/List]', err);
    return NextResponse.json({ error: '获取模板失败' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();
  try {
    const { name, category, content } = await request.json();
    if (!name || !content) return NextResponse.json({ error: '模板名称和内容不能为空' }, { status: 400 });
    const template = await createTemplate(authUser.id, { name, category: category || 'general', content });
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error('[Templates/Create]', err);
    return NextResponse.json({ error: '创建模板失败' }, { status: 500 });
  }
}
