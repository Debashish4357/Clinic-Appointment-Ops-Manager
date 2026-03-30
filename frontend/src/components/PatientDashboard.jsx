import React, { useEffect, useState } from 'react';
import API from '../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get('dashboard/patient/')
      .then((res) => setData(res.data.data || res.data))
      .catch(() => setError('Failed to load your appointments.'))
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
          <p className="text-sm">Fetching your appointments...</p>
        </div>
      </div>
    );

  if (error)
    return <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center">{error}</div>;

  const upcoming = data?.upcoming_appointment;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Patient Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Your upcoming appointment and history</p>
      </div>

      {/* Upcoming appointment highlight */}
      {upcoming ? (
        <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-cyan-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-1">Next Appointment</p>
              <p className="text-white font-bold text-lg">Doctor #{upcoming.doctor}</p>
              <p className="text-slate-300 text-sm mt-1">{upcoming.date} at {upcoming.time}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center bg-white/10 rounded-xl px-5 py-3">
                <p className="text-2xl font-black text-cyan-300">{data.token_number ?? '—'}</p>
                <p className="text-slate-400 text-xs mt-1">Token #</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-5 py-3">
                <p className="text-2xl font-black text-amber-300">{data.estimated_wait_time ?? '—'}</p>
                <p className="text-slate-400 text-xs mt-1">Min wait</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 mb-8 text-center text-slate-400 text-sm">
          No upcoming appointments. <a href="/appointments" className="text-cyan-400 hover:underline ml-1">Book one now →</a>
        </div>
      )}

      {/* All Appointments */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-white">All Appointments</h2>
          <span className="text-slate-400 text-sm">{data?.patients_appointments?.length ?? 0} total</span>
        </div>
        {data?.patients_appointments?.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.patients_appointments.map((appt, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold">
                    {appt.token_number || i + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Doctor #{appt.doctor}</p>
                    <p className="text-slate-400 text-xs">{appt.date} · {appt.time}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[appt.status] || 'bg-slate-600 text-slate-300'}`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">No appointment history found.</div>
        )}
      </div>
    </div>
  );
}
