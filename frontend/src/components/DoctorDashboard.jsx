import React, { useEffect, useState } from 'react';
import API from '../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total_patients: 0, completed: 0, pending: 0, cancelled: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Prescription modal
  const [prescModal, setPrescModal] = useState(null); // appointment id
  const [prescForm, setPrescForm] = useState({ prescription: '', doctor_remark: '', advice: '' });
  const [prescSaving, setPrescSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    API.get('dashboard/doctor/')
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setAppointments(d.appointments || []);
        setStats(d.stats || {});
      })
      .catch(() => setError('Failed to load doctor data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ── Mark Completed ────────────────────────────────────────────────────────
  const markCompleted = async (id) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/`, { status: 'COMPLETED' });
      fetchData();
    } catch {
      alert('Failed to update appointment.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Open prescription form ────────────────────────────────────────────────
  const openPrescription = (appt) => {
    setPrescModal(appt.id);
    setPrescForm({
      prescription: appt.prescription || '',
      doctor_remark: appt.doctor_remark || '',
      advice: appt.advice || '',
    });
  };

  const savePrescription = async () => {
    setPrescSaving(true);
    try {
      await API.patch(`appointments/${prescModal}/`, prescForm);
      setPrescModal(null);
      fetchData();
    } catch {
      alert('Failed to save prescription.');
    } finally {
      setPrescSaving(false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );

  if (error)
    return <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center">{error}</div>;

  const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Doctor Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Today's schedule and patient overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: stats.total_patients, icon: '👥', color: 'from-blue-600/20 to-blue-500/5 border-blue-500/20' },
          { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-amber-600/20 to-amber-500/5 border-amber-500/20' },
          { label: 'Earnings', value: `₹${Number(stats.earnings).toLocaleString()}`, icon: '💰', color: 'from-purple-600/20 to-purple-500/5 border-purple-500/20' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{icon}</span>
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Schedule ──────────────────────────────────────────────────── */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-white">Today's Appointments</h2>
          <button onClick={fetchData}
            className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors">
            ↻ Refresh
          </button>
        </div>

        {appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black">
                        {appt.token_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.time}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold text-sm">{appt.patient_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {appt.patient_age && <span>{appt.patient_age}yr</span>}
                        {appt.patient_gender && <span>· {appt.patient_gender}</span>}
                        {appt.appointment_type === 'FOLLOWUP' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold ml-1">Follow-Up</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {appt.reason ? <p className="text-xs text-slate-500 italic max-w-[180px] truncate">"{appt.reason}"</p> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[appt.status] || 'bg-slate-600 text-slate-300'}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {appt.status === 'BOOKED' && (
                          <>
                            <button
                              onClick={() => markCompleted(appt.id)}
                              disabled={updating === appt.id}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 whitespace-nowrap">
                              {updating === appt.id ? '...' : 'Mark Completed'}
                            </button>
                            <button
                              onClick={() => openPrescription(appt)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors whitespace-nowrap">
                              📝 Prescription
                            </button>
                          </>
                        )}
                        {appt.status === 'COMPLETED' && appt.prescription && (
                          <button
                            onClick={() => openPrescription(appt)}
                            className="text-xs font-medium px-2 py-1 rounded-lg text-slate-400 hover:text-purple-300 transition-colors whitespace-nowrap">
                            View Rx
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">🩺</p>
            <p className="text-slate-400 text-sm">No appointments found</p>
          </div>
        )}
      </div>

      {/* ── Prescription Modal ────────────────────────────────────────────────── */}
      {prescModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">📝 Prescription</h3>
              <button onClick={() => setPrescModal(null)}
                className="text-slate-400 hover:text-white transition-colors text-xl leading-none">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Prescription</label>
                <textarea rows="3" value={prescForm.prescription}
                  onChange={(e) => setPrescForm({ ...prescForm, prescription: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg – 1 tab twice daily for 5 days"
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Doctor's Remark</label>
                <textarea rows="2" value={prescForm.doctor_remark}
                  onChange={(e) => setPrescForm({ ...prescForm, doctor_remark: e.target.value })}
                  placeholder="e.g. Patient shows signs of viral fever"
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Advice</label>
                <textarea rows="2" value={prescForm.advice}
                  onChange={(e) => setPrescForm({ ...prescForm, advice: e.target.value })}
                  placeholder="e.g. Rest for 3 days, drink fluids"
                  className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setPrescModal(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button onClick={savePrescription} disabled={prescSaving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-blue-500 text-white disabled:opacity-50 shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5">
                {prescSaving ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
