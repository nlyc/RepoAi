// routes/export.js - 导出路由
const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getReportById } = require('../services/reportService');
const { exportMarkdown, exportWord, exportPdf } = require('../services/exportService');

/** POST /api/export/:reportId - 导出汇报
 * Query: format=md|docx|pdf
 */
router.get('/:reportId', authMiddleware, async (req, res, next) => {
  try {
    const { format = 'md' } = req.query;
    const report = await getReportById(req.params.reportId, req.user.id);
    if (!report) return res.status(404).json({ error: '汇报不存在' });
    if (!report.output_text) return res.status(400).json({ error: '汇报内容为空，无法导出' });

    const title = report.title || '工作汇报';
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');

    if (format === 'md') {
      const buf = exportMarkdown(report.output_text);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.md"`);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.send(buf);
    }

    if (format === 'docx') {
      const buf = await exportWord(report.output_text, title);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.docx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      return res.send(buf);
    }

    if (format === 'pdf') {
      const buf = await exportPdf(report.output_text, title);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(buf);
    }

    res.status(400).json({ error: '不支持的导出格式，请使用 md/docx/pdf' });
  } catch (err) { next(err); }
});

module.exports = router;
