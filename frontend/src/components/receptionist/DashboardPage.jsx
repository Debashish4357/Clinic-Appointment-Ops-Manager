import React from 'react';

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 flex items-center gap-4 transition hover:-translate-y-1 hover:shadow-lg ${color}`}>
      <div className="absolute -right-4 -bottom-4 opacity-10 text-6xl pointer-events-none">
        {icon}
      </div>
      <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-3xl shadow-inner backdrop-blur-sm border border-white/5">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black text-white drop-shadow-md">{value ?? 0}</p>
        <p className="text-xs text-white/70 font-bold uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage({ stats }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const cards = [
    { label: 'Total Today',      value: stats.total_patients, icon: '📋', color: 'bg-white/5 backdrop-blur-md border-white/10 shadow-lg' },
    { label: 'Arrived',          value: stats.arrived,        icon: '🏥', color: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 shadow-amber-500/10' },
    { label: 'Pending / Booked', value: stats.pending,        icon: '⏳', color: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/30 shadow-cyan-500/10' },
    { label: 'Completed',        value: stats.completed,      icon: '✅', color: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30 shadow-emerald-500/10' },
    { label: 'Cancelled',        value: stats.cancelled,      icon: '❌', color: 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30 shadow-red-500/10' },
    { label: 'Active Doctors',   value: stats.active_doctors, icon: '👨‍⚕️', color: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 shadow-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white drop-shadow-sm">Overview</h1>
        <div className="flex items-center gap-2 mt-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 text-sm font-medium">{today}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Quick Action Tip */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-6 shadow-lg backdrop-blur-sm">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Fast Operations</h3>
            <p className="text-sm text-cyan-100/80 mt-1">
              Switch to <strong>Queue Management</strong> to process arrivals, manage token flow, and mark appointments as complete in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
