import React, { useState } from 'react';
import API from '../../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
};

function AppointmentCard({ appt, onCancel, onReschedule }) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(true);
    try {
      await API.patch(`appointments/${appt.id}/`, { status: 'CANCELLED' });
      onCancel(appt.id);
    } catch {
      alert('Could not cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-md transition hover:border-white/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Doctor + date/time */}
        <div>
          <p className="font-bold text-white text-base">
            {appt.doctor_name || `Doctor #${appt.doctor}`}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {appt.date} &nbsp;·&nbsp; {appt.time}
          </p>
          {appt.token_number && (
            <p className="mt-1 text-xs text-cyan-400 font-semibold">
              Token #{appt.token_number}
              {appt.estimated_wait_time != null && (
                <span className="ml-2 text-slate-400 font-normal">
                  · ~{appt.estimated_wait_time} min wait
                </span>
              )}
            </p>
          )}
        </div>

        {/* Status */}
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[appt.status] || 'bg-slate-700 text-slate-300'}`}>
          {appt.status}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onReschedule(appt)}
          className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
        >
          Reschedule
        </button>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

export default function UpcomingAppointments({ appointments, onCancel, onReschedule }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayObj = new Date(today + 'T00:00:00');

  const upcoming = appointments.filter((a) => {
    const d = new Date(a.date + 'T00:00:00');
    return a.status === 'BOOKED' && d >= todayObj;
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Upcoming Appointments</h2>
        {upcoming.length > 0 && (
          <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-300">
            {upcoming.length}
          </span>
        )}
      </div>

      {upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onCancel={onCancel}
              onReschedule={onReschedule}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
          <p className="text-slate-400 text-sm">No upcoming appointments.</p>
          <p className="text-slate-500 text-xs mt-1">Use the button above to book one.</p>
        </div>
      )}
    </section>
  );
}
