import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400';

/* ─── Create Doctor Form ─────────────────────────────────────────── */
const CreateDoctorForm = () => {
  const [form, setForm] = useState({
    username: '', password: '', specialization: '',
    consultation_fee: '', avg_consultation_time: '15',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await API.post('create-doctor/', form);
      setMsg({ type: 'success', text: res.data.message });
      setForm({ username: '', password: '', specialization: '', consultation_fee: '', avg_consultation_time: '15' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create doctor.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 mt-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-white text-base">Create Doctor</h2>
          <p className="text-slate-400 text-xs mt-0.5">Register a new doctor account</p>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`mb-4 p-3 rounded-xl border text-sm font-medium ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
            <input type="text" required value={form.username}
              onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
              className={inputCls} placeholder="doctor_username" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <input type="password" required minLength={6} value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              className={inputCls} placeholder="Min. 6 characters" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Specialization</label>
          <input type="text" value={form.specialization}
            onChange={(e) => setForm(p => ({ ...p, specialization: e.target.value }))}
            className={inputCls} placeholder="e.g. Cardiology, General" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Consultation Fee (₹)</label>
            <input type="number" min="0" value={form.consultation_fee}
              onChange={(e) => setForm(p => ({ ...p, consultation_fee: e.target.value }))}
              className={inputCls} placeholder="e.g. 500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Avg. Time / Patient (min)</label>
            <input type="number" min="5" max="120" value={form.avg_consultation_time}
              onChange={(e) => setForm(p => ({ ...p, avg_consultation_time: e.target.value }))}
              className={inputCls} placeholder="e.g. 15" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 disabled:opacity-50 transition-all">
          {saving ? 'Creating...' : 'Create Doctor Account'}
        </button>
      </form>
    </div>
  );
};

/* ─── Vitals Indicator ─────────────────────────────────────────────── */
function VitalsIndicator({ appt }) {
  const hasVitals = appt.bp || appt.heart_rate || appt.weight || appt.temperature;
  if (!hasVitals) return null;
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/15 text-teal-300 rounded border border-teal-500/20 ml-1">
      ✓ Vitals
    </span>
  );
}

/* ─── Main Receptionist Dashboard ────────────────────────────────── */
export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total_patients: 0, arrived: 0, pending: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Patient Info modal
  const [patientModal, setPatientModal] = useState(null);
  const [fetchingPatient, setFetchingPatient] = useState(false);

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [rescheduling, setRescheduling] = useState(false);

  // Vitals modal
  const [vitalsModal, setVitalsModal] = useState(null); // { id, existing }
  const [vitalsForm, setVitalsForm] = useState({ bp: '', heart_rate: '', weight: '', temperature: '' });
  const [savingVitals, setSavingVitals] = useState(false);

  const fetchData = () => {
    setLoading(true);
    API.get('dashboard/receptionist/')
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setAppointments(d.appointments || []);
        setStats(d.stats || {});
      })
      .catch(() => setError('Failed to load receptionist data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ── Status action ─────────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setUpdating(null);
    }
  };

  // ── Move up / down ────────────────────────────────────────────────────────────
  const moveQueue = async (id, action) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/move/`, { action });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Move failed.');
    } finally {
      setUpdating(null);
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

  // ── Reschedule ────────────────────────────────────────────────────────────────
  const openReschedule = (appt) => {
    setRescheduleModal(appt.id);
    setRescheduleForm({ date: appt.date || '', time: appt.time || '' });
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    setRescheduling(true);
    try {
      await API.patch(`appointments/${rescheduleModal}/reschedule/`, rescheduleForm);
      setRescheduleModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule.');
    } finally {
      setRescheduling(false);
    }
  };

  // ── Vitals ────────────────────────────────────────────────────────────────────
  const openVitals = (appt) => {
    setVitalsModal(appt.id);
    setVitalsForm({
      bp: appt.bp || '',
      heart_rate: appt.heart_rate ? String(appt.heart_rate) : '',
      weight: appt.weight ? String(appt.weight) : '',
      temperature: appt.temperature ? String(appt.temperature) : '',
    });
  };

  const submitVitals = async (e) => {
    e.preventDefault();
    setSavingVitals(true);
    try {
      const payload = {
        bp: vitalsForm.bp || undefined,
        heart_rate: vitalsForm.heart_rate ? Number(vitalsForm.heart_rate) : undefined,
        weight: vitalsForm.weight ? Number(vitalsForm.weight) : undefined,
        temperature: vitalsForm.temperature ? Number(vitalsForm.temperature) : undefined,
      };
      // Remove undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      await API.patch(`appointments/${vitalsModal}/vitals/`, payload);
      setVitalsModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save vitals.');
    } finally {
      setSavingVitals(false);
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
      <div className="mb-8 flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-3xl">🗂️</span> Receptionist Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-10">
            Queue management · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          to="/appointments"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Book Appointment
        </Link>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total_patients, icon: '📋', color: 'from-blue-600/20 to-blue-500/5 border-blue-500/20' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-sky-600/20 to-sky-500/5 border-sky-500/20' },
          { label: 'Arrived', value: stats.arrived, icon: '🏥', color: 'from-amber-600/20 to-amber-500/5 border-amber-500/20' },
          { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-emerald-600/20 to-emerald-500/5 border-emerald-500/20' },
          { label: 'Cancelled', value: stats.cancelled, icon: '❌', color: 'from-red-600/20 to-red-500/5 border-red-500/20' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5`}>
            <span className="text-lg">{icon}</span>
            <p className="text-2xl font-black text-white mt-2">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Queue Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-white">Today's Queue</h2>
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
                  {['Token', 'Time', 'Patient', 'Doctor', 'Status', 'Queue', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((appt, idx) => (
                  <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                    {/* Token */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
                        {appt.token_number}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.time}</td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{appt.patient_name}</p>
                        <button
                          onClick={() => fetchPatientDetails(appt.patient_id)}
                          className="hover:text-cyan-400 text-slate-400 transition-colors"
                          title="View Details"
                        >
                          👁
                        </button>
                        <VitalsIndicator appt={appt} />
                      </div>
                      {appt.reason && (
                        <p className="text-slate-500 text-xs mt-0.5 italic truncate max-w-[180px]">"{appt.reason}"</p>
                      )}
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3 text-slate-300 text-sm">{appt.doctor_name}</td>

                    {/* Status / Wait Time */}
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

                    {/* Queue Move Buttons */}
                    <td className="px-4 py-3">
                      {appt.status === 'BOOKED' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveQueue(appt.id, 'UP')}
                            disabled={updating === appt.id || idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                            title="Move Up">↑</button>
                          <button
                            onClick={() => moveQueue(appt.id, 'DOWN')}
                            disabled={updating === appt.id || idx === appointments.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                            title="Move Down">↓</button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Status Action Buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {appt.status === 'BOOKED' && (
                          <>
                            {/* Enter Vitals */}
                            <button onClick={() => openVitals(appt)} disabled={updating === appt.id}
                              title="Enter Vitals"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-colors disabled:opacity-50 text-base">
                              🩺
                            </button>
                            {/* Check-In */}
                            <button onClick={() => updateStatus(appt.id, 'ARRIVED')} disabled={updating === appt.id}
                              title="Check-In"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50 text-base">
                              📥
                            </button>
                            {/* Reschedule */}
                            <button onClick={() => openReschedule(appt)} disabled={updating === appt.id}
                              title="Reschedule"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-base">
                              🔁
                            </button>
                            {/* Cancel */}
                            <button onClick={() => updateStatus(appt.id, 'CANCELLED')} disabled={updating === appt.id}
                              title="Cancel"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm">
                              ❌
                            </button>
                          </>
                        )}
                        {appt.status === 'ARRIVED' && (
                          <>
                            {/* Enter Vitals (still available after check-in) */}
                            <button onClick={() => openVitals(appt)} disabled={updating === appt.id}
                              title="Enter Vitals"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-colors disabled:opacity-50 text-base">
                              🩺
                            </button>
                            {/* Complete */}
                            <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                              title="Complete"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 text-sm">
                              ✔✔
                            </button>
                          </>
                        )}
                        {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status) && (
                          <span className="text-slate-600 text-xs italic">—</span>
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
            <p className="text-4xl mb-3">🏥</p>
            <p className="text-slate-400 text-sm">No appointments found</p>
          </div>
        )}
      </div>

      {/* ── Create Doctor Panel ─────────────────────────────────────────────────── */}
      <CreateDoctorForm />

      {/* ── Vitals Modal ────────────────────────────────────────────────────────── */}
      {vitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setVitalsModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl leading-none">
              ✕
            </button>
            <div className="mb-6">
              <h3 className="font-bold text-white text-xl">🩺 Enter Vitals</h3>
              <p className="text-slate-400 text-sm mt-1">Record patient vitals before consultation.</p>
            </div>

            <form onSubmit={submitVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Blood Pressure</label>
                  <input type="text" value={vitalsForm.bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                    placeholder="e.g. 120/80" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Heart Rate (bpm)</label>
                  <input type="number" min="20" max="300" value={vitalsForm.heart_rate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
                    placeholder="e.g. 75" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" min="1" value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    placeholder="e.g. 70" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Temperature (°F)</label>
                  <input type="number" step="0.1" min="90" max="115" value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                    placeholder="e.g. 98.6" className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setVitalsModal(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingVitals}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-600 to-cyan-500 text-white disabled:opacity-50 shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5">
                  {savingVitals ? 'Saving...' : '🩺 Save Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ──────────────────────────────────────────────────────── */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setRescheduleModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl leading-none">
              ✕
            </button>
            <div className="mb-6">
              <h3 className="font-bold text-white text-xl">🔁 Reschedule</h3>
              <p className="text-slate-400 text-sm mt-1">Change the date and time of this appointment.</p>
            </div>

            <form onSubmit={submitReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Date</label>
                <input type="date" required min={new Date().toISOString().split('T')[0]}
                  value={rescheduleForm.date} onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Time</label>
                <input type="time" required
                  value={rescheduleForm.time} onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                  className={inputCls} />
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setRescheduleModal(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={rescheduling}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                  {rescheduling ? '...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Patient Loading Overlay ──────────────────────────────────────────────── */}
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

      {/* ── Patient Info Modal ────────────────────────────────────────────────────── */}
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
              {/* Medical info */}
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
