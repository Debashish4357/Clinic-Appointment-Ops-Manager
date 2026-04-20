import React, { useEffect, useState } from 'react';
import API from '../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

const EMPTY_MED = { medicine: '', dosage: '', duration: '', frequency: '' };

const inputClass =
  'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm';

// ── Smart Queue Banner ──────────────────────────────────────────────────────────
function SmartQueueBanner({ queue }) {
  if (!queue) return null;
  const { now_serving, next_patient, waiting_count } = queue;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* Now Serving */}
      <div className="col-span-1 bg-gradient-to-br from-emerald-600/30 to-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full -translate-y-6 translate-x-6" />
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">🟢 Now Serving</p>
        {now_serving ? (
          <>
            <p className="text-white font-black text-xl leading-tight">{now_serving.patient_name}</p>
            <p className="text-emerald-300/70 text-sm mt-1">Token #{now_serving.token_number}</p>
          </>
        ) : (
          <p className="text-slate-500 italic text-sm mt-1">No active patient</p>
        )}
      </div>

      {/* Next Patient */}
      <div className="col-span-1 bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/5 rounded-full -translate-y-6 translate-x-6" />
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">⏭ Next</p>
        {next_patient ? (
          <>
            <p className="text-white font-black text-xl leading-tight">{next_patient.patient_name}</p>
            <p className="text-blue-300/70 text-sm mt-1">Token #{next_patient.token_number}</p>
          </>
        ) : (
          <p className="text-slate-500 italic text-sm mt-1">Queue empty</p>
        )}
      </div>

      {/* Waiting Count */}
      <div className="col-span-1 bg-gradient-to-br from-purple-600/20 to-purple-500/5 border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">⌛ Waiting</p>
        <p className="text-5xl font-black text-white">{waiting_count}</p>
        <p className="text-slate-400 text-xs mt-1">patients in queue</p>
      </div>
    </div>
  );
}

