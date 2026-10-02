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
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isGet = method === 'get';

    // Network error detection (including ERR_NETWORK_CHANGED, offline, timeouts)
    const isNetworkError = !error.response || 
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network') ||
      error.message?.includes('timeout');

    const isTransient = transientStatuses.includes(status) || isNetworkError;

    // Retry count tracking
    const retryCount = error.config?._retryCount || 0;
    const maxRetries = isGet ? 3 : (isLoginRequest ? 2 : 0);

    if (isTransient && retryCount < maxRetries) {
      error.config._retryCount = retryCount + 1;
      const backoffMs = Math.min(1000 * Math.pow(1.5, retryCount), 4000);
      await delay(backoffMs);
      return api(error.config);
    }

    if (isTransient) {
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
