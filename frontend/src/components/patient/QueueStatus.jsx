import React from 'react';

/* ── Status step tracker ─────────────────────────────────────────────── */
const STEPS = [
  { key: 'BOOKED',      label: 'Booked',      icon: '📋', color: 'blue' },
  { key: 'ARRIVED',     label: 'Arrived',      icon: '🚶', color: 'amber' },
  { key: 'IN_PROGRESS', label: 'In Progress',  icon: '🩺', color: 'cyan' },
  { key: 'COMPLETED',   label: 'Completed',    icon: '✅', color: 'emerald' },
];

const STEP_ACTIVE_CLS = {
  blue:    'border-blue-400 bg-blue-500/20 text-blue-300 ring-4 ring-blue-500/15',
  amber:   'border-amber-400 bg-amber-500/20 text-amber-300 ring-4 ring-amber-500/15',
  cyan:    'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-4 ring-cyan-500/15',
  emerald: 'border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-4 ring-emerald-500/15',
};

function StatusTracker({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
        <span className="text-xl">❌</span>
        <span className="text-sm font-bold text-red-400">Appointment Cancelled</span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.key === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIdx;
        const isActive  = i === currentIdx;
        const isPending = i > currentIdx;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center shrink-0">
              <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-base transition-all duration-300 ${
                isDone    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                isActive  ? STEP_ACTIVE_CLS[step.color] :
                            'border-slate-700 bg-slate-800 text-slate-600'
              }`}>
                {isDone ? '✓' : step.icon}
              </div>
              <span className={`mt-1.5 text-[10px] font-semibold text-center leading-tight max-w-[56px] ${
                isDone    ? 'text-emerald-400' :
                isActive  ? 'text-white' :
                            'text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-all duration-500 ${
                i < currentIdx ? 'bg-emerald-500' : 'bg-slate-800'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Queue Status card ─────────────────────────────────────────────────── */
export default function QueueStatus({ appointments }) {
  const today = new Date().toISOString().slice(0, 10);

  // Active appointment = today, not cancelled/completed
  const todayActive = appointments.filter(
    a => a.date === today && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)
  );

  // Queue: sort by token_number
  const queue = [...todayActive].sort((a, b) => (a.token_number ?? 99) - (b.token_number ?? 99));

  const inProgress = queue.find(a => a.status === 'IN_PROGRESS');
  const nowServing = inProgress || queue.find(a => a.status === 'ARRIVED') || null;

  const myAppt = queue[0] || null; // the patient's own earliest token

  const patientsAhead = myAppt
    ? queue.filter(a => (a.token_number ?? 99) < (myAppt.token_number ?? 0)).length
    : 0;
  const estWait = patientsAhead * 15;

  if (!myAppt) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-md">
        <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">🔴 Live Queue</h3>
        <p className="text-center text-slate-500 text-sm py-4">No active appointments today</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-md shadow-cyan-500/5">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-cyan-400">🔴 Live Queue Status</h3>

      {/* Token spotlight */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-white/5 px-4 py-3 mb-4">
        <div>
          <p className="text-xs text-slate-500 font-semibold mb-0.5">Now Serving</p>
          <p className="text-2xl font-black text-white">
            {nowServing ? `#${nowServing.token_number}` : '—'}
          </p>
        </div>
        <div className="h-10 w-px bg-white/10" />
        <div className="text-right">
          <p className="text-xs text-slate-500 font-semibold mb-0.5">Your Token</p>
          <p className="text-2xl font-black text-cyan-400">#{myAppt.token_number}</p>
        </div>
      </div>

      {/* Wait estimate */}
      <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 mb-4">
        <span className="text-xs font-semibold text-slate-400">Estimated Wait</span>
        <span className="text-sm font-black text-amber-400">
          {patientsAhead === 0 ? "You're next! 🎉" : `~${estWait} min`}
        </span>
      </div>

      {/* Status tracker */}
      <div className="mt-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Progress</p>
        <StatusTracker status={myAppt.status} />
      </div>
    </div>
  );
}
