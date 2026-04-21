import React, { useState } from 'react';

const TABS = [
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'lab',          label: 'Lab Reports' },
  { id: 'history',      label: 'Visit History' },
];

function PrescriptionsTab({ appointments }) {
  const withRx = appointments.filter(
    (a) => a.status === 'COMPLETED' && a.prescription
  );

  if (withRx.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No prescriptions on record yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {withRx.map((appt) => (
        <div key={appt.id} className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-white text-sm">
                {appt.doctor_name || `Doctor #${appt.doctor}`}
              </p>
              <p className="text-xs text-slate-400">{appt.date}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-300">
            {Array.isArray(appt.prescription) ? (
              appt.prescription.map((m, i) => (
                <div key={i}>
                  · {m.medicine}
                  {m.dosage && ` (${m.dosage})`}
                  {m.duration && ` – ${m.duration}`}
                </div>
              ))
            ) : (
              <span className="whitespace-pre-line">{appt.prescription}</span>
            )}
          </div>
          {appt.advice && (
            <p className="mt-2 text-xs text-slate-400 italic">Advice: {appt.advice}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function LabReportsTab() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <svg className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-semibold text-slate-400">Lab Reports</p>
      <p className="text-xs text-slate-600">Coming soon — your lab results will appear here.</p>
    </div>
  );
}

function VisitHistoryTab({ appointments }) {
  const visits = [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (visits.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">No visits recorded yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {visits.map((appt) => (
        <div
          key={appt.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-white">
              {appt.doctor_name || `Doctor #${appt.doctor}`}
            </p>
            <p className="text-xs text-slate-400">{appt.date} · {appt.time}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            appt.status === 'COMPLETED'
              ? 'bg-emerald-500/20 text-emerald-300'
              : appt.status === 'CANCELLED'
              ? 'bg-red-500/20 text-red-300'
              : 'bg-slate-700 text-slate-300'
          }`}>
            {appt.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MedicalRecords({ appointments }) {
  const [activeTab, setActiveTab] = useState('prescriptions');

  return (
    <section>
      <h2 className="mb-4 text-lg font-black text-white">Medical Records</h2>

      <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-md overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-cyan-400 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'prescriptions' && <PrescriptionsTab appointments={appointments} />}
          {activeTab === 'lab'           && <LabReportsTab />}
          {activeTab === 'history'       && <VisitHistoryTab appointments={appointments} />}
        </div>
      </div>
    </section>
  );
}