// ── Vitals Chip ─────────────────────────────────────────────────────────────────
function VitalsChip({ appt }) {
  const hasVitals = appt.bp || appt.heart_rate || appt.weight || appt.temperature;
  if (!hasVitals) return <span className="text-slate-600 text-xs italic">No vitals</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {appt.bp && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500/15 text-red-300 rounded border border-red-500/20">
          BP {appt.bp}
        </span>
      )}
      {appt.heart_rate && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-pink-500/15 text-pink-300 rounded border border-pink-500/20">
          HR {appt.heart_rate}
        </span>
      )}
      {appt.temperature && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-500/15 text-orange-300 rounded border border-orange-500/20">
          {appt.temperature}°F
        </span>
      )}
      {appt.weight && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-500/15 text-sky-300 rounded border border-sky-500/20">
          {appt.weight}kg
        </span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total_patients: 0, completed: 0, pending: 0, cancelled: 0, earnings: 0 });
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Prescription / Complete modal
  const [prescModal, setPrescModal] = useState(null); // { id, readOnly }
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescSaving, setPrescSaving] = useState(false);

  // Patient Info modal
  const [patientModal, setPatientModal] = useState(null);
  const [fetchingPatient, setFetchingPatient] = useState(false);

  const fetchData = () => {
    setLoading(true);
    API.get('dashboard/doctor/')
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setAppointments(d.appointments || []);
        setStats(d.stats || {});
        setQueue(d.queue || null);
      })
      .catch(() => setError('Failed to load doctor data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ── Open Prescription Modal ───────────────────────────────────────────────────
  const openPrescModal = (appt, readOnly = false) => {
    setPrescModal({ id: appt.id, readOnly });
    // Populate from existing prescription or blank
    if (appt.prescription && Array.isArray(appt.prescription) && appt.prescription.length > 0) {
      setMedicines(appt.prescription.map(m => ({
        medicine: m.medicine || '',
        dosage: m.dosage || '',
        duration: m.duration || '',
        frequency: m.frequency || '',
      })));
    } else {
      setMedicines([{ ...EMPTY_MED }]);
    }
    setDoctorNotes(appt.doctor_notes || '');
  };

  // ── Medicine row helpers ──────────────────────────────────────────────────────
  const addMedicine = () => setMedicines(prev => [...prev, { ...EMPTY_MED }]);
  const removeMedicine = (idx) => setMedicines(prev => prev.filter((_, i) => i !== idx));
  const updateMedicine = (idx, field, value) =>
    setMedicines(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));

  // ── Save Prescription + Complete ─────────────────────────────────────────────
  const savePrescription = async () => {
    if (!prescModal) return;
    setPrescSaving(true);
    try {
      // Filter out blank entries
      const cleanMeds = medicines.filter(m => m.medicine.trim());
      await API.patch(`appointments/${prescModal.id}/complete/`, {
        prescription: cleanMeds,
        notes: doctorNotes,
      });
      setPrescModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save prescription.');
    } finally {
      setPrescSaving(false);
    }
  };

  // ── Wait Time Adjust ──────────────────────────────────────────────────────────
  const adjustWaitTime = async (id, change) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/wait-time/`, { change });
      fetchData();
    } catch {
      alert('Failed to update wait time.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Fetch Patient Details ─────────────────────────────────────────────────────
  const fetchPatientDetails = async (patientId) => {
    setFetchingPatient(true);
    try {
      const res = await API.get(`patient/${patientId}/details/`);
      setPatientModal(res.data);
    } catch {
      alert('Failed to load patient details.');
    } finally {
      setFetchingPatient(false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Doctor Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Today's schedule and patient overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Smart Queue Banner ──────────────────────────────────────────────────── */}
      <SmartQueueBanner queue={queue} />

      {/* ── Quick Stats ──────────────────────────────────────────────────────────── */}
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

      {/* ── Today's Schedule ──────────────────────────────────────────────────────── */}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Vitals</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status/Wait</th>
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
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{appt.patient_name}</p>
                        <button
                          onClick={() => fetchPatientDetails(appt.patient_id)}
                          className="hover:text-cyan-400 text-slate-400 transition-colors"
                          title="View Patient Details"
                        >
                          👁
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {appt.patient_age && <span>{appt.patient_age}yr</span>}
                        {appt.patient_gender && <span>· {appt.patient_gender}</span>}
                        {appt.appointment_type === 'FOLLOWUP' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold ml-1">Follow-Up</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {appt.reason
                        ? <p className="text-xs text-slate-500 italic max-w-[150px] truncate">"{appt.reason}"</p>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <VitalsChip appt={appt} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[appt.status] || 'bg-slate-600 text-slate-300'}`}>
                          {appt.status}
                        </span>
                        {(appt.status === 'BOOKED' || appt.status === 'ARRIVED') && (
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>Wait: {appt.estimated_wait_time}m</span>
                            <div className="flex gap-1 bg-white/5 rounded px-1 border border-white/10">
                              <button onClick={() => adjustWaitTime(appt.id, -5)} className="hover:text-red-400 p-0.5" title="-5 Min">➖</button>
                              <button onClick={() => adjustWaitTime(appt.id, 5)} className="hover:text-emerald-400 p-0.5" title="+5 Min">➕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(appt.status === 'BOOKED' || appt.status === 'ARRIVED') && (
                          <button
                            onClick={() => openPrescModal(appt)}
                            disabled={updating === appt.id}
                            title="Complete & Add Prescription"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 text-xs font-bold"
                          >
                            ✔ Complete
                          </button>
                        )}
                        {appt.status === 'COMPLETED' && (
                          <button
                            onClick={() => openPrescModal(appt, true)}
                            className="text-xs font-medium px-2 py-1 rounded-lg text-slate-400 hover:text-purple-300 transition-colors whitespace-nowrap"
                          >
                            📋 View Rx
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
            <p className="text-slate-400 text-sm">No appointments scheduled for today</p>
          </div>
        )}
      </div>

      {/* ── Prescription / Complete Modal ────────────────────────────────────────── */}
      {prescModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-slate-800 z-10">
              <h3 className="font-bold text-white text-lg">
                {prescModal.readOnly ? '📋 Prescription' : '✅ Complete & Generate Prescription'}
              </h3>
              <button onClick={() => setPrescModal(null)} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Medicines Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">💊 Medicines</h4>
                  {!prescModal.readOnly && (
                    <button onClick={addMedicine}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                      + Add Medicine
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400">Medicine #{idx + 1}</span>
                        {!prescModal.readOnly && medicines.length > 1 && (
                          <button onClick={() => removeMedicine(idx)}
                            className="text-red-400 hover:text-red-300 text-xs transition-colors">✕ Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Medicine Name *</label>
                          <input type="text" value={med.medicine} readOnly={prescModal.readOnly}
                            onChange={e => updateMedicine(idx, 'medicine', e.target.value)}
                            placeholder="e.g. Paracetamol" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Dosage</label>
                          <input type="text" value={med.dosage} readOnly={prescModal.readOnly}
                            onChange={e => updateMedicine(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 500mg" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Frequency</label>
                          <input type="text" value={med.frequency} readOnly={prescModal.readOnly}
                            onChange={e => updateMedicine(idx, 'frequency', e.target.value)}
                            placeholder="e.g. Twice a day" className={inputClass} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Duration</label>
                          <input type="text" value={med.duration} readOnly={prescModal.readOnly}
                            onChange={e => updateMedicine(idx, 'duration', e.target.value)}
                            placeholder="e.g. 5 days" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation / Doctor Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">📝 Consultation Notes</label>
                <textarea rows="3" value={doctorNotes} readOnly={prescModal.readOnly}
                  onChange={e => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Patient shows viral fever. Advised rest for 3 days, increase fluid intake."
                  className={inputClass} />
              </div>
            </div>

            {/* Footer Buttons */}
            {!prescModal.readOnly && (
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setPrescModal(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button onClick={savePrescription} disabled={prescSaving}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-cyan-500 text-white disabled:opacity-50 shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5">
                  {prescSaving ? 'Saving...' : '✅ Complete Appointment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Patient Info Modal ──────────────────────────────────────────────────── */}
      {fetchingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-300 text-sm">Loading patient data...</p>
          </div>
        </div>
      )}

      {patientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setPatientModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl leading-none z-10">
              ✕
            </button>

            {/* Patient Header */}
            <div className="bg-gradient-to-br from-slate-700/60 to-slate-800 px-6 pt-6 pb-4 rounded-t-2xl">
              <h3 className="font-bold text-white text-xl">{patientModal.name}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-1">
                {patientModal.age && <span>🎂 {patientModal.age} yrs</span>}
                {patientModal.gender && <span>· {patientModal.gender}</span>}
                {patientModal.blood_group && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs font-bold border border-red-500/20">
                    🩸 {patientModal.blood_group}
                  </span>
                )}
                {patientModal.contact && <span>📞 {patientModal.contact}</span>}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Medical Info */}
              <div className="space-y-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Medical History</span>
                  <p className="text-slate-300">{patientModal.medical_history || 'None provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Allergies</span>
                    <p className="text-slate-300">{patientModal.allergies || 'None'}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Medication</span>
                    <p className="text-slate-300">{patientModal.current_medication || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Lab Reports */}
              {patientModal.lab_reports && patientModal.lab_reports.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🧪 Lab Reports</span>
                  <ul className="space-y-2">
                    {patientModal.lab_reports.map((report, idx) => (
                      <li key={idx}>
                        <a href={report.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group">
                          <span className="text-sm text-slate-300 font-medium">{report.title}</span>
                          <span className="text-xs text-cyan-400 group-hover:text-cyan-300">Open ↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Visits */}
              <div className="border-t border-white/10 pt-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🕐 Recent Visits</span>
                {patientModal.recent_appointments && patientModal.recent_appointments.length > 0 ? (
                  <ul className="space-y-2">
                    {patientModal.recent_appointments.map((ra, idx) => (
                      <li key={idx} className="bg-white/5 px-3 py-2.5 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-300">{ra.date}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[ra.status] || 'bg-slate-600 text-slate-300'}`}>
                            {ra.status}
                          </span>
                        </div>
                        {ra.prescription_summary && (
                          <p className="text-xs text-purple-300 mt-1">💊 {ra.prescription_summary}</p>
                        )}
                        {ra.doctor_notes && (
                          <p className="text-xs text-slate-500 italic mt-0.5 truncate">📝 {ra.doctor_notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm italic">No recent history.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
