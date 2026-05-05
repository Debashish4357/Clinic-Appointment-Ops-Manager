import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const STEPS = ['Doctor', 'Date & Slot', 'Details', 'Confirm'];

// Available time slots (09:00 to 17:00 in 30-min increments)
const ALL_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const EMPTY = { doctor: '', date: todayStr(), time: '', reason: '', visitType: 'NEW' };

export default function BookingModal({ open, onClose, onSuccess, prefill = null }) {
  const [step,     setStep]     = useState(0);
  const [form,     setForm]     = useState(EMPTY);
  const [doctors,  setDoctors]  = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [error,    setError]    = useState('');

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0); setError('');
      setForm(prefill ? { ...EMPTY, ...prefill } : EMPTY);
    }
  }, [open, prefill]);

  // Fetch doctors each time modal opens — always fresh to reflect availability changes
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    API.get('doctors/available/')
      .then(r => {
        // Only show ACTIVE doctors in booking step
        const all = r.data || [];
        // The API might already filter, but we double check here
        setDoctors(all.filter(d => d.is_available));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [open]);

  // Fetch booked slots when doctor + date chosen
  useEffect(() => {
    if (!form.doctor || !form.date || step !== 1) return;
    setFetchingSlots(true);
    setBookedSlots([]);
    API.get('appointments/', { params: { doctor: form.doctor, date: form.date } })
      .then(r => {
        const appts = r.data?.data || r.data || [];
        const times = appts.map(a => a.time?.slice(0, 5));
        setBookedSlots(times);
      })
      .catch(() => {})
      .finally(() => setFetchingSlots(false));
  }, [form.doctor, form.date, step]);

  if (!open) return null;

  const selectedDoctor = doctors.find(d => String(d.id) === String(form.doctor));

  const canNext = () => {
    if (step === 0) return !!form.doctor;
    if (step === 1) return !!form.date && !!form.time;
    return true;
  };

  const handleNext = () => {
    if (!canNext()) { setError('Please complete the required field.'); return; }
    setError(''); setStep(s => s + 1);
  };
  const handleBack = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        doctor: form.doctor, date: form.date,
        time: form.time, reason: form.reason,
        appointment_type: form.visitType,
      };
      await API.post('appointments/', payload);
      onSuccess?.(); onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.detail || 'Booking failed. Try again.');
    } finally { setLoading(false); }
  };

  const iCls = 'w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Book Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">✕</button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-cyan-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}

          {/* STEP 0 — Doctor cards */}
          {step === 0 && (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Select Doctor *</p>
              {fetching ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />)}
                </div>
              ) : doctors.length === 0 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 text-center">
                  <p className="text-2xl mb-2">🏥</p>
                  <p className="text-sm font-semibold text-amber-400">No doctors currently available</p>
                  <p className="text-xs text-slate-500 mt-1">All doctors are inactive. Please try again later or contact the clinic.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doctors.map(d => {
                    const isSelected = String(form.doctor) === String(d.id);
                    return (
                      <button key={d.id}
                        onClick={() => setForm(f => ({ ...f, doctor: String(d.id) }))}
                        className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-cyan-500/50 bg-cyan-500/10'
                            : 'border-white/10 bg-slate-800/50 hover:border-white/20 hover:bg-slate-800'
                        }`}>
                        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-black ${
                          isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {d.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{d.name}</p>
                          <p className="text-xs text-slate-400">{d.specialization || 'General Physician'}</p>
                        </div>
                        {d.consultation_fee && (
                          <span className="text-xs text-slate-400">₹{d.consultation_fee}</span>
                        )}
                        {isSelected && (
                          <svg className="h-5 w-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Date + Slot grid */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Date *</label>
                <input type="date" min={todayStr()} value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value, time: '' }))}
                  className={iCls} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Available Slots *
                  {fetchingSlots && <span className="ml-2 text-slate-500 normal-case">loading…</span>}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_SLOTS.map(slot => {
                    const isBooked   = bookedSlots.includes(slot);
                    
                    // Disable past slots if booking for today
                    let isPastSlot = false;
                    if (form.date === todayStr()) {
                      const now = new Date();
                      const [h, m] = slot.split(':');
                      const slotDate = new Date();
                      slotDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                      isPastSlot = slotDate < now;
                    }
                    
                    const isDisabled = isBooked || isPastSlot;
                    const isSelected = form.time === slot;
                    
                    return (
                      <button key={slot}
                        disabled={isDisabled}
                        onClick={() => setForm(f => ({ ...f, time: slot }))}
                        className={`rounded-lg py-2 text-xs font-semibold transition flex flex-col items-center justify-center ${
                          isDisabled
                            ? 'cursor-not-allowed bg-red-500/5 text-red-400/30 border border-red-500/10'
                            : isSelected
                            ? 'bg-cyan-500 text-white border border-cyan-400 shadow-md'
                            : 'bg-slate-800 border border-white/10 text-slate-300 hover:border-cyan-500/50 hover:text-white'
                        }`}
                      >
                        <span className={isDisabled ? 'line-through' : ''}>{slot}</span>
                        {isBooked && <span className="text-[9px] font-normal mt-0.5 text-red-400/50">Booked</span>}
                        {isPastSlot && !isBooked && <span className="text-[9px] font-normal mt-0.5 text-slate-500">Passed</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Visit Type</label>
                <div className="flex gap-3">
                  {[['NEW', 'New Visit'], ['FOLLOW_UP', 'Follow-up']].map(([val, label]) => (
                    <button key={val}
                      onClick={() => setForm(f => ({ ...f, visitType: val }))}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                        form.visitType === val
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                          : 'border-white/10 bg-slate-800 text-slate-400 hover:border-white/20'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Reason for Visit</label>
                <textarea rows={4} value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Routine checkup, Fever, Chest pain…"
                  className={`${iCls} resize-none`} />
              </div>
            </div>
          )}

          {/* STEP 3 — Confirm */}
          {step === 3 && (
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5 space-y-3">
              <p className="text-sm font-black text-white mb-2">Booking Summary</p>
              {[
                ['Doctor',     selectedDoctor?.name || `#${form.doctor}`],
                ['Date',       form.date],
                ['Time',       form.time],
                ['Visit Type', form.visitType === 'FOLLOW_UP' ? 'Follow-up' : 'New Visit'],
                ['Reason',     form.reason || 'Not specified'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">{k}</span>
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
            className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 active:scale-95">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 active:scale-95">
              {loading ? 'Booking…' : 'Confirm Booking ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
