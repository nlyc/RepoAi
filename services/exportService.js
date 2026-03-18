// services/exportService.js - 导出服务（Markdown / Word / PDF）
// 注意：PDF 中文字体需在 public/fonts/NotoSansSC-Regular.ttf 放置字体文件
// 若字体不存在则降级为 Helvetica（中文显示为方框，但文件可正常生成）
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function exportMarkdown(outputText) {
  return Buffer.from(outputText, 'utf-8');
}

function markdownToDocxParagraphs(mdText) {
  const paragraphs = [];
  for (const line of mdText.split('\n')) {
    if (line.startsWith('### ')) {
      paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 60 } }));
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }));
    } else if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 180 } }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      paragraphs.push(new Paragraph({ text: line.slice(2), bullet: { level: 0 } }));
    } else if (/^\d+\.\s/.test(line)) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })], indent: { left: 360 }, spacing: { before: 40, after: 40 } }));
    } else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    } else {
      const parts = line.split(/\*\*(.+?)\*\*/);
      if (parts.length > 1) {
        paragraphs.push(new Paragraph({ children: parts.map((p, i) => new TextRun({ text: p, bold: i % 2 === 1 })) }));
      } else {
        paragraphs.push(new Paragraph({ text: line }));
      }
    }
  }
  return paragraphs;
}

export async function exportWord(outputText, title = '工作汇报') {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
        ...markdownToDocxParagraphs(outputText),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

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

export async function exportPdf(outputText, title = '工作汇报') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, autoFirstPage: true });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // 尝试加载中文字体（优先项目内置，其次系统字体）
    const fontCandidates = [
      path.join(process.cwd(), 'public/fonts/NotoSansSC-Regular.ttf'),
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    ];
    let fontLoaded = false;
    for (const fp of fontCandidates) {
      if (fs.existsSync(fp)) {
        try { doc.registerFont('CJK', fp); fontLoaded = true; break; } catch (_) {}
      }
    }
    const fontName = fontLoaded ? 'CJK' : 'Helvetica';
    const W = doc.page.width - 112;

    doc.font(fontName).fontSize(22).fillColor('#1a1a1a').text(title, { align: 'center', width: W });
    doc.moveDown(1.5);

    for (const line of parseMdLines(outputText)) {
      switch (line.type) {
        case 'h1': doc.moveDown(0.5).font(fontName).fontSize(18).fillColor('#1a1a1a').text(line.text, { width: W }).moveDown(0.3); break;
        case 'h2': doc.moveDown(0.4).font(fontName).fontSize(15).fillColor('#1677ff').text(line.text, { width: W }).moveDown(0.2); break;
        case 'h3': doc.moveDown(0.3).font(fontName).fontSize(13).fillColor('#333333').text(line.text, { width: W }).moveDown(0.1); break;
        case 'bullet': doc.font(fontName).fontSize(12).fillColor('#333333').text(`• ${line.text}`, { indent: 16, width: W }); break;
        case 'ordered': doc.font(fontName).fontSize(12).fillColor('#333333').text(line.text, { indent: 16, width: W }); break;
        case 'blank': doc.moveDown(0.4); break;
        default: doc.font(fontName).fontSize(12).fillColor('#333333').text(line.text, { width: W });
      }
    }
    doc.end();
  });
}
