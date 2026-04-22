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
import API from '../../services/api';

function LabTab({ labReports, onReportsChanged }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name);

    setUploading(true);
    try {
      await API.post('patient/lab-reports/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onReportsChanged) onReportsChanged(true);
    } catch (err) {
      alert('Failed to upload lab report.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await API.delete(`patient/lab-reports/${id}/`);
      if (onReportsChanged) onReportsChanged(true);
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white">Upload New Report</h3>
          <p className="text-xs text-slate-400">PDFs or Images (max 5MB)</p>
        </div>
        <div>
          <input type="file" id="lab-upload" className="hidden" accept=".pdf,image/*" onChange={handleUpload} disabled={uploading} />
          <label htmlFor="lab-upload" className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${uploading ? 'bg-slate-600' : 'bg-cyan-600 hover:bg-cyan-500'}`}>
            {uploading ? 'Uploading...' : 'Browse File'}
          </label>
        </div>
      </div>

      {labReports && labReports.length > 0 ? (
        <div className="space-y-2">
          {labReports.map(report => (
            <div key={report.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{report.file_url?.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
                <div>
                  <a href={report.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-400 hover:underline">{report.title}</a>
                  <p className="text-xs text-slate-500">{new Date(report.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(report.id)} className="text-slate-500 hover:text-red-400 p-2 transition">✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">🧪</span>
          <p className="text-slate-400 font-semibold">Lab Reports</p>
          <p className="text-slate-500 text-sm">Your lab results will appear here once uploaded by your doctor, or you can upload them yourself!</p>
        </div>
      )}
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
export default function HealthHistory({ appointments, labReports, onReportsChanged }) {
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
          {tab === 'lab'           && <LabTab labReports={labReports} onReportsChanged={onReportsChanged} />}
          {tab === 'history'       && <HistoryTab appointments={appointments} />}
        </div>
      </div>
    </section>
  );
}
