import React, { useEffect, useRef, useState } from 'react';
import API from '../services/api';

/* ─── Status badge styles ────────────────────────────────────────── */
const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/* ─── Sidebar nav ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { id: 'appointments', label: 'My Appointments', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )},
  { id: 'profile', label: 'Profile', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
];

/* ─── Helpers ────────────────────────────────────────────────────── */
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const EMPTY_FORM = {
  age: '', contact: '', gender: '',
  emergency_contact: '', blood_group: '',
  medical_history: '', allergies: '', current_medication: '',
};

export default function PatientDashboard() {
  const [profile, setProfile]               = useState(null);
  const [appointments, setAppointments]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeSection, setActiveSection]   = useState('dashboard');
  const [activeTab, setActiveTab]           = useState('upcoming');
  const [avatarSrc, setAvatarSrc]           = useState(null);   // displayed image (URL or base64)
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  // Profile edit state
  const [editing, setEditing]   = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [contactErr, setContactErr] = useState('');
  const [ecErr, setEcErr]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState(null);

  const fileInputRef = useRef(null);

  /* ── Fetch dashboard + appointments ─────────────────────────────── */
  useEffect(() => {
    Promise.all([
      API.get('dashboard/patient/'),
      API.get('appointments/'),
    ])
      .then(([dashRes, apptRes]) => {
        const prof = dashRes.data.data?.profile || null;
        setProfile(prof);
        if (prof) {
          setFormData({
            age:               prof.age               || '',
            contact:           prof.contact           || '',
            gender:            prof.gender            || '',
            emergency_contact: prof.emergency_contact || '',
            blood_group:       prof.blood_group       || '',
            medical_history:   prof.medical_history   || '',
            allergies:         prof.allergies         || '',
            current_medication:prof.current_medication|| '',
          });
          // Load persisted profile image from backend
          if (prof.profile_image) setAvatarSrc(prof.profile_image);
        }
        setAppointments(apptRes.data.data || []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Avatar upload ───────────────────────────────────────────────── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
    // Persist to backend
    const fd = new FormData();
    fd.append('profile_image', file);
    try {
      const res = await API.patch('patient/profile/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const saved = res.data?.data?.profile_image;
      if (saved) setAvatarSrc(saved);
    } catch {
      // preview still shown; silent fail
    }
  };

  /* ── Contact validation helper ──────────────────────────────────── */
  const validateContact = (val) => {
    if (!val) return '';
    if (!/^\d{10}$/.test(val)) return 'Must be exactly 10 digits.';
    return '';
  };

  /* ── Profile save ───────────────────────────────────────────────── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    const ce  = validateContact(formData.contact);
    const ece = validateContact(formData.emergency_contact);
    setContactErr(ce);
    setEcErr(ece);
    if (ce || ece) return;

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await API.patch('patient/profile/', formData);
      const updated = res.data?.data || {};
      setProfile((prev) => ({ ...prev, ...updated }));
      if (updated.profile_image) setAvatarSrc(updated.profile_image);
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      setSaveMsg({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading / Error ─────────────────────────────────────────────── */
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center">
        {error}
      </div>
    );

  /* ── Date helpers ─────────────────────────────────────────────────── */
  const TODAY = todayStr();
  const todayObj = new Date(TODAY + 'T00:00:00');

  const todayAppts   = appointments.filter((a) => a.date === TODAY);
  const upcoming     = appointments.filter((a) => {
    const d = new Date(a.date + 'T00:00:00');
    return a.status === 'BOOKED' && d >= todayObj;
  });
  const previous     = appointments.filter((a) =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)
  );

  /* ═══════════════════════════════════════════════════════════════════
     SIDEBAR
  ═══════════════════════════════════════════════════════════════════ */
  const Sidebar = () => (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-white/10 flex flex-col py-8 px-5 min-h-full">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="relative w-24 h-24 rounded-full cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500/50 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border-4 border-cyan-500/40 shadow-xl text-white text-3xl font-black select-none">
              {profile?.username?.[0]?.toUpperCase() || 'P'}
            </div>
          )}
          {/* Camera overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0" />
            </svg>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="mt-3 text-white font-bold text-lg">{profile?.username || 'Patient'}</p>
        <span className="mt-1 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          Patient
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeSection === item.id
                ? 'bg-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <p className="text-center text-slate-600 text-xs mt-8">ClinicPortal · Patient</p>
    </aside>
  );

  /* ═══════════════════════════════════════════════════════════════════
     DASHBOARD SECTION — Upcoming + Previous
  ═══════════════════════════════════════════════════════════════════ */
  const DashboardSection = () => (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Patient Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your appointments and medical history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6">
        {[
          { key: 'upcoming',  label: 'Upcoming Appointments' },
          { key: 'previous',  label: 'Previous Appointments' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 px-1 border-b-2 font-bold text-sm transition-colors ${
              activeTab === key
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcoming.length > 0 ? upcoming.map((appt) => (
            <div key={appt.id} className="bg-gradient-to-r from-blue-600/20 to-slate-800/60 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">
                    {appt.doctor_name || `Doctor #${appt.doctor}`}
                  </h3>
                  <p className="text-slate-400 text-sm">{appt.date} at {appt.time}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Token</p>
                    <p className="text-2xl font-black text-cyan-400">{appt.token_number || '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Est. Wait</p>
                    <p className="text-2xl font-black text-amber-400">
                      {appt.estimated_wait_time ?? '—'}
                      <span className="text-sm font-medium text-amber-400/70 ml-1">min</span>
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[appt.status]}`}>
                    {appt.status}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm">No upcoming appointments.</p>
            </div>
          )}
        </div>
      )}

      {/* Previous */}
      {activeTab === 'previous' && (
        <div className="space-y-4">
          {previous.length > 0 ? previous.map((appt) => (
            <div key={appt.id} className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/80 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">
                    {appt.doctor_name || `Doctor #${appt.doctor}`}
                  </h3>
                  <p className="text-slate-400 text-sm">{appt.date} at {appt.time}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[appt.status] || 'bg-slate-600 text-slate-300'}`}>
                  {appt.status}
                </span>
              </div>
              {(appt.prescription || appt.advice || appt.doctor_remark) && (
                <div className="bg-slate-900/50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-bold text-cyan-400/70 uppercase tracking-wider mb-1">Prescription</p>
                    <p className="text-slate-300 text-sm whitespace-pre-line">{appt.prescription || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-400/70 uppercase tracking-wider mb-1">Advice</p>
                    <p className="text-slate-300 text-sm whitespace-pre-line">{appt.advice || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-400/70 uppercase tracking-wider mb-1">Doctor Feedback</p>
                    <p className="text-slate-300 text-sm whitespace-pre-line">{appt.doctor_remark || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm">No previous appointments.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     MY APPOINTMENTS — TODAY ONLY
  ═══════════════════════════════════════════════════════════════════ */
  const AppointmentsSection = () => (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black text-white">My Appointments</h1>
          <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            Today
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Showing appointments for <span className="text-white font-semibold">{TODAY}</span>
        </p>
      </div>

      {todayAppts.length > 0 ? (
        <div className="space-y-4">
          {todayAppts.map((appt) => (
            <div
              key={appt.id}
              className="bg-slate-800/60 border border-cyan-500/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-800/80 transition-colors"
            >
              {/* Doctor + time */}
              <div>
                <p className="text-white font-semibold text-base">
                  {appt.doctor_name || `Doctor #${appt.doctor}`}
                </p>
                <p className="text-slate-400 text-sm mt-0.5">{appt.time}</p>
              </div>

              {/* Token + Status */}
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Token</p>
                  <p className="text-xl font-black text-cyan-400">{appt.token_number ?? '—'}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[appt.status] || 'bg-slate-600 text-slate-300'}`}>
                  {appt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-700/60 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">No appointments today</p>
          <p className="text-slate-500 text-sm mt-1">Check your dashboard for upcoming appointments</p>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     PROFILE SECTION
  ═══════════════════════════════════════════════════════════════════ */

  /* ── Reusable input ─────────────────────────────────────────────── */
  const Field = ({ label, id, children }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  const ProfileSection = () => (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">My Profile</h1>
          <p className="text-slate-400 text-sm mt-1">View and update your personal details</p>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setSaveMsg(null); setContactErr(''); setEcErr(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-bold text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Save / error banner */}
      {saveMsg && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          saveMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {saveMsg.text}
        </div>
      )}

      {editing ? (
        /* ── EDIT FORM ──────────────────────────────────────────────── */
        <form onSubmit={handleProfileSave} className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-white text-lg mb-2">Edit Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Age */}
            <Field label="Age" id="age">
              <input
                id="age"
                type="number" min="1" max="120"
                value={formData.age}
                onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                className={inputCls}
                placeholder="Enter your age"
              />
            </Field>

            {/* Gender */}
            <Field label="Gender" id="gender">
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>

            {/* Contact */}
            <Field label="Contact (10 digits)" id="contact">
              <input
                id="contact"
                type="tel"
                maxLength={10}
                value={formData.contact}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setFormData((p) => ({ ...p, contact: v }));
                  setContactErr(validateContact(v));
                }}
                className={`${inputCls} ${contactErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                placeholder="10-digit mobile number"
              />
              {contactErr && <p className="mt-1 text-xs text-red-400">{contactErr}</p>}
            </Field>

            {/* Emergency Contact */}
            <Field label="Emergency Contact (10 digits)" id="emergency_contact">
              <input
                id="emergency_contact"
                type="tel"
                maxLength={10}
                value={formData.emergency_contact}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setFormData((p) => ({ ...p, emergency_contact: v }));
                  setEcErr(validateContact(v));
                }}
                className={`${inputCls} ${ecErr ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                placeholder="Emergency contact number"
              />
              {ecErr && <p className="mt-1 text-xs text-red-400">{ecErr}</p>}
            </Field>

            {/* Blood Group */}
            <Field label="Blood Group" id="blood_group">
              <select
                id="blood_group"
                value={formData.blood_group}
                onChange={(e) => setFormData((p) => ({ ...p, blood_group: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>

          {/* Medical History */}
          <Field label="Medical History" id="medical_history">
            <textarea
              id="medical_history"
              rows={3}
              value={formData.medical_history}
              onChange={(e) => setFormData((p) => ({ ...p, medical_history: e.target.value }))}
              className={`${inputCls} resize-none`}
              placeholder="Any known conditions..."
            />
          </Field>

          {/* Allergies */}
          <Field label="Allergies (optional)" id="allergies">
            <textarea
              id="allergies"
              rows={2}
              value={formData.allergies}
              onChange={(e) => setFormData((p) => ({ ...p, allergies: e.target.value }))}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Penicillin, Peanuts"
            />
          </Field>

          {/* Current Medication */}
          <Field label="Current Medication (optional)" id="current_medication">
            <textarea
              id="current_medication"
              rows={2}
              value={formData.current_medication}
              onChange={(e) => setFormData((p) => ({ ...p, current_medication: e.target.value }))}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Metformin 500mg daily"
            />
          </Field>

          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setSaveMsg(null); setContactErr(''); setEcErr(''); }}
              className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* ── VIEW PROFILE ───────────────────────────────────────────── */
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: 'Username',           value: profile?.username },
              { label: 'Age',                value: profile?.age ? `${profile.age} yrs` : null },
              { label: 'Gender',             value: profile?.gender
                  ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()
                  : null },
              { label: 'Blood Group',        value: profile?.blood_group || null },
              { label: 'Contact',            value: profile?.contact || null },
              { label: 'Emergency Contact',  value: profile?.emergency_contact || null },
              { label: 'Medical History',    value: profile?.medical_history || null, full: true },
              { label: 'Allergies',          value: profile?.allergies || null, full: true },
              { label: 'Current Medication', value: profile?.current_medication || null, full: true },
            ].map(({ label, value, full }) => (
              <div key={label} className={full ? 'sm:col-span-2' : ''}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`font-medium text-sm ${value ? 'text-white' : 'text-slate-500 italic'}`}>
                  {value || 'Not set'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════ */
  const renderSection = () => {
    if (activeSection === 'profile')      return <ProfileSection />;
    if (activeSection === 'appointments') return <AppointmentsSection />;
    return <DashboardSection />;
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-12 h-12 rounded-full bg-cyan-500 text-white shadow-xl flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 px-6 py-8 overflow-y-auto">
        {renderSection()}
      </main>
    </div>
  );
}
