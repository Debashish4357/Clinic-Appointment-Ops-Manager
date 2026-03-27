import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    todays_appointments: [],
    total_patients: 0,
    earnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorStats();
  }, []);

  const fetchDoctorStats = async () => {
    try {
      const response = await api.get('/dashboard/doctor/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Dashboard</h2>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Today's Appointments</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.todays_appointments?.length || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Patients</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats.total_patients}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Earnings</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">${stats.earnings}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Today's Appointments</h3>
        {stats.todays_appointments?.length > 0 ? (
          <div className="space-y-3">
            {stats.todays_appointments.map((appointment, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{appointment.patient_name || 'Patient'}</p>
                  <p className="text-sm text-gray-600">{appointment.time || 'Time'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {appointment.status || 'Scheduled'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
