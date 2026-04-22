import React, { useState } from 'react';
import API from '../../services/api';

const TABS = [
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'lab',          label: 'Lab Reports' },
  { id: 'history',      label: 'Visit History' },
];

function PrescriptionsTab({ appointments }) {
  const withRx = appointments.filter((a) => {
    if (a.status !== 'COMPLETED' || !a.prescription) return false;
    if (Array.isArray(a.prescription) && a.prescription.length === 0) return false;
    return true;
  });

  const handlePrint = (appt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to download your prescription.");
      return;
    }
    const medsHtml = Array.isArray(appt.prescription)
      ? appt.prescription.map(m => `<li><strong>${m.medicine}</strong> ${m.dosage ? `(${m.dosage})` : ''} - ${m.frequency || ''} for ${m.duration || ''}</li>`).join('')
      : `<p>${appt.prescription}</p>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${appt.date}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #0284c7; margin-bottom: 5px; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .meds { margin: 30px 0; }
            .footer { margin-top: 50px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ClinicPortal Prescription</h1>
            <p><strong>Doctor:</strong> ${appt.doctor_name || `Dr. #${appt.doctor}`}</p>
            <p><strong>Date:</strong> ${appt.date}</p>
          </div>
          
          <div class="meds">
            <h3>Medicines:</h3>
            <ul>${medsHtml}</ul>
          </div>

          ${appt.advice ? `<div><h3>Advice:</h3><p>${appt.advice}</p></div>` : ''}
          ${appt.doctor_notes ? `<div><h3>Notes:</h3><p>${appt.doctor_notes}</p></div>` : ''}

          <div class="footer">
            <p>This is a digitally generated prescription. Please consult your doctor before changing any medication.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
            <button onClick={() => handlePrint(appt)} className="text-xs font-bold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors">
              ⬇ Download
            </button>
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

function LabReportsTab({ labReports, onReportsChanged }) {
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
      if (onReportsChanged) onReportsChanged();
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
      if (onReportsChanged) onReportsChanged();
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
            <div key={report.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{report.file_url?.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
                <div>
                  <a href={report.file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cyan-400 hover:underline">{report.title}</a>
                  <p className="text-xs text-slate-500">{new Date(report.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(report.id)} className="text-slate-500 hover:text-red-400 p-2">✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <svg className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-semibold text-slate-400">No Lab Reports</p>
          <p className="text-xs text-slate-600">Upload your lab reports above.</p>
        </div>
      )}
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

export default function MedicalRecords({ appointments, labReports, onReportsChanged }) {
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
          {activeTab === 'lab'           && <LabReportsTab labReports={labReports} onReportsChanged={onReportsChanged} />}
          {activeTab === 'history'       && <VisitHistoryTab appointments={appointments} />}
        </div>
      </div>
    </section>
  );
}
