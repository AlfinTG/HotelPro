import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotelpro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 Unauthorized, purge stale credentials from storage
// Preserves the error response and error message for calling components; avoids redirect loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hotelpro_token');
      localStorage.removeItem('hotelpro_user');
    }
    return Promise.reject(error);
  }
);

export default api;
