import axios from 'axios';

const baseURL = import.meta.env.VITE_BFF_URL || '';

const api = axios.create({
  baseURL: baseURL + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar refresh token automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// Transacciones
export const transactionsAPI = {
  create: (data) => api.post('/transactions', data),
  getAll: (params) => api.get('/transactions', { params }),
  getSummary: (params) => api.get('/transactions/summary', { params }),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Préstamos
export const loansAPI = {
  create: (data) => api.post('/loans', data),
  getAll: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  getAmortization: (id) => api.get(`/loans/${id}/amortization`),
  simulateExtraPayment: (id, data) => api.post(`/loans/${id}/simulate-extra-payment`, data),
  registerPayment: (id, data) => api.post(`/loans/${id}/payment`, data),
};

// IA
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
};

export default api;
