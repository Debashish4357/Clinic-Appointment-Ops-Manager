import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function ReceptionistDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('dashboard/receptionist/')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div>Loading Receptionist Data...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
        <h3 className="text-gray-500 text-sm font-semibold">Total Bookings Today</h3>
        <p className="text-3xl font-bold text-gray-800">{data.total_bookings_today}</p>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">Today's Appointments</h3>
        {data.todays_appointments?.length ? (
          <ul className="divide-y">
             {data.todays_appointments.map(appt => (
                <li key={appt.id} className="py-2">Token {appt.token_number} - Status: {appt.status}</li>
             ))}
          </ul>
        ) : <p className="text-gray-500">No appointments logged today.</p>}
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Receptionist Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Today's Bookings</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{data.todays_bookings}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Appointments</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{data.todays_appointments?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Appointment List</h3>
        </div>
        
        {data.todays_appointments?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.todays_appointments.map((appointment, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appointment.patient_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.doctor_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.time || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        appointment.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No appointments scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  );
}
