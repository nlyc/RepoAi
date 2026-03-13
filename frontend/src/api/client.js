// api/client.js - axios 实例，自动附加 JWT
import axios from 'axios';
import useAppStore from '../store/useAppStore';

const client = axios.create({
  baseURL: '/api',
  timeout: 60000, // 大模型调用可能较慢，60s 超时
});

// 请求拦截：自动附加 Authorization
client.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// 响应拦截：401 自动登出
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      useAppStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default client;
