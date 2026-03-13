// routes/templates.js - 话术模板路由
const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const svc = require('../services/templateService');

/** GET /api/templates - 获取模板列表 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { category } = req.query;
    const templates = await svc.getTemplates(req.user.id, category);
    res.json(templates);
  } catch (err) { next(err); }
});

/** POST /api/templates - 创建自定义模板 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, category, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: '模板名称和内容不能为空' });
    const template = await svc.createTemplate(req.user.id, { name, category: category || 'general', content });
    res.status(201).json(template);
  } catch (err) { next(err); }
});

/** PUT /api/templates/:id - 更新模板 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { name, category, content } = req.body;
    const template = await svc.updateTemplate(req.params.id, req.user.id, { name, category, content });
    res.json(template);
  } catch (err) { next(err); }
});

/** DELETE /api/templates/:id - 删除模板 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await svc.deleteTemplate(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

/** POST /api/templates/import - 批量导入（JSON 数组） */
router.post('/import', authMiddleware, async (req, res, next) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates) || !templates.length) {
      return res.status(400).json({ error: '请提供模板数组' });
    }
    const inserted = await svc.bulkImportTemplates(req.user.id, templates);
    res.json({ imported: inserted.length, templates: inserted });
  } catch (err) { next(err); }
});

/** GET /api/templates/export - 导出用户模板 */
router.get('/export', authMiddleware, async (req, res, next) => {
  try {
    const templates = await svc.exportTemplates(req.user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="templates.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(templates, null, 2));
  } catch (err) { next(err); }
});

module.exports = router;
