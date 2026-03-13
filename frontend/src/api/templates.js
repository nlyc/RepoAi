// api/templates.js
import client from './client';
export const getTemplates = (params) => client.get('/templates', { params });
export const createTemplate = (data) => client.post('/templates', data);
export const updateTemplate = (id, data) => client.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => client.delete(`/templates/${id}`);
export const importTemplates = (templates) => client.post('/templates/import', { templates });
export const exportTemplates = () => client.get('/templates/export');
