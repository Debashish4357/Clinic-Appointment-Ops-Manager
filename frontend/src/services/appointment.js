import API from './api';

export const getAppointments = async () => {
  const response = await API.get('appointments/');
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const response = await API.post('appointments/', appointmentData);
  return response.data;
};

export const updateAppointmentStatus = async (id, statusData) => {
  const response = await API.patch(`appointments/${id}/`, statusData);
  return response.data;
};
