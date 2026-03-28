import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('dashboard/doctor/')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div>Loading Doctor Data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow border-l-4 border-indigo-500">
          <h3 className="text-gray-500 text-sm font-semibold">Today's Earnings</h3>
          <p className="text-3xl font-bold text-gray-800">${data.total_earnings}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-pink-500">
          <h3 className="text-gray-500 text-sm font-semibold">Patients Handled Today</h3>
          <p className="text-3xl font-bold text-gray-800">{data.total_patients_today}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">Today's Appointments</h3>
        {data.todays_appointments?.length ? (
          <ul className="divide-y">
             {data.todays_appointments.map(appt => (
                <li key={appt.id} className="py-2">Token {appt.token_number} - {appt.time}</li>
             ))}
          </ul>
        ) : <p className="text-gray-500">No appointments today.</p>}
      </div>
    </div>
  );
}
