// utils/fileParser.js - 解析上传文件内容
// 支持 txt/md/json 文本文件，图片通过 tesseract.js OCR 识别
// 识别失败或无结果时返回 null，不传入模型

const { createWorker } = require('tesseract.js');
const path = require('path');

// 语言包目录（chi_sim.traineddata / eng.traineddata）
const TESSDATA_PATH = path.join(__dirname, '../../tessdata');

/**
 * 对图片 Buffer 执行 OCR 识别（英文 + 简体中文）
 * 失败或无文字时返回 null，调用方负责排除该文件
 * @param {Buffer} buffer
 * @param {string} originalname
 * @returns {Promise<string|null>}
 */
async function ocrImage(buffer, originalname) {
  let worker;
  try {
    // createWorker(langs, oem, options) — oem=1(LSTM_ONLY)，logger 留在主进程不序列化到 Worker
    worker = await createWorker('eng+chi_sim', 1, {
      langPath: TESSDATA_PATH,
      logger: () => {},
    });
    const { data: { text } } = await worker.recognize(buffer);
    const cleaned = text.trim();
    return cleaned || null;
  } catch (err) {
    console.error(`OCR 识别失败 (${originalname}):`, err.message);
    return null;
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
}

/**
 * 从 multer 内存文件对象中提取文本内容
 * 图片 OCR 无结果时返回 null（调用方过滤，不传入模型）
 * @param {Express.Multer.File} file
 * @returns {Promise<string|null>}
 */
async function parseFileContent(file) {
  const { mimetype, originalname, buffer } = file;

  // 文本类文件直接读取
  if (
    mimetype.startsWith('text/') ||
    originalname.endsWith('.md') ||
    originalname.endsWith('.txt') ||
    originalname.endsWith('.json')
  ) {
    return buffer.toString('utf-8');
  }

  // 图片文件：OCR 识别，无结果则返回 null
  if (mimetype.startsWith('image/')) {
    const text = await ocrImage(buffer, originalname);
    if (!text) return null;
    return `[图片OCR识别结果: ${originalname}]\n${text}`;
  }

  return null;
}

/**
 * 并行解析并合并多个文件内容，过滤掉无法提取内容的文件
 * @param {Express.Multer.File[]} files
 * @returns {Promise<string>}
 */
async function mergeFileContents(files = []) {
  if (!files.length) return '';
  const entries = await Promise.all(
    files.map((f, i) =>
      parseFileContent(f).then(text =>
        text ? `--- 文件${i + 1}: ${f.originalname} ---\n${text}` : null
      )
    )
  );
  return entries.filter(Boolean).join('\n\n');
}

module.exports = { parseFileContent, mergeFileContents };
