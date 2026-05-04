import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function getDateRange(filter) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (filter === 'today') return { from: today, to: today };
  if (filter === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  // month
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: d.toISOString().slice(0, 10), to: today };
}

// ── Skeleton ──────────────────────────────────────────────────────────
function Skeleton({ cls }) {
  return <div className={`animate-pulse rounded-xl bg-slate-800 ${cls}`} />;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} cls="h-32" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton cls="h-64 lg:col-span-2" />
        <Skeleton cls="h-64" />
      </div>
      <Skeleton cls="h-72" />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon, gradient, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden w-full text-left rounded-2xl p-5 border transition-all duration-200 group shadow-lg hover:-translate-y-0.5
        ${active
          ? 'border-white/30 bg-slate-800 ring-1 ring-white/20'
          : 'border-white/10 bg-slate-900/60 hover:border-white/20 hover:bg-slate-800/70'}`}
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${gradient} group-hover:opacity-30 transition-opacity`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow mb-4`}>
        {icon}
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value ?? '—'}</p>
    </button>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  BOOKED:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ARRIVED:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  IN_PROGRESS: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  COMPLETED:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED:   'bg-red-500/15 text-red-400 border-red-500/30',
  NO_SHOW:     'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] || ''}`}>
      {status}
    </span>
  );
}

