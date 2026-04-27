/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AuthResponse, 
  Transaction, 
  TransactionCreate, 
  TransactionSummary, 
  Prediction, 
  ReportSummary 
} from '../types/api';

const API_BASE = 'https://happy-charisma-production.up.railway.app/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('jwtToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  let data: any = {};

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text || `Error: ${response.status} ${response.statusText}` };
  }

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const apiService = {
  auth: {
    login: (username: string, password: string) => 
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, email: string, password: string, properties?: Record<string, string>) =>
      request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword: password,
          properties
        }),
      }),
  },
  user: {
    getProperties: () => request<Record<string, string>>('/user/properties'),
    updateProperty: (key: string, value: string) =>
      request<any>('/user/property', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      }),
    removeProperty: (key: string) =>
      request<any>('/user/property', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      }),
  },
  transactions: {
    getAll: (userId: number) => request<Transaction[]>(`/transactions/${userId}`),
    getByRange: (userId: number, startDate: string, endDate: string) =>
      request<Transaction[]>(`/transactions/${userId}/range?startDate=${startDate}&endDate=${endDate}`),
    add: (data: TransactionCreate) =>
      request<Transaction>('/transactions/add', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (txnId: number, data: Partial<TransactionCreate>) =>
      request<Transaction>(`/transactions/${txnId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (txnId: number) =>
      request<any>(`/transactions/${txnId}`, {
        method: 'DELETE',
      }),
    deleteAllForUser: (userId: number) =>
      request<any>(`/transactions/user/${userId}`, {
        method: 'DELETE',
      }),
    getSummary: (userId: number) => request<TransactionSummary>(`/transactions/${userId}/summary`),
    getMonthly: (userId: number, year: number, month: number) =>
      request<{ userId: number, year: number, month: number, spending: number }>(`/transactions/${userId}/monthly/${year}/${month}`),
  },
  predictions: {
    run: (userId: number) => request<Prediction[]>(`/predictions/run?userId=${userId}`, { method: 'POST' }),
    deleteAllForUser: (userId: number) =>
      request<any>(`/predictions/user/${userId}`, {
        method: 'DELETE',
      }),
    getAll: (userId: number) => request<Prediction[]>(`/predictions/${userId}`),
    getLatest: (userId: number) => request<Prediction>(`/predictions/${userId}/latest`),
    getNextMonth: (userId: number) => request<{ userId: number, predictedAmount: number }>(`/predictions/${userId}/next-month`),
  },
  reports: {
    getSummary: (userId: number, monthlyBudget: number = 10000) =>
      request<ReportSummary>(`/reports/summary/${userId}?monthlyBudget=${monthlyBudget}`),
    exportExcel: (userId: number) => `/reports/export/excel?userId=${userId}`,
    exportPdf: (userId: number) => `/reports/export/pdf?userId=${userId}`,
    downloadFile: async (endpoint: string, filename: string) => {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Accept': '*/*',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Download error:', errorData);
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    }
  }
};
