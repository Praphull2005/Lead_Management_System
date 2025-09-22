/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const API_BASE_URL = 'https://lead-management-sytm.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    throw new Error(message);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    return await api.post('/auth/login', credentials);
  },

  register: async (userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => {
    return await api.post('/auth/register', userData);
  },

  logout: async () => {
    return await api.post('/auth/logout');
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },
};

// Leads API
export const leadsAPI = {
  getLeads: async (params?: {
    page?: number;
    limit?: number;
    [key: string]: any;
  }) => {
    return await api.get('/api/leads', { params });
  },

  getLead: async (id: string) => {
    return await api.get(`/api/leads/${id}`);
  },

  createLead: async (leadData: any) => {
    return await api.post('/api/leads', leadData);
  },

  updateLead: async (id: string, leadData: any) => {
    return await api.put(`/api/leads/${id}`, leadData);
  },

  deleteLead: async (id: string) => {
    return await api.delete(`/api/leads/${id}`);
  },
};

export default api;