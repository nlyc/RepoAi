// services/exportService.js - 导出服务（Markdown/Word/PDF）
const { Document, Paragraph, TextRun, HeadingLevel, Packer, LevelFormat, AlignmentType } = require('docx');
const PDFDocument = require('pdfkit');
const { marked } = require('marked');
const path = require('path');
const fs = require('fs');

/**
 * 导出为 Markdown（直接返回文本）
 */
function exportMarkdown(outputText) {
  return Buffer.from(outputText, 'utf-8');
}

/**
 * 解析 Markdown 为 docx Paragraph 列表
 */
function markdownToDocxParagraphs(mdText) {
  const paragraphs = [];
  const lines = mdText.split('\n');

  for (const line of lines) {
    if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: line.slice(4),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 180, after: 60 },
      }));
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: line.slice(3),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: line.slice(2),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 180 },
      }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      paragraphs.push(new Paragraph({
        text: line.slice(2),
        bullet: { level: 0 },
      }));
    } else if (/^\d+\.\s/.test(line)) {
      // 有序列表：用带序号前缀的普通段落，避免依赖 numbering config
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line })],
        indent: { left: 360 },
        spacing: { before: 40, after: 40 },
      }));
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.slice(2, -2), bold: true })],
      }));
    } else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    } else {
      // 处理行内加粗
      const parts = line.split(/\*\*(.+?)\*\*/);
      if (parts.length > 1) {
        const runs = parts.map((part, i) =>
          new TextRun({ text: part, bold: i % 2 === 1 })
        );
        paragraphs.push(new Paragraph({ children: runs }));
      } else {
        paragraphs.push(new Paragraph({ text: line }));
      }
    }
  }
  return paragraphs;
}

/**
 * 导出为 Word (.docx)
 */
async function exportWord(outputText, title = '工作汇报') {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        }),
        ...markdownToDocxParagraphs(outputText),
      ],
    }],
  });
  return await Packer.toBuffer(doc);
}

/**
 * 将 Markdown 文本解析成结构化行，供 PDFKit 逐行渲染
 */
function parseMdLines(mdText) {
  return mdText.split('\n').map(line => {
    if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4) };
    if (line.startsWith('## '))  return { type: 'h2', text: line.slice(3) };
    if (line.startsWith('# '))   return { type: 'h1', text: line.slice(2) };
    if (line.startsWith('- ') || line.startsWith('* ')) return { type: 'bullet', text: line.slice(2) };
    if (/^\d+\.\s/.test(line))   return { type: 'ordered', text: line };
    if (line.trim() === '')       return { type: 'blank' };
    return { type: 'body', text: line.replace(/\*\*(.+?)\*\*/g, '$1') };
  });
}

/**
 * 导出为 PDF（使用 pdfkit 纯 JS 渲染，无需 Chrome）
 */
async function exportPdf(outputText, title = '工作汇报') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, autoFirstPage: true });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // 优先从 TTC 中提取包含 Latin+数字+中文 的完整子字体
    // NotoSansCJK-Regular.ttc 中的 SC 子字体同时覆盖 ASCII 和汉字
    const fontCandidates = [
      { path: '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', ps: 'NotoSansCJKsc-Regular' },
      { path: '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', ps: 'NotoSansCJKjp-Regular' },
      { path: '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf', ps: null },
    ];
    let fontLoaded = false;
    for (const { path: fp, ps } of fontCandidates) {
      if (fs.existsSync(fp)) {
        try {
          ps ? doc.registerFont('CJK', fp, ps) : doc.registerFont('CJK', fp);
          fontLoaded = true;
          break;
        } catch (_) {}
      }
    }
    const fontName = fontLoaded ? 'CJK' : 'Helvetica';

    const W = doc.page.width - 112; // 可用宽度

    // 标题
    doc.font(fontName).fontSize(22).fillColor('#1a1a1a')
      .text(title, { align: 'center', width: W });
    doc.moveDown(1.5);

    const lines = parseMdLines(outputText);
    for (const line of lines) {
      switch (line.type) {
        case 'h1':
          doc.moveDown(0.5).font(fontName).fontSize(18).fillColor('#1a1a1a')
            .text(line.text, { width: W }).moveDown(0.3);
          break;
        case 'h2':
          doc.moveDown(0.4).font(fontName).fontSize(15).fillColor('#1677ff')
            .text(line.text, { width: W }).moveDown(0.2);
          break;
        case 'h3':
          doc.moveDown(0.3).font(fontName).fontSize(13).fillColor('#333333')
            .text(line.text, { width: W }).moveDown(0.1);
          break;
        case 'bullet':
          doc.font(fontName).fontSize(12).fillColor('#333333')
            .text(`• ${line.text}`, { indent: 16, width: W });
          break;
        case 'ordered':
          doc.font(fontName).fontSize(12).fillColor('#333333')
            .text(line.text, { indent: 16, width: W });
          break;
        case 'blank':
          doc.moveDown(0.4);
          break;
        default:
          doc.font(fontName).fontSize(12).fillColor('#333333')
            .text(line.text, { width: W });
      }
    }

    doc.end();
  });
}

module.exports = { exportMarkdown, exportWord, exportPdf };
