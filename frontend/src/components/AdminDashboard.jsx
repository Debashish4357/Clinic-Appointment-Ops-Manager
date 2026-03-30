import React, { useEffect, useState } from 'react';
import API from '../services/api';

const StatCard = ({ label, value, icon, color }) => (
  <div className={`relative overflow-hidden bg-slate-800/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`} />
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-20`}>
        {icon}
      </div>
    </div>
    <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
    <p className="text-3xl font-black text-white">{value ?? '—'}</p>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get('dashboard/admin/')
      .then((res) => setData(res.data.data || res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Fetching admin data...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center">
        {error}
      </div>
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Admin Overview</h1>
        <p className="text-slate-400 text-sm mt-1">System-wide statistics at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          label="Total Users"
          value={data?.total_users}
          color="bg-blue-500"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Total Doctors"
          value={data?.total_doctors}
          color="bg-cyan-500"
          icon={<svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <StatCard
          label="Total Patients"
          value={data?.total_patients}
          color="bg-emerald-500"
          icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Total Appointments"
          value={data?.total_appointments}
          color="bg-amber-500"
          icon={<svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Total Revenue"
          value={data?.total_revenue !== undefined ? `₹${Number(data.total_revenue).toLocaleString()}` : undefined}
          color="bg-purple-500"
          icon={<svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>
    </div>
  );
}
