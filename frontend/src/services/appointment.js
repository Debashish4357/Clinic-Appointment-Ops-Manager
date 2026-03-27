import api from './api';

export const getAppointments = async (filters = {}) => {
  try {
    const response = await api.get('/appointments', { params: filters });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch appointments' 
    };
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post('/appointments', appointmentData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to create appointment' 
    };
  }
};

export const updateAppointment = async (id, appointmentData) => {
  try {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to update appointment' 
    };
  }
};

export const deleteAppointment = async (id) => {
  try {
    await api.delete(`/appointments/${id}`);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to delete appointment' 
    };
  }
};

export const getTodayAppointments = async () => {
  try {
    const response = await api.get('/appointments/today');
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch today\'s appointments' 
    };
  }
};

export const getAppointmentStats = async () => {
  try {
    const response = await api.get('/appointments/stats');
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch appointment statistics' 
    };
  }
};
