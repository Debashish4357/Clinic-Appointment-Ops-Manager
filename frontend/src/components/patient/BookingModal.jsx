import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const STEPS = ['Select Doctor', 'Date & Time', 'Reason', 'Confirm'];

const todayStr = () => new Date().toISOString().slice(0, 10);

const EMPTY = { doctor: '', date: todayStr(), time: '', reason: '' };

export default function BookingModal({ open, onClose, onSuccess, prefill = null }) {
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState(EMPTY);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState('');

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep(0);
      setError('');
      setForm(prefill ? { ...EMPTY, ...prefill } : EMPTY);
    }
  }, [open, prefill]);

  // Fetch doctors on first open
  useEffect(() => {
    if (!open || doctors.length > 0) return;
    setFetching(true);
    API.get('doctors/')
      .then((res) => setDoctors(res.data || []))
      .catch(() => setDoctors([]))
      .finally(() => setFetching(false));
  }, [open]);

  if (!open) return null;

  const selectedDoctor = doctors.find((d) => String(d.id) === String(form.doctor));

  const canNext = () => {
    if (step === 0) return !!form.doctor;
    if (step === 1) return !!form.date && !!form.time;
    return true;
  };

  const handleNext = () => {
    if (!canNext()) { setError('Please fill in the required field.'); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const handleBack = () => { setError(''); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await API.post('appointments/', {
        doctor: form.doctor,
        date:   form.date,
        time:   form.time,
        reason: form.reason,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Book Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-6 pt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step 0 — Select Doctor */}
          {step === 0 && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Doctor *
              </label>
              {fetching ? (
                <p className="text-sm text-slate-400">Loading doctors…</p>
              ) : (
                <select
                  value={form.doctor}
                  onChange={(e) => setForm((f) => ({ ...f, doctor: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Step 1 — Date & Time */}
          {step === 1 && (
            <>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date *
                </label>
                <input
                  type="date"
                  min={todayStr()}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Time *
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </>
          )}

          {/* Step 2 — Reason */}
          {step === 2 && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Reason for Visit (optional)
              </label>
              <textarea
                rows={4}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Routine checkup, Fever, Follow-up…"
                className={`${inputCls} resize-none`}
              />
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <p className="text-sm font-bold text-white mb-3">Booking Summary</p>
              {[
                ['Doctor', selectedDoctor ? selectedDoctor.name : `#${form.doctor}`],
                ['Date',   form.date],
                ['Time',   form.time],
                ['Reason', form.reason || 'Not specified'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="w-16 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {k}
                  </span>
                  <span className="text-sm text-white">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <button
            onClick={step === 0 ? onClose : handleBack}
            className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow transition hover:from-blue-500 hover:to-cyan-400 active:scale-95"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow transition hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Booking…' : 'Confirm Booking ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
