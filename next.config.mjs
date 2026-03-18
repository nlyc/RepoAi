/** @type {import('next').NextConfig} */
const nextConfig = {
  // 让 Next.js 在服务端以 CommonJS 方式处理这些包，避免 ESM/CJS 冲突
  serverExternalPackages: ['pg', 'pdfkit', 'docx', 'mammoth', 'bcryptjs'],
};

export default nextConfig;
