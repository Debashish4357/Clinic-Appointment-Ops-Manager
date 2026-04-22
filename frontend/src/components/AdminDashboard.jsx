import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

/* ─── Stat Card ──────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color, gradient }) => (
  <div className="relative overflow-hidden bg-slate-900/50 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all duration-300 group shadow-lg">
    <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${gradient} transition-transform group-hover:scale-110`} />
    <div className="flex items-center justify-between mb-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-4xl font-black text-white">{value ?? '—'}</p>
    </div>
  </div>
);

/* ─── Input helper ───────────────────────────────────────────────── */
const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition-colors';

/* ─── Create Receptionist Form ───────────────────────────────────── */
const CreateReceptionistForm = () => {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await API.post('create-receptionist/', form);
      setMsg({ type: 'success', text: res.data.message });
      setForm({ username: '', password: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create receptionist.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-white text-xl">New Receptionist</h2>
          <p className="text-cyan-400 text-sm mt-0.5">Register a staff account</p>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span className="text-xl">{msg.type === 'success' ? '✅' : '❌'}</span>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
          <input
            type="text" required
            value={form.username}
            onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
            className={inputCls}
            placeholder="e.g. jdoe_frontdesk"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
          <input
            type="password" required minLength={6}
            value={form.password}
            onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
            className={inputCls}
            placeholder="Min. 6 characters"
          />
        </div>
        <button
          type="submit" disabled={saving}
          className="w-full mt-2 py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
        >
          {saving ? 'Creating Account...' : 'Create Receptionist'}
        </button>
      </form>
    </div>
  );
};

/* ─── Navbar ─────────────────────────────────────────────────────── */
const Navbar = ({ onLogout }) => (
  <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20">
          <span className="text-lg">👑</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Clinic Admin</h1>
          <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">System Dashboard</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link 
          to="/appointments" 
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-all"
        >
          Book Appointment
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20 transition"
        >
          Logout
        </button>
      </div>
    </div>
  </nav>
);

/* ─── Main Admin Dashboard ───────────────────────────────────────── */
export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('dashboard/admin/')
      .then((res) => setData(res.data.data || res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-purple-400 font-bold tracking-widest uppercase text-sm">Initializing System...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-3xl p-8 max-w-md text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-lg font-bold text-white mb-2">System Error</h2>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition">
            Retry Connection
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-purple-500/30">
      <Navbar onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">System Overview</h2>
          <p className="text-slate-400">Monitor clinic performance, manage staff, and view analytics.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Stats */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard
                label="Total Users" value={data?.total_users} gradient="from-blue-500 to-cyan-500"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              />
              <StatCard
                label="Total Doctors" value={data?.total_doctors} gradient="from-indigo-500 to-purple-500"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              />
              <StatCard
                label="Total Appointments" value={data?.total_appointments} gradient="from-emerald-500 to-teal-500"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard
                label="Total Revenue"
                value={data?.total_revenue !== undefined ? `₹${Number(data.total_revenue).toLocaleString()}` : undefined}
                gradient="from-amber-500 to-orange-500"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

            {/* Today's Breakdown */}
            {data?.today && (
              <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Today's Performance</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                  {[
                    { label: 'Total',     value: data.today.total,     color: 'text-white',       bg: 'bg-white/5 border-white/10' },
                    { label: 'Pending',   value: data.today.pending,   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Arrived',   value: data.today.arrived,   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'Completed', value: data.today.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Cancelled', value: data.today.cancelled, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`text-center rounded-2xl py-5 border ${bg} transition-transform hover:-translate-y-1`}>
                      <p className={`text-3xl font-black ${color}`}>{value ?? 0}</p>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Forms/Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <CreateReceptionistForm />
              
              {/* Quick Links / Additional Admin Tools could go here */}
              <div className="mt-6 bg-slate-900/30 border border-white/5 rounded-2xl p-6 text-center">
                <p className="text-sm text-slate-500 italic">More administrative tools coming soon.</p>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
