// api/client.js - 原生 fetch 封装，自动附加 JWT（替代 axios，兼容 Vercel serverless）
import useAppStore from '@/store/useAppStore';

const BASE_URL = '/api';
const TIMEOUT_MS = 90000; // 大模型调用可能较慢

/**
 * 带超时的 fetch
 */
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/**
 * 统一请求入口
 * @param {string} path  - 如 '/auth/login'
 * @param {object} options - fetch options（method, body, headers 等）
 */
async function request(path, options = {}) {
  const token = useAppStore.getState().token;

  // 若调用方已在 options.headers 中设置了 Content-Type（如 multipart），则优先使用
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  // 若没有 Content-Type 且不是 FormData，默认使用 JSON
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    // 超时或网络错误
    return Promise.reject({ error: err.message || 'Network error' });
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      useAppStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject({ error: 'Unauthorized' });
  }

  // 解析响应体
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    // 二进制流（如文件下载）直接返回 Response
    return res;
  }

  if (!res.ok) {
    return Promise.reject(data || { error: `HTTP ${res.status}` });
  }

  return data;
}

// 便捷方法，模拟 axios 风格
const client = {
  /**
   * GET 请求
   * @param {string} path
   * @param {object} [paramsOrConfig] - 可传 { params } 或直接传 params 对象
   */
  get: (path, paramsOrConfig) => {
    const params = paramsOrConfig?.params ?? paramsOrConfig;
    const query =
      params && Object.keys(params).length
        ? '?' + new URLSearchParams(params).toString()
        : '';
    return request(`${path}${query}`, { method: 'GET' });
  },

  /**
   * POST 请求
   * @param {string} path
   * @param {*} body
   * @param {object} [config] - 额外配置，如 { headers: { 'Content-Type': ... } }
   */
  post: (path, body, config) => {
    const extraHeaders = config?.headers || {};
    // 若是 FormData，不设置 Content-Type（浏览器自动添加 boundary）
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return request(path, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      headers: isFormData
        ? extraHeaders
        : { 'Content-Type': 'application/json', ...extraHeaders },
    });
  },

  put: (path, body, config) => {
    const extraHeaders = config?.headers || {};
    return request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    });
  },

  delete: (path) => request(path, { method: 'DELETE' }),

  patch: (path, body, config) => {
    const extraHeaders = config?.headers || {};
    return request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    });
  },
};

export default client;
