import React, { useEffect, useRef, useState } from 'react';
import API from '../services/api';

import HeroSection          from './patient/HeroSection';
import StatsCards           from './patient/StatsCards';
import QueueStatus          from './patient/QueueStatus';
import UpcomingAppointments from './patient/UpcomingAppointments';
import PastAppointments     from './patient/PastAppointments';
import MedicalRecords       from './patient/MedicalRecords';
import BookingModal         from './patient/BookingModal';

/* ─── constants ─────────────────────────────────────────────────── */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const EMPTY_FORM   = {
  age: '', contact: '', gender: '',
  emergency_contact: '', blood_group: '',
  medical_history: '', allergies: '',
  current_medication: '', address: '',
};

/* ─── tiny helpers ───────────────────────────────────────────────── */
const Spinner = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm">Loading your dashboard…</p>
    </div>
  </div>
);

const inputCls =
  'w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';

/* ═══════════════════════════════════════════════════════════════════
   PROFILE MODAL
═══════════════════════════════════════════════════════════════════ */
function ProfileModal({ open, onClose, profile, avatarSrc, onAvatarChange, fileInputRef }) {
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [contactErr,  setContactErr]  = useState('');
  const [ecErr,       setEcErr]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState(null);

  // Sync form with profile whenever modal opens
  useEffect(() => {
    if (open && profile) {
      setFormData({
        age:                profile.age                || '',
        contact:            profile.contact            || '',
        gender:             profile.gender             || '',
        emergency_contact:  profile.emergency_contact  || '',
        blood_group:        profile.blood_group        || '',
        medical_history:    profile.medical_history    || '',
        allergies:          profile.allergies          || '',
        current_medication: profile.current_medication || '',
        address:            profile.address            || '',
      });
      setContactErr('');
      setEcErr('');
      setSaveMsg(null);
    }
  }, [open, profile]);

  if (!open) return null;

  const validatePhone = (v) =>
    v && !/^\d{10}$/.test(v) ? 'Must be exactly 10 digits.' : '';

  const handleSave = async (e) => {
    e.preventDefault();
    const ce  = validatePhone(formData.contact);
    const ece = validatePhone(formData.emergency_contact);
    setContactErr(ce);
    setEcErr(ece);
    if (ce || ece) return;

    setSaving(true);
    setSaveMsg(null);
    try {
      await API.patch('patient/profile/', formData);
      setSaveMsg({ type: 'success', text: 'Profile saved!' });
      setTimeout(onClose, 900);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, id, children }) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-6 py-4">
          <div>
            <h2 className="font-black text-white text-lg">Edit Profile</h2>
            <p className="text-xs text-slate-400">Update your personal details</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 cursor-pointer rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="h-16 w-16 rounded-full object-cover border-2 border-cyan-500/50" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-black">
                  {profile?.username?.[0]?.toUpperCase() || 'P'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0" />
                </svg>
              </div>
            </div>
            <div>
              <p className="font-bold text-white">{profile?.username}</p>
              <p className="text-xs text-slate-400">Click avatar to change photo</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

          {/* Banner */}
          {saveMsg && (
            <div className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
              saveMsg.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}>
              {saveMsg.text}
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Age" id="p-age">
              <input id="p-age" type="number" min="1" max="120"
                value={formData.age}
                onChange={(e) => setFormData((f) => ({ ...f, age: e.target.value }))}
                className={inputCls} placeholder="Your age" />
            </Field>

            <Field label="Gender" id="p-gender">
              <select id="p-gender" value={formData.gender}
                onChange={(e) => setFormData((f) => ({ ...f, gender: e.target.value }))}
                className={inputCls}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>

            <Field label="Contact (10 digits)" id="p-contact">
              <input id="p-contact" type="text" inputMode="numeric" maxLength={10}
                value={formData.contact}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData((f) => ({ ...f, contact: v }));
                  setContactErr(v && v.length !== 10 ? 'Must be exactly 10 digits.' : '');
                }}
                className={`${inputCls} ${contactErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                placeholder="10-digit mobile" />
              {contactErr && <p className="mt-1 text-xs text-red-400">{contactErr}</p>}
            </Field>

            <Field label="Emergency Contact" id="p-ec">
              <input id="p-ec" type="text" inputMode="numeric" maxLength={10}
                value={formData.emergency_contact}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData((f) => ({ ...f, emergency_contact: v }));
                  setEcErr(v && v.length !== 10 ? 'Must be exactly 10 digits.' : '');
                }}
                className={`${inputCls} ${ecErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                placeholder="Emergency number" />
              {ecErr && <p className="mt-1 text-xs text-red-400">{ecErr}</p>}
            </Field>

            <Field label="Blood Group" id="p-bg">
              <select id="p-bg" value={formData.blood_group}
                onChange={(e) => setFormData((f) => ({ ...f, blood_group: e.target.value }))}
                className={inputCls}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>

          {/* Textarea fields */}
          {[
            { key: 'medical_history',    label: 'Medical History',       placeholder: 'Known conditions…' },
            { key: 'allergies',          label: 'Allergies',             placeholder: 'e.g. Penicillin, Peanuts' },
            { key: 'current_medication', label: 'Current Medication',    placeholder: 'e.g. Metformin 500mg' },
            { key: 'address',            label: 'Address',               placeholder: 'Your address…' },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label} id={`p-${key}`}>
              <textarea id={`p-${key}`} rows={2}
                value={formData[key]}
                onChange={(e) => setFormData((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className={`${inputCls} resize-none`} />
            </Field>
          ))}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-bold text-white transition hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/10 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PATIENT DASHBOARD — orchestrator
═══════════════════════════════════════════════════════════════════ */
export default function PatientDashboard() {
  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [avatarSrc,    setAvatarSrc]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [bookingOpen,  setBookingOpen]  = useState(false);
  const [prefillAppt,  setPrefillAppt]  = useState(null);   // for Reschedule
  const [profileOpen,  setProfileOpen]  = useState(false);

  const [toast,        setToast]        = useState(null);   // { msg, type }

  const fileInputRef = useRef(null);

  /* ── data loading ──────────────────────────────────────────────── */
  const loadData = () => {
    setLoading(true);
    Promise.all([
      API.get('dashboard/patient/'),
      API.get('appointments/'),
    ])
      .then(([dashRes, apptRes]) => {
        const prof = dashRes.data.data?.profile || null;
        setProfile(prof);
        if (prof?.profile_image) setAvatarSrc(prof.profile_image);
        setAppointments(apptRes.data.data || []);
      })
      .catch(() => setError('Failed to load dashboard. Please refresh.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  /* ── toast helper ──────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── avatar upload ─────────────────────────────────────────────── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.append('profile_image', file);
    try {
      const res = await API.patch('patient/profile/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const saved = res.data?.data?.profile_image;
      if (saved) setAvatarSrc(saved);
    } catch {
      // silent — preview still shows
    }
  };

  /* ── cancel appointment ────────────────────────────────────────── */
  const handleCancel = (id) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
    );
    showToast('Appointment cancelled.');
  };

  /* ── reschedule → open modal with prefill ──────────────────────── */
  const handleReschedule = (appt) => {
    setPrefillAppt({ doctor: String(appt.doctor) });
    setBookingOpen(true);
  };

  /* ── booking success ───────────────────────────────────────────── */
  const handleBookingSuccess = () => {
    showToast('Appointment booked! ✓');
    loadData(); // refresh list
  };

  /* ── upcoming subset (passed to StatsCards + QueueStatus) ──────── */
  const today    = new Date().toISOString().slice(0, 10);
  const todayObj = new Date(today + 'T00:00:00');
  const upcoming = appointments.filter((a) => {
    const d = new Date(a.date + 'T00:00:00');
    return a.status === 'BOOKED' && d >= todayObj;
  });

  /* ── render ────────────────────────────────────────────────────── */
  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400">
        {error}
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-semibold shadow-xl transition-all ${
          toast.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── SECTION 1: Hero ────────────────────────────────────────── */}
      <HeroSection
        name={profile?.username}
        onBook={() => { setPrefillAppt(null); setBookingOpen(true); }}
        onEditProfile={() => setProfileOpen(true)}
      />

      {/* ── SECTION 2: Stats ───────────────────────────────────────── */}
      <StatsCards upcoming={upcoming} appointments={appointments} />

      {/* ── SECTION 3: Queue (only if ARRIVED today) ───────────────── */}
      <QueueStatus appointments={appointments} />

      {/* ── SECTION 4: Upcoming ────────────────────────────────────── */}
      <UpcomingAppointments
        appointments={appointments}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
      />

      {/* ── SECTION 5: Past ────────────────────────────────────────── */}
      <PastAppointments appointments={appointments} />

      {/* ── SECTION 6: Medical Records ─────────────────────────────── */}
      <MedicalRecords appointments={appointments} />

      {/* ── Booking Modal ──────────────────────────────────────────── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccess={handleBookingSuccess}
        prefill={prefillAppt}
      />

      {/* ── Profile Modal ──────────────────────────────────────────── */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        avatarSrc={avatarSrc}
        onAvatarChange={handleAvatarChange}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
