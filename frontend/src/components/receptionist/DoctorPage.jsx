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
  const [toggling, setToggling] = useState({});
  const [msg,      setMsg]      = useState(null);

  const loadDoctors = () => {
    setLoading(true);
    API.get('doctors/')
      .then(r => setDoctors(r.data || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadDoctors, []);

  const toggleAvailability = async (id, currentStatus) => {
    setToggling(prev => ({ ...prev, [id]: true }));
    try {
      await API.patch(`doctors/${id}/`, { is_available: !currentStatus });
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, is_available: !currentStatus } : d));
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update availability.' });
    } finally {
      setToggling(prev => ({ ...prev, [id]: false }));
    }
  };

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
                  {['Doctor', 'Code', 'Specialization', 'Fee (₹)', 'Avg Time', 'Status', 'Availability'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {doctors.map(doc => (
                  <tr key={doc.id} className={`transition-colors group ${
                    doc.is_available ? 'hover:bg-white/5' : 'opacity-60 hover:opacity-80 hover:bg-white/5'
                  }`}>
                    {/* Doctor name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md transition-all ${
                          doc.is_available ? 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow-cyan-500/20' : 'bg-slate-700'
                        }`}>
                          {doc.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <span className="font-semibold text-white">{doc.name}</span>
                      </div>
                    </td>

                    {/* Doctor code */}
                    <td className="px-4 py-3">
                      {doc.doctor_code
                        ? <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">{doc.doctor_code}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Specialization */}
                    <td className="px-4 py-3 text-slate-300">{doc.specialization || '—'}</td>

                    {/* Fee */}
                    <td className="px-4 py-3 text-slate-300">
                      {doc.consultation_fee ? `₹${doc.consultation_fee}` : '—'}
                    </td>

                    {/* Avg time */}
                    <td className="px-4 py-3 text-slate-300">
                      {doc.avg_consultation_time ? `${doc.avg_consultation_time} min` : '—'}
                    </td>

                    {/* Status badge with pulsing dot */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.is_available
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700/50 text-slate-500 border border-slate-600/40'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          doc.is_available ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`} />
                        {doc.is_available ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Toggle switch */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Toggle pill */}
                        <button
                          onClick={() => toggleAvailability(doc.id, doc.is_available)}
                          disabled={toggling[doc.id]}
                          title={doc.is_available ? 'Click to deactivate' : 'Click to activate'}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed ${
                            doc.is_available
                              ? 'border-emerald-500/60 bg-emerald-500'
                              : 'border-slate-600 bg-slate-700'
                          }`}
                        >
                          <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
                            doc.is_available ? 'translate-x-5' : 'translate-x-0.5'
                          }`}>
                            {toggling[doc.id] && (
                              <svg className="h-2.5 w-2.5 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                          </span>
                        </button>
                        {/* Text label */}
                        <span className={`text-xs font-semibold select-none ${
                          doc.is_available ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {toggling[doc.id] ? '…' : doc.is_available ? 'On' : 'Off'}
                        </span>
                      </div>
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
