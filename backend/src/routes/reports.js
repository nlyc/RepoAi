// routes/reports.js
const router = require('express').Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const quotaMiddleware = require('../middleware/quota');
const Report = require('../models/Report');
const { createAndGenerateReport, getUserReports, getReportById } = require('../services/reportService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

router.post('/generate', authMiddleware, quotaMiddleware, upload.array('files', 5), async (req, res, next) => {
  try {
    const { reportType, audienceStyle, inputText, templateIds } = req.body;
    if (!reportType) return res.status(400).json({ error: '请选择汇报类型' });
    const parsedTemplateIds = templateIds ? (Array.isArray(templateIds) ? templateIds : JSON.parse(templateIds)) : [];
    const result = await createAndGenerateReport({
      userId: req.user.id, reportType, audienceStyle: audienceStyle || 'manager',
      inputText: inputText || '', templateIds: parsedTemplateIds, files: req.files || [],
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, reportType } = req.query;
    res.json(await getUserReports(req.user.id, { page: +page, pageSize: +pageSize, reportType }));
  } catch (err) { next(err); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const report = await getReportById(req.params.id, req.user.id);
    if (!report) return res.status(404).json({ error: '汇报不存在' });
    res.json(report);
  } catch (err) { next(err); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const r = await Report.deleteOne(req.params.id, req.user.id);
    if (!r) return res.status(404).json({ error: '汇报不存在' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
