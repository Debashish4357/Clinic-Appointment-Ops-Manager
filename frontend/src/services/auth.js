import api from './api';

export const loginUser = async (data) => {
  const response = await api.post('/token/', data);
  if (response.data && response.data.access) {
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('role', response.data.role || 'PATIENT');
  }
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post('/register/', data);
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const getUserRole = () => {
  return localStorage.getItem('role');
};
