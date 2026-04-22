import React, { useState } from 'react';

/* ── Simple print-to-PDF helper ─────────────────────────────────────── */
function printPrescription(appt) {
  const meds = Array.isArray(appt.prescription) ? appt.prescription : [];
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Prescription — ${appt.date}</title>
    <style>
      body{font-family:sans-serif;padding:40px;color:#111;max-width:700px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px}
      .meta{color:#555;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#f1f5f9;text-align:left;padding:8px 12px;font-size:12px;text-transform:uppercase}
      td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px}
      .advice{margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px}
      @media print{button{display:none}}
    </style></head><body>
    <h1>Prescription</h1>
    <div class="meta">
      Doctor: ${appt.doctor_name || `#${appt.doctor}`} &nbsp;|&nbsp;
      Date: ${appt.date} &nbsp;|&nbsp; Time: ${appt.time}
    </div>
    ${meds.length > 0 ? `
      <table>
        <thead><tr>
          <th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th>
        </tr></thead>
        <tbody>
          ${meds.map(m => `<tr>
            <td>${m.name || '—'}</td>
            <td>${m.dosage || '—'}</td>
            <td>${m.frequency || '—'}</td>
            <td>${m.duration || '—'}</td>
            <td>${m.instructions || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<p style="color:#888">No medicines listed.</p>'}
    ${appt.advice ? `<div class="advice"><strong>Doctor's Advice:</strong><p>${appt.advice}</p></div>` : ''}
    ${appt.doctor_remark ? `<div class="advice"><strong>Remarks:</strong><p>${appt.doctor_remark}</p></div>` : ''}
    <script>window.print();window.close();</script>
    </body></html>
  `);
  win.document.close();
}

/* ── PrescriptionCard ─────────────────────────────────────────────────── */
export default function PrescriptionCard({ appt }) {
  const [expanded, setExpanded] = useState(false);
  const meds = Array.isArray(appt.prescription) ? appt.prescription : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/60 overflow-hidden shadow-md hover:border-white/20 transition">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-sm font-black">
            {appt.doctor_name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{appt.doctor_name || `Doctor #${appt.doctor}`}</p>
            <p className="text-xs text-slate-400">
              {appt.date} · {appt.time?.slice(0, 5)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            {meds.length} medicine{meds.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Medicines */}
      <div className="px-5 py-4">
        {meds.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No medicines listed.</p>
        ) : (
          <div className="space-y-2">
            {(expanded ? meds : meds.slice(0, 2)).map((med, i) => (
              <div key={i} className="flex flex-wrap items-start gap-2 rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{med.name || '—'}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {med.dosage     && <span className="text-xs text-slate-400">💊 {med.dosage}</span>}
                    {med.frequency  && <span className="text-xs text-slate-400">🔁 {med.frequency}</span>}
                    {med.duration   && <span className="text-xs text-slate-400">⏳ {med.duration}</span>}
                  </div>
                  {med.instructions && (
                    <p className="mt-1.5 text-xs text-cyan-400/80 italic">
                      ℹ️ {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {meds.length > 2 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition mt-1"
              >
                {expanded ? '▲ Show less' : `▼ Show ${meds.length - 2} more`}
              </button>
            )}
          </div>
        )}

        {/* Doctor advice / remarks */}
        {(appt.advice || appt.doctor_remark) && (
          <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Doctor's Note</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {appt.advice || appt.doctor_remark}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-1 rounded-xl border border-white/10 bg-slate-800 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            {expanded ? 'Collapse' : 'View Details'}
          </button>
          <button
            onClick={() => printPrescription(appt)}
            className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            ↓ Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
