import axios from 'axios';
import { mockStats, mockFlaggedAccounts, mockReport, mockGraphFraud } from '@/mocks/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USE_MOCK = true; // Toggle for demo

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getStats = async () => {
  if (USE_MOCK) return mockStats;
  const res = await apiClient.get('/stats');
  return res.data;
};

export const getFlaggedAccounts = async () => {
  if (USE_MOCK) return mockFlaggedAccounts;
  const res = await apiClient.get('/flagged');
  return res.data;
};

export const getReport = async (accountId) => {
  if (USE_MOCK) return mockReport(accountId);
  const res = await apiClient.get(`/report/${accountId}`);
  return res.data;
};

export const getGraphFraud = async () => {
  if (USE_MOCK) return mockGraphFraud;
  const res = await apiClient.get('/graph/fraud');
  return res.data;
};

export const postTransaction = async (data) => {
  if (USE_MOCK) {
    return { 
      is_fraud: Math.random() < 0.2, 
      confidence: 0.85, 
      sar_draft: "SAR DRAFT...", 
      ring_nodes: ["A", "B"] 
    };
  }
  const res = await apiClient.post('/transaction', data);
  return res.data;
};

export default apiClient;
