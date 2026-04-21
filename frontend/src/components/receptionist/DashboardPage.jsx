import React from 'react';

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${color}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-2xl font-black text-white">{value ?? 0}</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage({ stats }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const cards = [
    { label: 'Total Today',      value: stats.total_patients, icon: '📋', color: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Arrived',          value: stats.arrived,        icon: '🏥', color: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Pending / Booked', value: stats.pending,        icon: '⏳', color: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Completed',        value: stats.completed,      icon: '✅', color: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Cancelled',        value: stats.cancelled,      icon: '❌', color: 'bg-red-500/10 border-red-500/20' },
    { label: 'Active Doctors',   value: stats.active_doctors, icon: '👨‍⚕️', color: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Simple tip */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-300">
        💡 Use <strong>Queue Management</strong> to mark arrivals, enter vitals, and manage today's appointments.
      </div>
    </div>
  );
}
