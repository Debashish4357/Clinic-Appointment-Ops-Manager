import React from 'react';

function Card({ icon, label, value, sub, accent }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-slate-900 p-5 shadow-md transition hover:shadow-lg ${accent.border}`}>
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent.bg}`}>
        {icon}
      </div>
      <p className={`text-2xl font-black ${accent.text}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 truncate">{sub}</p>}
      {/* subtle glow bar at bottom */}
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${accent.bar}`} />
    </div>
  );
}

export default function StatsCards({ upcoming, appointments, profile }) {
  // Live token: find today's ARRIVED or first BOOKED
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date === today);
  const arrived    = todayAppts.find(a => a.status === 'ARRIVED');
  const firstBooked = todayAppts.find(a => a.status === 'BOOKED');
  const nowServing  = arrived?.token_number ?? null;
  const myToken     = arrived?.token_number ?? firstBooked?.token_number ?? null;

  const tokenVal = nowServing && myToken && nowServing !== myToken
    ? `#${nowServing} → #${myToken}`
    : myToken
    ? `#${myToken}`
    : '—';
  const tokenSub = nowServing && myToken && nowServing !== myToken
    ? `Now Serving #${nowServing} · Yours #${myToken}`
    : myToken ? 'Your active token' : 'No active token today';

  // Last visit
  const completed = [...appointments]
    .filter(a => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastVisit = completed[0];

  // Health info
  const bloodGroup = profile?.blood_group;
  const lastBP     = arrived?.bp || firstBooked?.bp || null;

  const cards = [
    {
      icon: (
        <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Upcoming',
      value: upcoming.length,
      sub: upcoming.length === 1 ? '1 appointment scheduled' : `${upcoming.length} appointments`,
      accent: { border: 'border-blue-500/20', bg: 'bg-blue-500/15', text: 'text-white', bar: 'bg-blue-500/50' },
    },
    {
      icon: (
        <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      label: 'Token Status',
      value: tokenVal,
      sub: tokenSub,
      accent: { border: 'border-amber-500/20', bg: 'bg-amber-500/15', text: 'text-amber-300', bar: 'bg-amber-500/50' },
    },
    {
      icon: (
        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Last Visit',
      value: lastVisit?.date || '—',
      sub: lastVisit ? `Dr. ${lastVisit.doctor_name || lastVisit.doctor}` : 'No visits yet',
      accent: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/15', text: 'text-white', bar: 'bg-emerald-500/50' },
    },
    {
      icon: (
        <svg className="h-5 w-5 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      label: 'Health Info',
      value: bloodGroup || '—',
      sub: lastBP ? `BP: ${lastBP}` : 'No vitals on record',
      accent: { border: 'border-rose-500/20', bg: 'bg-rose-500/15', text: 'text-white', bar: 'bg-rose-500/50' },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(c => <Card key={c.label} {...c} />)}
    </div>
  );
}
