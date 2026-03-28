import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('dashboard/admin/')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <div>Loading Admin Data...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
        <h3 className="text-gray-500 text-sm font-semibold">Total Revenue</h3>
        <p className="text-3xl font-bold text-gray-800">${data.total_revenue}</p>
      </div>
      <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
        <h3 className="text-gray-500 text-sm font-semibold">Total Patients</h3>
        <p className="text-3xl font-bold text-gray-800">{data.total_patients}</p>
      </div>
      <div className="bg-white p-6 rounded shadow border-l-4 border-purple-500">
        <h3 className="text-gray-500 text-sm font-semibold">Total Appointments</h3>
        <p className="text-3xl font-bold text-gray-800">{data.total_appointments}</p>
      </div>
    </div>
  );
}
