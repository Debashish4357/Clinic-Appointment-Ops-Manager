import React, { useEffect, useState } from 'react';
import API from '../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total_patients: 0, arrived: 0, pending: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchData = () => {
    setLoading(true);
    API.get('dashboard/receptionist/')
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setAppointments(d.appointments || []);
        setStats(d.stats || {});
      })
      .catch(() => setError('Failed to load receptionist data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ── Status action ─────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Move up / down ────────────────────────────────────────────────────────
  const moveQueue = async (id, action) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/move/`, { action });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Move failed.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Loading queue...</p>
        </div>
      </div>
    );

  if (error)
    return <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center">{error}</div>;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Receptionist Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Queue management · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total_patients, icon: '📋', color: 'from-blue-600/20 to-blue-500/5 border-blue-500/20' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-sky-600/20 to-sky-500/5 border-sky-500/20' },
          { label: 'Arrived', value: stats.arrived, icon: '🏥', color: 'from-amber-600/20 to-amber-500/5 border-amber-500/20' },
          { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20' },
          { label: 'Cancelled', value: stats.cancelled, icon: '❌', color: 'from-red-600/20 to-red-500/5 border-red-500/20' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5`}>
            <span className="text-lg">{icon}</span>
            <p className="text-2xl font-black text-white mt-2">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Queue Table ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-white">Today's Queue</h2>
          <button onClick={fetchData}
            className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors">
            ↻ Refresh
          </button>
        </div>

        {appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/50">
                  {['Token', 'Time', 'Patient', 'Doctor', 'Status', 'Queue', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((appt, idx) => (
                  <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                    {/* Token */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
                        {appt.token_number}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.time}</td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold text-sm">{appt.patient_name}</p>
                      {appt.reason && (
                        <p className="text-slate-500 text-xs mt-0.5 italic truncate max-w-[180px]">"{appt.reason}"</p>
                      )}
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3 text-slate-300 text-sm">{appt.doctor_name}</td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[appt.status] || 'bg-slate-600 text-slate-300'}`}>
                        {appt.status}
                      </span>
                    </td>

                    {/* Queue Move Buttons */}
                    <td className="px-4 py-3">
                      {appt.status === 'BOOKED' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveQueue(appt.id, 'UP')}
                            disabled={updating === appt.id || idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                            title="Move Up">
                            ↑
                          </button>
                          <button
                            onClick={() => moveQueue(appt.id, 'DOWN')}
                            disabled={updating === appt.id || idx === appointments.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                            title="Move Down">
                            ↓
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Status Action Buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* BOOKED → Check-In or Cancel */}
                        {appt.status === 'BOOKED' && (
                          <>
                            <button
                              onClick={() => updateStatus(appt.id, 'ARRIVED')}
                              disabled={updating === appt.id}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50 whitespace-nowrap">
                              {updating === appt.id ? '...' : '📥 Check-In'}
                            </button>
                            <button
                              onClick={() => updateStatus(appt.id, 'CANCELLED')}
                              disabled={updating === appt.id}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 whitespace-nowrap">
                              {updating === appt.id ? '...' : '✕ Cancel'}
                            </button>
                          </>
                        )}

                        {/* ARRIVED → Check-Out */}
                        {appt.status === 'ARRIVED' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'COMPLETED')}
                            disabled={updating === appt.id}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 whitespace-nowrap">
                            {updating === appt.id ? '...' : '📤 Check-Out'}
                          </button>
                        )}

                        {/* Terminal states */}
                        {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status) && (
                          <span className="text-slate-600 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">🏥</p>
            <p className="text-slate-400 text-sm">No appointments scheduled for today.</p>
            <p className="text-slate-600 text-xs mt-1">Queue will populate as patients book.</p>
          </div>
        )}
      </div>
    </div>
  );
}
