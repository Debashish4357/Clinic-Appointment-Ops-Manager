import React, { useState } from 'react';
import PrescriptionCard from './PrescriptionCard';

const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

const TABS = [
  { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
  { id: 'lab',           label: 'Lab Reports',   icon: '🧪' },
  { id: 'history',       label: 'Visit History',  icon: '🕐' },
];

/* ─── Prescriptions tab ──────────────────────────────────────── */
function PrescriptionsTab({ appointments }) {
  const withRx = appointments
    .filter(a => a.status === 'COMPLETED' && (a.prescription || a.advice))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!withRx.length)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl">💊</span>
        <p className="text-slate-400 font-semibold">No prescriptions yet</p>
        <p className="text-slate-500 text-sm">They'll appear here after a completed appointment</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {withRx.map(a => (
        <PrescriptionCard
          key={a.id}
          appt={a}
          onDownload={() => console.log('Download PDF for appointment', a.id)}
        />
      ))}
    </div>
  );
}

/* ─── Lab Reports tab ────────────────────────────────────────── */
function LabTab() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="text-4xl">🧪</span>
      <p className="text-slate-400 font-semibold">Lab Reports</p>
      <p className="text-slate-500 text-sm">Your lab results will appear here once uploaded by your doctor</p>
      <span className="mt-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
        Coming Soon
      </span>
    </div>
  );
}

/* ─── Visit History tab ──────────────────────────────────────── */
function HistoryTab({ appointments }) {
  const sorted = [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!sorted.length)
    return (
      <div className="py-10 text-center">
        <p className="text-slate-400 text-sm">No visit history found.</p>
      </div>
    );

  return (
    <div className="space-y-2">
      {sorted.map(a => (
        <div key={a.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3 hover:bg-slate-800 transition">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black text-slate-300">
              {a.doctor_name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{a.doctor_name || `Doctor #${a.doctor}`}</p>
              <p className="text-xs text-slate-400">{a.date} · {a.time}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[a.status] || 'bg-slate-700 text-slate-300'}`}>
            {a.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function HealthHistory({ appointments }) {
  const [tab, setTab] = useState('prescriptions');

  // Past = completed / cancelled / no_show
  const past = appointments.filter(a =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)
  );

  return (
    <section>
      <h2 className="mb-4 text-lg font-black text-white">Health History</h2>

      <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-md overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition ${
                tab === t.id
                  ? 'border-b-2 border-cyan-400 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
              <span className="text-base">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === 'prescriptions' && <PrescriptionsTab appointments={past} />}
          {tab === 'lab'           && <LabTab />}
          {tab === 'history'       && <HistoryTab appointments={appointments} />}
        </div>
      </div>
    </section>
  );
}
