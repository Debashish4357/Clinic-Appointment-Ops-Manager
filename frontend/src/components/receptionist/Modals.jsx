import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const inputCls =
  'w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';

const todayStr = () => new Date().toISOString().slice(0, 10);

/* ─────────────────────────────────────────────────────────────────
   BOOK APPOINTMENT MODAL
───────────────────────────────────────────────────────────────── */
export function BookingModal({ open, onClose, onSuccess }) {
  const [doctors,   setDoctors]   = useState([]);
  const [patients,  setPatients]  = useState([]);
  const [fetching,  setFetching]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [form,      setForm]      = useState({ doctor: '', patient: '', date: todayStr(), time: '' });

  useEffect(() => {
    if (!open || doctors.length) return;
    setFetching(true);
    Promise.all([API.get('doctors/'), API.get('patients/')])
      .then(([dRes, pRes]) => {
        setDoctors(dRes.data || []);
        setPatients(pRes.data || []);
      })
      .catch(() => setError('Failed to load doctors / patients.'))
      .finally(() => setFetching(false));
  }, [open]);

  useEffect(() => {
    if (open) { setForm({ doctor: '', patient: '', date: todayStr(), time: '' }); setError(''); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor || !form.patient || !form.date || !form.time) {
      setError('All fields are required.'); return;
    }
    setLoading(true); setError('');
    try {
      await API.post('appointments/', form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Booking failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Book Appointment</h2>
            <p className="text-xs text-slate-400">Fill details to schedule</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}

          {fetching ? (
            <p className="text-center text-sm text-slate-400 py-4">Loading…</p>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Patient *</label>
                <select value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))} className={inputCls}>
                  <option value="">Choose patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}{p.contact ? ` (${p.contact})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Doctor *</label>
                <select value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} className={inputCls}>
                  <option value="">Choose doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Date *</label>
                  <input type="date" min={todayStr()} value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Time *</label>
                  <input type="time" value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={loading || fetching}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:from-blue-500 hover:to-cyan-400">
              {loading ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   WALK-IN MODAL
───────────────────────────────────────────────────────────────── */
export function WalkInModal({ open, onClose, onSuccess }) {
  const [doctors,  setDoctors]  = useState([]);
  const [fetching, setFetching] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [form,     setForm]     = useState({ name: '', doctor: '', time: '' });

  useEffect(() => {
    if (!open || doctors.length) return;
    setFetching(true);
    API.get('doctors/').then(r => setDoctors(r.data || [])).catch(() => {}).finally(() => setFetching(false));
  }, [open]);

  useEffect(() => {
    if (open) { setForm({ name: '', doctor: '', time: '' }); setError(''); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.doctor) { setError('Name and doctor are required.'); return; }
    setLoading(true); setError('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const time  = form.time || new Date().toTimeString().slice(0, 5);
      await API.post('appointments/', {
        doctor:  form.doctor,
        date:    today,
        time,
        walk_in_name: form.name,
        is_walk_in: true,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to add walk-in.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Add Walk-in</h2>
            <p className="text-xs text-slate-400">Register a walk-in patient</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Patient Name *</label>
            <input type="text" value={form.name} placeholder="Full name"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Doctor *</label>
            {fetching ? <p className="text-sm text-slate-400">Loading…</p> : (
              <select value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} className={inputCls}>
                <option value="">Choose doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ''}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Time (optional)</label>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {loading ? 'Adding…' : 'Add Walk-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VITALS MODAL
───────────────────────────────────────────────────────────────── */
export function VitalsModal({ open, appt, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ bp: '', heart_rate: '', weight: '', temperature: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (open && appt) {
      setForm({
        bp:          appt.bp          || '',
        heart_rate:  appt.heart_rate  ? String(appt.heart_rate)  : '',
        weight:      appt.weight      ? String(appt.weight)      : '',
        temperature: appt.temperature ? String(appt.temperature) : '',
      });
      setError('');
    }
  }, [open, appt]);

  if (!open || !appt) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = {};
    if (form.bp)          payload.bp          = form.bp;
    if (form.heart_rate)  payload.heart_rate  = Number(form.heart_rate);
    if (form.weight)      payload.weight      = Number(form.weight);
    if (form.temperature) payload.temperature = Number(form.temperature);
    try {
      await API.patch(`appointments/${appt.id}/vitals/`, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save vitals.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Enter Vitals</h2>
            <p className="text-xs text-slate-400">{appt.patient_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'bp',          label: 'Blood Pressure', placeholder: '120/80',  type: 'text'   },
              { key: 'heart_rate',  label: 'Heart Rate (bpm)', placeholder: '75',    type: 'number' },
              { key: 'weight',      label: 'Weight (kg)',     placeholder: '70',     type: 'number' },
              { key: 'temperature', label: 'Temp (°F)',       placeholder: '98.6',   type: 'number' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
                <input type={type} step={type === 'number' ? '0.1' : undefined}
                  value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={inputCls} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Vitals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RESCHEDULE MODAL
───────────────────────────────────────────────────────────────── */
export function RescheduleModal({ open, appt, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ date: '', time: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (open && appt) { setForm({ date: appt.date || '', time: appt.time || '' }); setError(''); }
  }, [open, appt]);

  if (!open || !appt) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) { setError('Date and time are required.'); return; }
    setSaving(true); setError('');
    try {
      await API.patch(`appointments/${appt.id}/reschedule/`, form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reschedule.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Reschedule</h2>
            <p className="text-xs text-slate-400">{appt.patient_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">New Date *</label>
            <input type="date" min={todayStr()} value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">New Time *</label>
            <input type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
