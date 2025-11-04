import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Employee API
export const employeeAPI = {
  getAll: (status) => api.get('/employees', { params: { status } }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  checkDuplicate: (bankAccount, employeeId) =>
    api.get('/employees/check-duplicate', {
      params: { bank_account_number: bankAccount, employee_id: employeeId },
    }),
};

// Salary API
export const salaryAPI = {
  generateMonthly: (paymentMonth) => api.post('/salary/generate', { payment_month: paymentMonth }),
  getByMonth: (month) => api.get(`/salary/month/${month}`),
  getEmployeeHistory: (employeeId) => api.get(`/salary/employee/${employeeId}/history`),
  updateStatus: (id, status) => api.put(`/salary/payment/${id}/status`, { status }),
  bulkUpdateStatus: (paymentIds, status) =>
    api.post('/salary/bulk-update', { payment_ids: paymentIds, status }),
  getStatistics: (month) => api.get(`/salary/month/${month}/statistics`),
  getMonths: () => api.get('/salary/months'),
  exportPayments: (month) => api.get(`/salary/month/${month}/export`, { responseType: 'blob' }),
};

export default api;
