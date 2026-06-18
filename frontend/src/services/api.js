import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const onLoginPage = window.location.pathname === '/login';

      // Don't redirect on failed login — let Login.jsx show the error
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        if (!onLoginPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
