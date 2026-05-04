import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { logoutUser } from '../services/auth';
import AppointmentBooking from '../components/AppointmentBooking';

const fmt12h = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const TokenBadge = ({ token, size = 'sm' }) => (
  <span className={`inline-flex items-center justify-center font-black tracking-wider rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ${size === 'lg' ? 'px-5 py-2 text-2xl' : 'px-3 py-1 text-xs'}`}>
    {token || '—'}
  </span>
);

const StatusPill = ({ status }) => {
  const map = {
    BOOKED:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ARRIVED:     'bg-orange-500/20 text-orange-300 border-orange-500/30',
    IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    COMPLETED:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CANCELLED:   'bg-red-500/20 text-red-300 border-red-500/30',
    NO_SHOW:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${map[status] || 'bg-slate-600/30 text-slate-300'}`}>
      {status?.replace('_', ' ') || '—'}
    </span>
  );
};

export default function QueuePage() {
  const role = localStorage.getItem('role') || '';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [updating, setUpdating] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const params = filterDate ? `?date=${filterDate}` : '';
    API.get(`dashboard/receptionist/${params}`)
      .then(r => setAppointments(r.data?.data?.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterDate]);

  const filtered = useMemo(() => {
    if (!search.trim()) return appointments;
    const q = search.toLowerCase();
    return appointments.filter(a =>
      a.patient_name?.toLowerCase().includes(q) ||
      a.patient_phone?.includes(q) ||
      a.token_display?.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  const active = useMemo(() =>
    filtered.filter(a => ['BOOKED', 'ARRIVED', 'IN_PROGRESS'].includes(a.status))
      .sort((a, b) => a.token_number - b.token_number),
    [filtered]
  );

  const nowServing = active.find(a => a.status === 'IN_PROGRESS') || active[0] || null;
  const nextUp = nowServing ? active.find(a => a.id !== nowServing.id) : null;

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/`, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <span className="font-black text-lg">Clinic<span className="text-cyan-400">Portal</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
            <Link to="/appointments" className="text-sm text-slate-400 hover:text-white transition-colors">Appointments</Link>
            <button onClick={logoutUser} className="text-sm text-slate-400 hover:text-red-400 transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">

        {/* Header + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Queue Management</h1>
            <p className="text-slate-400 text-sm mt-1">Live patient queue with composite token tracking</p>
          </div>
          {['RECEPTIONIST', 'ADMIN'].includes(role) && (
            <button
              onClick={() => setShowBooking(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
              Book / Walk-in
            </button>
          )}
        </div>

        {/* Booking Panel */}
        {showBooking && (
          <div className="mb-8">
            <AppointmentBooking onBookingSuccess={() => { fetchData(); setShowBooking(false); }} />
          </div>
        )}

        {/* Now Serving + Next Up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Now Serving */}
          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-2xl p-6 shadow-lg shadow-cyan-500/10">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">🟢 Now Serving</p>
            {nowServing ? (
              <div className="flex items-center gap-4">
                <TokenBadge token={nowServing.token_display} size="lg" />
                <div>
                  <p className="text-white font-black text-lg leading-tight">{nowServing.patient_name}</p>
                  <p className="text-cyan-300/70 text-sm">{nowServing.doctor_name}</p>
                  <StatusPill status={nowServing.status} />
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No patients currently being served.</p>
            )}
          </div>

          {/* Next Up */}
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">⏭ Next Up</p>
            {nextUp ? (
              <div className="flex items-center gap-4">
                <TokenBadge token={nextUp.token_display} size="lg" />
                <div>
                  <p className="text-white font-black text-lg leading-tight">{nextUp.patient_name}</p>
                  <p className="text-slate-400 text-sm">{nextUp.doctor_name}</p>
                  <StatusPill status={nextUp.status} />
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No more patients in queue.</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 [color-scheme:dark]"
          />
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, phone, or token (e.g. VIR-01)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <button onClick={fetchData} className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-slate-300 hover:text-cyan-400 text-sm transition-colors">↻ Refresh</button>
          <span className="self-center text-slate-500 text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Queue Table */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading queue…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-2xl mb-2">🏥</p>
              <p className="font-semibold text-slate-400">No patients in queue.</p>
              <p className="text-sm mt-1">Add a walk-in or book an appointment above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    {['Token', 'Doctor', 'Patient', 'Time', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(appt => {
                    const isActive = ['BOOKED', 'ARRIVED', 'IN_PROGRESS'].includes(appt.status);
                    return (
                      <tr key={appt.id} className={`transition-all ${appt.id === nowServing?.id ? 'bg-cyan-500/5 border-l-2 border-cyan-500' : 'hover:bg-white/5'}`}>
                        <td className="px-4 py-3">
                          <TokenBadge token={appt.token_display} />
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">{appt.doctor_name || '—'}</td>
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{appt.patient_name || '—'}</p>
                          {appt.patient_phone && <p className="text-slate-500 text-xs">{appt.patient_phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmt12h(appt.time)}</td>
                        <td className="px-4 py-3"><StatusPill status={appt.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {['RECEPTIONIST', 'ADMIN'].includes(role) && appt.status === 'BOOKED' && (
                              <button onClick={() => updateStatus(appt.id, 'ARRIVED')} disabled={updating === appt.id}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors disabled:opacity-40 whitespace-nowrap">
                                {updating === appt.id ? '…' : 'Check In'}
                              </button>
                            )}
                            {['RECEPTIONIST', 'ADMIN'].includes(role) && appt.status === 'ARRIVED' && (
                              <button onClick={() => updateStatus(appt.id, 'IN_PROGRESS')} disabled={updating === appt.id}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors disabled:opacity-40 whitespace-nowrap">
                                {updating === appt.id ? '…' : 'Start'}
                              </button>
                            )}
                            {['RECEPTIONIST', 'ADMIN'].includes(role) && appt.status === 'IN_PROGRESS' && (
                              <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 whitespace-nowrap">
                                {updating === appt.id ? '…' : 'Complete'}
                              </button>
                            )}
                            {['RECEPTIONIST', 'ADMIN'].includes(role) && ['BOOKED', 'ARRIVED'].includes(appt.status) && (
                              <button onClick={() => { if (window.confirm('Cancel this appointment?')) updateStatus(appt.id, 'CANCELLED'); }} disabled={updating === appt.id}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40">
                                {updating === appt.id ? '…' : '✕'}
                              </button>
                            )}
                            {!isActive && <span className="text-slate-600 text-xs italic">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
