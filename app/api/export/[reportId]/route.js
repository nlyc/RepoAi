// app/api/export/[reportId]/route.js - 导出汇报文件（MD / DOCX / PDF）
export const maxDuration = 30;

import { getAuthUser, unauthorized } from '@/lib/auth';
import { getReportById } from '@/services/reportService';
import { exportMarkdown, exportWord, exportPdf } from '@/services/exportService';

export async function GET(request, { params }) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'md';

    const report = await getReportById(params.reportId, authUser.id);
    if (!report) return Response.json({ error: '汇报不存在' }, { status: 404 });
    if (!report.output_text) return Response.json({ error: '汇报内容为空，无法导出' }, { status: 400 });

    const title = report.title || '工作汇报';
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');

    if (format === 'md') {
      const buf = exportMarkdown(report.output_text);
      return new Response(buf, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.md"`,
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }

    if (format === 'docx') {
      const buf = await exportWord(report.output_text, title);
      return new Response(buf, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.docx"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      });
    }

    if (format === 'pdf') {
      const buf = await exportPdf(report.output_text, title);
      return new Response(buf, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`,
          'Content-Type': 'application/pdf',
        },
      });
    }

    return Response.json({ error: '不支持的导出格式，请使用 md/docx/pdf' }, { status: 400 });
  } catch (err) {
    console.error('[Export]', err);
    return Response.json({ error: '导出失败，请稍后重试' }, { status: 500 });
  }
}
