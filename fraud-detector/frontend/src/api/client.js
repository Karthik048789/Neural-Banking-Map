import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getStats = async () => {
  const res = await apiClient.get('/stats');
  return res.data;
};

export const getFlaggedAccounts = async () => {
  const res = await apiClient.get('/flagged');
  return res.data;
};

export const getReport = async (accountId) => {
  const res = await apiClient.get(`/report/${accountId}`);
  return res.data;
};

export const getGraphFraud = async () => {
  const res = await apiClient.get('/graph/fraud');
  return res.data;
};

export const postTransaction = async (data) => {
  const res = await apiClient.post('/transaction', data);
  return res.data;
};

export default apiClient;
