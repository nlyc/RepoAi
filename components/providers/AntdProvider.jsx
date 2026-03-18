'use client';
// components/providers/AntdProvider.jsx - Ant Design SSR 兼容 Provider
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
    fontSize: 14,
  },
};

export default function AntdProvider({ children }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme} locale={zhCN}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
