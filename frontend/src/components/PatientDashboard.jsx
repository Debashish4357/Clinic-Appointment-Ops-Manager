import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PatientDashboard = () => {
  const [data, setData] = useState({
    appointments: [],
    token_number: null,
    wait_time: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await api.get('/dashboard/patient/');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Dashboard</h2>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Appointments</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{data.patients_appointments?.length || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Token Number</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {data.token_number || 'N/A'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Wait Time</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {data.wait_time ? `${data.wait_time} min` : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Appointments</h3>
        {data.patients_appointments?.length > 0 ? (
          <div className="space-y-3">
            {data.patients_appointments.map((appointment, index) => (
              <div key={index} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <p className="font-medium">{appointment.doctor_name || 'Doctor'}</p>
                  <p className="text-sm text-gray-600">{appointment.date || 'Date'}</p>
                  <p className="text-sm text-gray-500">{appointment.time || 'Time'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  appointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {appointment.status || 'Scheduled'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No appointments scheduled</p>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
