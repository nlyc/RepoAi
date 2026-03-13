// api/quota.js
import client from './client';
export const getQuotaStatus = () => client.get('/quota/status');
