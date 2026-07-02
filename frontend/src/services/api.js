import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const transientStatuses = [502, 503, 504];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notifyServerIssue = (error) => {
  const status = error.response?.status || 0;
  const message = error.response?.data?.message
    || error.message
    || 'Server temporarily unavailable';

  window.dispatchEvent(new CustomEvent('petty-cash:server-issue', {
    detail: { status, message },
  }));
};

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
  async (error) => {
    const status = error.response?.status;
    const method = (error.config?.method || 'get').toLowerCase();
    const canRetry = (transientStatuses.includes(status) || error.code === 'ERR_NETWORK')
      && method === 'get'
      && !error.config?._retryAfterTransient;

    if (canRetry) {
      error.config._retryAfterTransient = true;
      await delay(1200);
      return api(error.config);
    }

    if (transientStatuses.includes(status) || error.code === 'ERR_NETWORK') {
      notifyServerIssue(error);
    }

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
    if (error.response) {
      return Promise.reject({
        ...error.response.data,
        status: error.response.status,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
