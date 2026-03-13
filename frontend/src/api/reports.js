// api/reports.js
import client from './client';

export const generateReport = (formData) =>
  client.post('/reports/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getReports = (params) => client.get('/reports', { params });
export const getReport = (id) => client.get(`/reports/${id}`);
export const deleteReport = (id) => client.delete(`/reports/${id}`);

export const exportReport = (reportId, format) => {
  const token = localStorage.getItem('repoai-store')
    ? JSON.parse(localStorage.getItem('repoai-store'))?.state?.token
    : '';
  const url = `/api/export/${reportId}?format=${format}`;
  // 触发浏览器下载
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', '');
  // 通过 fetch 下载（携带 token）
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      const disposition = res.headers.get('content-disposition');
      const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || `report.${format}`;
      return res.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = decodeURIComponent(filename);
      a.click();
      URL.revokeObjectURL(url);
    });
};
