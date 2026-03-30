import api from './api';

export const getAppointments = async () => {
  const response = await api.get('/appointments/');
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments/', appointmentData);
  return response.data;
};

export const updateAppointmentStatus = async (id, statusData) => {
  const response = await api.patch(`/appointments/${id}/`, statusData);
  return response.data;
};
