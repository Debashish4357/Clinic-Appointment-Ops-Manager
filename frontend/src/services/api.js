import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/',
});

// Attach JWT token to every request
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem('token');
    const isAuthEndpoint = req.url.includes('token/') || req.url.includes('register/');
    if (token && !isAuthEndpoint) {
      req.headers['Authorization'] = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

// Handle 401 — token expired or invalid → force re-login
// Skip redirect if no token existed (i.e. login attempt with bad credentials)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config && (error.config.url.includes('token/') || error.config.url.includes('register/'));

    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      const token = localStorage.getItem('token');
      if (token) {
        // Token was present but rejected → expired/revoked → clear & redirect
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        window.location.href = '/';
      }
      // If no token, the user is on login page → let the error reach catch()
    }
    return Promise.reject(error);
  }
);

export default API;
