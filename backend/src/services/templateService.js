// services/templateService.js
const Template = require('../models/Template');

async function getTemplates(userId, category) {
  return Template.find({ userId, category });
}

async function createTemplate(userId, { name, category, content }) {
  return Template.create({ user_id: userId, name, category: category || 'general', content });
}

async function updateTemplate(templateId, userId, { name, category, content }) {
  const t = await Template.findOneAndUpdate(templateId, userId, { name, category, content });
  if (!t) throw Object.assign(new Error('模板不存在或无权限修改'), { status: 404 });
  return t;
}

async function deleteTemplate(templateId, userId) {
  const t = await Template.findOneAndDelete(templateId, userId);
  if (!t) throw Object.assign(new Error('模板不存在或无权限删除'), { status: 404 });
}

async function bulkImportTemplates(userId, templates) {
  const docs = templates.map(t => ({ user_id: userId, name: t.name, category: t.category || 'general', content: t.content }));
  return Template.insertMany(docs);
}

async function exportTemplates(userId) {
  return Template.findUserTemplates(userId);
}

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate, bulkImportTemplates, exportTemplates };
