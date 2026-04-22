import React, { useState } from 'react';
import API from '../../services/api';

const STATUS_STYLES = {
  BOOKED:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  IN_PROGRESS: 'bg-cyan-500/20  text-cyan-300  border border-cyan-500/30',
  COMPLETED:   'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED:   'bg-red-500/20   text-red-300   border border-red-500/30',
  NO_SHOW:     'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

const STEPS = ['BOOKED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
const STEP_LABEL = { BOOKED: 'Booked', ARRIVED: 'Arrived', IN_PROGRESS: 'In Consult', COMPLETED: 'Done' };

function MiniTracker({ status }) {
  if (status === 'CANCELLED') return (
    <div className="flex items-center gap-1.5 mt-3">
      <span className="h-1.5 flex-1 rounded-full bg-red-500/40" />
      <span className="text-[10px] font-bold text-red-400">CANCELLED</span>
      <span className="h-1.5 flex-1 rounded-full bg-red-500/40" />
    </div>
  );

  const idx = STEPS.indexOf(status);
  return (
    <div className="flex items-center mt-3 gap-0">
      {STEPS.map((s, i) => {
        const done   = i <= idx;
        const active = i === idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center shrink-0">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                done
                  ? active
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-500/20'
                    : 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-600'
              }`}>
                {i < idx ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] mt-0.5 font-medium whitespace-nowrap ${
                done ? (active ? 'text-cyan-400' : 'text-emerald-400') : 'text-slate-600'
              }`}>
                {STEP_LABEL[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-0.5 mb-3 transition-all ${i < idx ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AppCard({ appt, onCancelled, onBook }) {
  const [busy, setBusy] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this appointment?')) return;
    setBusy(true);
    try {
      await API.patch(`appointments/${appt.id}/`, { status: 'CANCELLED' });
      onCancelled(appt.id);
    } catch {
      try { await API.delete(`appointments/${appt.id}/`); onCancelled(appt.id); }
      catch { alert('Could not cancel. Please try again.'); }
    } finally { setBusy(false); }
  };

  const isActive = !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status);

  return (
    <div className={`rounded-2xl border p-5 shadow-md transition hover:shadow-lg ${
      appt.status === 'IN_PROGRESS'
        ? 'border-cyan-500/30 bg-cyan-500/5'
        : appt.status === 'ARRIVED'
        ? 'border-amber-500/20 bg-amber-500/5'
        : 'border-white/10 bg-slate-900'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white text-sm font-black shadow ${
            appt.status === 'IN_PROGRESS' ? 'bg-gradient-to-br from-cyan-600 to-blue-600' :
            appt.status === 'ARRIVED'     ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                                            'bg-gradient-to-br from-blue-600 to-indigo-600'
          }`}>
            {appt.doctor_name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{appt.doctor_name || `Doctor #${appt.doctor}`}</p>
            <p className="text-xs text-slate-400 mt-0.5">{appt.date} · {appt.time?.slice(0, 5)}</p>
            {appt.token_number != null && (
              <p className="text-xs text-cyan-400 font-semibold mt-0.5">
                Token #{appt.token_number}
                {appt.estimated_wait_time > 0 && (
                  <span className="text-slate-500 font-normal ml-1">· ~{appt.estimated_wait_time}m wait</span>
                )}
              </p>
            )}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shrink-0 ${STATUS_STYLES[appt.status] || ''}`}>
          {appt.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Status progress */}
      {isActive && <MiniTracker status={appt.status} />}

      {/* Action buttons */}
      {isActive && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCancel}
            disabled={busy || appt.status === 'IN_PROGRESS'}
            className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Completed info */}
      {appt.status === 'COMPLETED' && (appt.prescription || appt.advice) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <span>💊</span> Prescription available — check Health History
        </div>
      )}
    </div>
  );
}

export default function UpcomingAppointments({ appointments, onCancel, onBook, filterMode = 'upcoming' }) {
  const today    = new Date().toISOString().slice(0, 10);
  const todayObj = new Date(today + 'T00:00:00');

  const active = appointments
    .filter(a => {
      const d = new Date(a.date + 'T00:00:00');
      if (filterMode === 'today') {
        return d.getTime() === todayObj.getTime() && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status);
      }
      if (filterMode === 'previous') {
        return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) || d < todayObj;
      }
      if (filterMode === 'all') {
        return true;
      }
      // default: upcoming
      return !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) && d >= todayObj;
    })
    .sort((a, b) => {
      // Sort IN_PROGRESS and ARRIVED first, then by date+time
      const priority = { IN_PROGRESS: 0, ARRIVED: 1, BOOKED: 2 };
      const pa = priority[a.status] ?? 3;
      const pb = priority[b.status] ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
    });

  const upcomingList = active.filter(a => {
    const d = new Date(a.date + 'T00:00:00');
    return !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) && d >= todayObj;
  });

  const previousList = active.filter(a => {
    const d = new Date(a.date + 'T00:00:00');
    return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) || d < todayObj;
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">
            {filterMode === 'today' ? "Today's Appointments" : filterMode === 'all' ? "Appointment History" : filterMode === 'previous' ? "History" : "Upcoming Appointments"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filterMode === 'all' ? "Your previous and upcoming visits" : filterMode === 'previous' ? "Your past appointments" : "Your scheduled & active visits"}
          </p>
        </div>
        {active.length > 0 && (
          <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-300">
            {active.length}
          </span>
        )}
      </div>

      {active.length > 0 ? (
        <div className="space-y-6">
          {filterMode === 'all' ? (
            <>
              {upcomingList.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h3>
                  <div className="space-y-3">
                    {upcomingList.map(a => <AppCard key={a.id} appt={a} onCancelled={onCancel} onBook={onBook} />)}
                  </div>
                </div>
              )}
              {previousList.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6">Previous</h3>
                  <div className="space-y-3">
                    {previousList.map(a => <AppCard key={a.id} appt={a} onCancelled={onCancel} onBook={onBook} />)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {active.map(a => <AppCard key={a.id} appt={a} onCancelled={onCancel} onBook={onBook} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
            <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-300 font-bold text-base">No appointments found</p>
          {filterMode !== 'all' && filterMode !== 'previous' && (
            <>
              <p className="text-slate-500 text-sm mt-1">Ready to see a doctor? Book your visit today.</p>
              <button
                onClick={onBook}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 transition shadow-lg shadow-cyan-500/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Book Appointment
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
