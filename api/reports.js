// api/reports.js
import client from './client';
import useAppStore from '@/store/useAppStore';

export const generateReport = (formData) =>
  client.post('/reports/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getReports = (params) => client.get('/reports', { params });
export const getReport = (id) => client.get(`/reports/${id}`);
export const deleteReport = (id) => client.delete(`/reports/${id}`);

export const exportReport = (reportId, format) => {
  const token = useAppStore.getState().token;
  const url = `/api/export/${reportId}?format=${format}`;
  return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then(async (res) => {
      if (!res.ok) throw await res.json();
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
