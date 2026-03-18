// services/fileParser.js - 解析上传文件内容（移除 Tesseract OCR，改用 mammoth 解析 .docx）
import mammoth from 'mammoth';

/**
 * 从 File 对象提取文本内容
 * 支持：txt / md / json（直接读取），docx（mammoth 解析）
 * 图片等不支持的格式返回 null
 */
export async function parseFileContent(file) {
  const name = file.name || '';
  const type = file.type || '';
  const buffer = Buffer.from(await file.arrayBuffer());

  // 文本类文件直接读取
  if (
    type.startsWith('text/') ||
    name.endsWith('.md') ||
    name.endsWith('.txt') ||
    name.endsWith('.json')
  ) {
    return buffer.toString('utf-8');
  }

  // Word 文档：用 mammoth 提取纯文本
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value?.trim() || null;
    } catch (err) {
      console.error(`[FileParser] .docx 解析失败 (${name}):`, err.message);
      return null;
    }
  }

  // 其他格式（图片等）暂不支持，返回 null
  return null;
}

/**
 * 并行解析并合并多个 File 对象内容
 */
export async function mergeFileContents(files = []) {
  if (!files.length) return '';
  const entries = await Promise.all(
    files.map((f, i) =>
      parseFileContent(f).then(text =>
        text ? `--- 文件${i + 1}: ${f.name} ---\n${text}` : null
      )
    )
  );
  return entries.filter(Boolean).join('\n\n');
}
