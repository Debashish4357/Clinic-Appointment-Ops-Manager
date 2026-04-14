import API from './api';

export const loginUser = async (credentials) => {
  const response = await API.post('token/', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await API.post('register/', userData);
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_id');
  window.location.href = '/';
};

export const isAuthenticated = () => !!localStorage.getItem('token');
