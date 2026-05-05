import React, { useState } from 'react';

const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
};

function PrescriptionDetail({ appt }) {
  const { prescription, advice, doctor_remark } = appt;
  if (!prescription && !advice && !doctor_remark) {
    return <p className="text-slate-500 text-xs italic">No clinical notes recorded.</p>;
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-slate-800/60 p-4 sm:grid-cols-3">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-400/70">Prescription</p>
        <div className="text-sm text-slate-300">
          {Array.isArray(prescription) && prescription.length > 0 ? (
            prescription.map((m, i) => (
              <div key={i}>
                · {m.medicine}
                {m.dosage && ` (${m.dosage})`}
                {m.duration && ` – ${m.duration}`}
                {m.frequency && ` [${m.frequency}]`}
              </div>
            ))
          ) : (
            <span className="text-slate-500 italic">{prescription || 'N/A'}</span>
          )}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-400/70">Advice</p>
        <p className="text-sm text-slate-300 whitespace-pre-line">{advice || 'N/A'}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-400/70">Doctor Feedback</p>
        <p className="text-sm text-slate-300 whitespace-pre-line">{doctor_remark || 'N/A'}</p>
      </div>
    </div>
  );
}

function PastCard({ appt }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = appt.prescription || appt.advice || appt.doctor_remark;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-md transition hover:border-white/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white text-base">
            {appt.doctor_name || `Doctor #${appt.doctor}`}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {appt.date} &nbsp;·&nbsp; {appt.time}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[appt.status] || 'bg-slate-700 text-slate-300'}`}>
          {appt.status}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {hasDetails && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            {expanded ? 'Hide Prescription' : 'View Prescription'}
          </button>
        )}
        <button

          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/20"
        >
          Download PDF
        </button>
      </div>

      {expanded && <PrescriptionDetail appt={appt} />}
    </div>
  );
}

export default function PastAppointments({ appointments }) {
  const past = appointments
    .filter((a) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Past Appointments</h2>
        {past.length > 0 && (
          <span className="rounded-full bg-slate-700 border border-white/10 px-2.5 py-0.5 text-xs font-bold text-slate-300">
            {past.length}
          </span>
        )}
      </div>

      {past.length > 0 ? (
        <div className="space-y-3">
          {past.map((appt) => (
            <PastCard key={appt.id} appt={appt} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
          <p className="text-slate-400 text-sm">No past appointments.</p>
        </div>
      )}
    </section>
  );
}
