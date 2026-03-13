// src/App.jsx - 应用根组件，路由 + 主题配置
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import TemplatesPage from './pages/TemplatesPage';
import HistoryPage from './pages/HistoryPage';
import useAppStore from './store/useAppStore';

// Ant Design 主题 token
const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
    fontSize: 14,
  },
};

function PrivateRoute({ children }) {
  const token = useAppStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <PrivateRoute>
                <AppShell />
              </PrivateRoute>
            }>
              <Route index element={<MainPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
