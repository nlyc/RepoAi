// api/client.js - 原生 fetch 封装，自动附加 JWT
// ⚠️ 零外部依赖：不引入任何模块，兼容 Vercel serverless 打包

const BASE_URL = '/api';
const TIMEOUT_MS = 90000;
const STORE_KEY = 'repoai-store'; // 与 useAppStore persist name 保持一致

/**
 * 从 localStorage 中读取 Zustand 持久化的 token
 * 仅在浏览器环境中执行，服务端返回 null
 */
function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.state?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * 清除 localStorage 中的认证状态并跳转登录页
 */
function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.state) {
        data.state.token = null;
        data.state.user = null;
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      }
    }
  } catch {}
  window.location.href = '/login';
}

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
 */
async function request(path, options = {}) {
  const token = getToken();

  // 若调用方已设置 Content-Type（如 multipart），则不覆盖
  const hasContentType = !!(options.headers?.['Content-Type']);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData && !hasContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    return Promise.reject({ error: err.name === 'AbortError' ? '请求超时' : (err.message || 'Network error') });
  }

  if (res.status === 401) {
    handleUnauthorized();
    return Promise.reject({ error: 'Unauthorized' });
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // 二进制流（如文件下载）直接返回 Response 对象
    return res;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return Promise.reject({ error: '响应解析失败' });
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
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return request(path, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      headers: extraHeaders,
    });
  },

  put: (path, body, config) => {
    const extraHeaders = config?.headers || {};
    return request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: extraHeaders,
    });
  },

  delete: (path) => request(path, { method: 'DELETE' }),

  patch: (path, body, config) => {
    const extraHeaders = config?.headers || {};
    return request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: extraHeaders,
    });
  },
};

export default client;
