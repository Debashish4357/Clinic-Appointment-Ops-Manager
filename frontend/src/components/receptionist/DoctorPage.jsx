import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const inputCls =
  'w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';

const EMPTY_FORM = {
  username: '', password: '', specialization: '',
  consultation_fee: '', avg_consultation_time: '15',
};

export default function DoctorPage() {
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);
  const [toggling, setToggling] = useState(null);

  const loadDoctors = () => {
    setLoading(true);
    API.get('doctors/')
      .then(r => setDoctors(r.data || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadDoctors, []);

  /* ── Create doctor ─────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const res = await API.post('create-doctor/', form);
      setMsg({ type: 'success', text: res.data.message || 'Doctor created!' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadDoctors();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create doctor.' });
    } finally { setSaving(false); }
  };

  /* ── Toggle availability ───────────────────────────────────────── */
  const toggleAvailability = async (doctor) => {
    setToggling(doctor.id);
    try {
      await API.patch(`doctors/${doctor.id}/`, { is_available: !doctor.is_available });
      loadDoctors();
    } catch {
      alert('Could not update availability.');
    } finally { setToggling(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Doctors</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage doctor accounts and availability</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setMsg(null); }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-bold text-white hover:from-cyan-500 hover:to-blue-500 transition shadow-md"
        >
          {showForm ? '✕ Close' : '+ Create Doctor'}
        </button>
      </div>

      {/* Feedback banner */}
      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
          msg.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          {msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-md">
          <h2 className="font-bold text-white mb-4">New Doctor Account</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Username *</label>
                <input type="text" required value={form.username} placeholder="doctor_username"
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Password *</label>
                <input type="password" required minLength={6} value={form.password} placeholder="Min. 6 characters"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Specialization</label>
                <input type="text" value={form.specialization} placeholder="e.g. Cardiology, General"
                  onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Consultation Fee (₹)</label>
                <input type="number" min="0" value={form.consultation_fee} placeholder="e.g. 500"
                  onChange={e => setForm(f => ({ ...f, consultation_fee: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Avg. Time / Patient (min)</label>
                <input type="number" min="5" max="120" value={form.avg_consultation_time} placeholder="e.g. 15"
                  onChange={e => setForm(f => ({ ...f, avg_consultation_time: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:from-cyan-500 hover:to-blue-500 transition">
                {saving ? 'Creating…' : 'Create Doctor Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/10 bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors list */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-md">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-3xl mb-2">👨‍⚕️</p>
            <p className="text-slate-400 text-sm">No doctors registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/60">
                  {['Doctor', 'Specialization', 'Fee (₹)', 'Avg Time', 'Availability'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-black">
                          {doc.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <span className="font-semibold text-white">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{doc.specialization || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{doc.consultation_fee ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{doc.avg_consultation_time ? `${doc.avg_consultation_time} min` : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(doc)}
                        disabled={toggling === doc.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                          doc.is_available ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          doc.is_available ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <span className={`ml-2 text-xs font-semibold ${doc.is_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {doc.is_available ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
