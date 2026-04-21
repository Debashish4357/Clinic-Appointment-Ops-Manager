import React from 'react';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsCards({ upcoming, appointments }) {
  // Average wait time from upcoming appointments that have an estimated_wait_time
  const waits = upcoming
    .map((a) => a.estimated_wait_time)
    .filter((w) => w !== null && w !== undefined && w !== '');
  const avgWait =
    waits.length > 0
      ? Math.round(waits.reduce((s, v) => s + Number(v), 0) / waits.length)
      : null;

  // Last visit date — most recent COMPLETED appointment
  const completed = appointments
    .filter((a) => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastVisit = completed[0]?.date || null;

  const stats = [
    {
      icon: (
        <svg className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Upcoming',
      value: upcoming.length,
      sub: upcoming.length === 1 ? '1 appointment' : `${upcoming.length} appointments`,
      color: 'bg-blue-500/20',
    },
    {
      icon: (
        <svg className="h-6 w-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Avg Wait Time',
      value: avgWait !== null ? `${avgWait} min` : '—',
      sub: 'from upcoming appointments',
      color: 'bg-amber-500/20',
    },
    {
      icon: (
        <svg className="h-6 w-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Last Visit',
      value: lastVisit || '—',
      sub: completed[0] ? `Dr. ${completed[0].doctor_name || completed[0].doctor}` : 'No visits yet',
      color: 'bg-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