// ── Activity Log ──────────────────────────────────────────────────────
function ActivityLog({ appointments }) {
  const recent = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
      .slice(0, 6)
      .map(a => ({
        text: `${a.patient_name || 'Patient'} → ${a.doctor_name || 'Doctor'}`,
        sub: `${a.date} · ${a.status}`,
        status: a.status,
      }));
  }, [appointments]);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 h-full">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h3>
      {recent.length === 0
        ? <p className="text-slate-500 text-sm">No activity yet.</p>
        : (
          <ul className="space-y-3">
            {recent.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${r.status === 'COMPLETED' ? 'bg-emerald-400' : r.status === 'CANCELLED' ? 'bg-red-400' : 'bg-blue-400'}`} />
                <div>
                  <p className="text-white text-xs font-semibold">{r.text}</p>
                  <p className="text-slate-500 text-[11px]">{r.sub}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

// ── Revenue Chart ─────────────────────────────────────────────────────
function RevenueChart({ appointments }) {
  const data = useMemo(() => {
    const map = {};
    appointments
      .filter(a => a.status === 'COMPLETED')
      .forEach(a => {
        const name = (a.doctor_name || 'Unknown').replace('Dr. ', '').split(' ')[0];
        map[name] = (map[name] || 0) + Number(a.fee || 0);
      });
    return Object.entries(map).map(([name, revenue]) => ({ name, revenue }));
  }, [appointments]);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Revenue per Doctor</h3>
      {data.length === 0
        ? <p className="text-slate-500 text-sm py-8 text-center">No completed appointments yet.</p>
        : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="url(#bar-grad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  );
}

// ── Appointment Table ─────────────────────────────────────────────────
const STATUS_FILTERS = ['ALL', 'BOOKED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function AppointmentTable({ appointments, activeCard }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // If a stat card set a filter, sync it
  useEffect(() => {
    if (activeCard === 'appointments') setStatusFilter('ALL');
    else if (activeCard === 'revenue') setStatusFilter('COMPLETED');
  }, [activeCard]);

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchSearch = !search || 
        (a.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.contact || '').includes(search);
      return matchStatus && matchSearch;
    });
  }, [appointments, statusFilter, search]);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-white/10">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest shrink-0">Appointments</h3>
        <div className="flex flex-wrap gap-2 flex-1">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition
                ${statusFilter === s ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search patient or phone…"
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-52"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['Token', 'Patient', 'Doctor', 'Date', 'Time', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-slate-500 py-10 text-sm">No appointments found.</td></tr>
            ) : filtered.slice(0, 30).map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 font-black text-cyan-400">#{a.token_number}</td>
                <td className="px-4 py-3 font-semibold text-white">{a.patient_name || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{a.doctor_name || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{a.date}</td>
                <td className="px-4 py-3 text-slate-400">{a.time?.slice(0, 5)}</td>
                <td className="px-4 py-3"><Badge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 30 && (
        <p className="text-xs text-slate-500 text-center py-3">Showing 30 of {filtered.length}</p>
      )}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────
function Navbar({ onLogout }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20">
            <span className="text-base">👑</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Clinic Admin</h1>
            <p className="text-[9px] uppercase tracking-widest text-purple-400 font-bold">System Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/staff"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition">
            👥 Staff Management
          </Link>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]             = useState(null);
  const [appointments, setAppts]      = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [timeFilter, setTimeFilter]   = useState('today');
  const [activeCard, setActiveCard]   = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('dashboard/admin/'),
      API.get('appointments/'),
    ])
      .then(([statsRes, apptRes]) => {
        setStats(statsRes.data.data || statsRes.data);
        setAppts(apptRes.data.data || []);
      })
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Frontend time filter
  const filteredAppts = useMemo(() => {
    const { from, to } = getDateRange(timeFilter);
    return appointments.filter(a => a.date >= from && a.date <= to);
  }, [appointments, timeFilter]);

  // Derived stats from filtered appointments
  const derivedStats = useMemo(() => {
    const completed = filteredAppts.filter(a => a.status === 'COMPLETED');
    const revenue   = completed.reduce((s, a) => s + Number(a.fee || 0), 0);
    return { revenue, total: filteredAppts.length };
  }, [filteredAppts]);

  if (error) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-center text-red-400 bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
        <p className="font-bold text-white mb-2">Failed to load</p>
        <p className="text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2 bg-red-500 text-white rounded-xl font-bold text-sm">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans">
      <Navbar onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── Title + Time Filter ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">System Overview</h2>
            <p className="text-slate-400 text-sm">Clinic performance & management</p>
          </div>
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-white/10">
            {[['today','Today'], ['week','This Week'], ['month','This Month']].map(([v, l]) => (
              <button key={v} onClick={() => setTimeFilter(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${timeFilter === v ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? <SkeletonDashboard /> : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Users" value={stats?.total_users}
                gradient="from-blue-500 to-cyan-500" active={activeCard === 'users'}
                onClick={() => setActiveCard(p => p === 'users' ? null : 'users')}
                icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
              />
              <StatCard
                label="Total Doctors" value={stats?.total_doctors}
                gradient="from-indigo-500 to-purple-500" active={activeCard === 'doctors'}
                onClick={() => setActiveCard(p => p === 'doctors' ? null : 'doctors')}
                icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
              />
              <StatCard
                label={`Appointments (${timeFilter})`} value={derivedStats.total}
                gradient="from-emerald-500 to-teal-500" active={activeCard === 'appointments'}
                onClick={() => setActiveCard(p => p === 'appointments' ? null : 'appointments')}
                icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
              />
              <StatCard
                label={`Revenue (${timeFilter})`} value={fmt(derivedStats.revenue)}
                gradient="from-amber-500 to-orange-500" active={activeCard === 'revenue'}
                onClick={() => setActiveCard(p => p === 'revenue' ? null : 'revenue')}
                icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              />
            </div>

            {/* ── Chart + Activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <RevenueChart appointments={filteredAppts} />
              </div>
              <ActivityLog appointments={appointments} />
            </div>

            {/* ── Today Breakdown ── */}
            {stats?.today && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  ['Total Today', stats.today.total, 'text-white', 'bg-white/5 border-white/10'],
                  ['Pending',     stats.today.pending,   'text-blue-400',    'bg-blue-500/10 border-blue-500/20'],
                  ['Arrived',     stats.today.arrived,   'text-amber-400',   'bg-amber-500/10 border-amber-500/20'],
                  ['Completed',   stats.today.completed, 'text-emerald-400', 'bg-emerald-500/10 border-emerald-500/20'],
                  ['Cancelled',   stats.today.cancelled, 'text-red-400',     'bg-red-500/10 border-red-500/20'],
                ].map(([label, val, color, bg]) => (
                  <div key={label} className={`text-center rounded-2xl py-4 border ${bg}`}>
                    <p className={`text-2xl font-black ${color}`}>{val ?? 0}</p>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Appointment Table ── */}
            <AppointmentTable appointments={filteredAppts} activeCard={activeCard} />
          </>
        )}
      </main>
    </div>
  );
}
