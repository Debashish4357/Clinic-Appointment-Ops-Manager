import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await API.get('appointments/');
        console.log("Appointments Data:", response.data);
        setAppointments(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);

  if (loading) return <div className="text-gray-500 p-4">Loading your appointments...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">My Appointments</h3>
        
        {appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Doctor Profile</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Token</th>
                  <th className="px-4 py-3 font-semibold">Wait Time (m)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((appt) => (
                  <tr key={appt.id || appt.token_number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">User #{appt.doctor}</td>
                    <td className="px-4 py-3">{appt.date}</td>
                    <td className="px-4 py-3">{appt.time}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{appt.token_number}</td>
                    <td className="px-4 py-3 text-orange-600 font-medium">{appt.estimated_wait_time} mins</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg mb-2">No appointments found</p>
            <p className="text-sm text-gray-400">You don't have any past or upcoming appointments scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
