import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/',
});

// Public endpoints — no Authorization header, no 401 redirect
const PUBLIC_ENDPOINTS = ['token/', 'register/', 'reset-password/'];
const isPublic = (url) => PUBLIC_ENDPOINTS.some((e) => url.includes(e));

// Attach JWT token to every request (skip public endpoints)
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem('token');
    if (token && !isPublic(req.url)) {
      req.headers['Authorization'] = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

// Handle 401 — token expired or invalid → force re-login
// Skip redirect for public endpoints (login / register / reset-password)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !isPublic(url)) {
      const token = localStorage.getItem('token');
      if (token) {
        // Token was present but rejected → expired/revoked → clear & redirect
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default API;

