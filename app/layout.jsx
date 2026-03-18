// app/layout.jsx - 根布局
import './globals.css';
import AntdProvider from '@/components/providers/AntdProvider';

export const metadata = {
  title: 'RepoAI - 智能职场汇报生成工具',
  description: '一键生成周报、月报、晨会汇报、述职报告',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
