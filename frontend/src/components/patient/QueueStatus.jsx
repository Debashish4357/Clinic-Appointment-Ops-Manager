import React from 'react';

export default function QueueStatus({ appointments }) {
  const today = new Date().toISOString().slice(0, 10);

  // Find an ARRIVED appointment for today
  const active = appointments.find(
    (a) => a.status === 'ARRIVED' && a.date === today
  );

  if (!active) return null;

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
        <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">
          Live Queue Status
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs font-medium text-slate-400">Now Serving</p>
          <p className="mt-1 text-2xl font-black text-white">
            #{active.now_serving ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Your Token</p>
          <p className="mt-1 text-2xl font-black text-cyan-400">
            #{active.token_number ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Est. Wait</p>
          <p className="mt-1 text-2xl font-black text-amber-400">
            {active.estimated_wait_time ?? '—'}
            {active.estimated_wait_time != null && (
              <span className="ml-1 text-sm font-medium text-amber-400/70">min</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
