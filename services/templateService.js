// services/templateService.js
import Template from '@/models/Template';

export async function getTemplates(userId, category) {
  return Template.find({ userId, category });
}

export async function createTemplate(userId, { name, category, content }) {
  return Template.create({ user_id: userId, name, category: category || 'general', content });
}

export async function updateTemplate(templateId, userId, { name, category, content }) {
  const t = await Template.findOneAndUpdate(templateId, userId, { name, category, content });
  if (!t) throw Object.assign(new Error('模板不存在或无权限修改'), { status: 404 });
  return t;
}

export async function deleteTemplate(templateId, userId) {
  const t = await Template.findOneAndDelete(templateId, userId);
  if (!t) throw Object.assign(new Error('模板不存在或无权限删除'), { status: 404 });
}

export async function bulkImportTemplates(userId, templates) {
  const docs = templates.map(t => ({ user_id: userId, name: t.name, category: t.category || 'general', content: t.content }));
  return Template.insertMany(docs);
}

export async function exportTemplates(userId) {
  return Template.findUserTemplates(userId);
}
