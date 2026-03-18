// api/client.js - axios 实例，自动附加 JWT
import axios from 'axios';
import useAppStore from '@/store/useAppStore';

const client = axios.create({
  baseURL: '/api',
  timeout: 90000, // 大模型调用可能较慢
});

client.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      useAppStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || { error: err.message });
  }
);

export default client;
