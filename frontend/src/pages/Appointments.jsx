import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { logoutUser } from '../services/auth';

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    BOOKED:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
    NO_SHOW:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-600/40 text-slate-300 border-slate-600'}`}>
      {status || 'UNKNOWN'}
    </span>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => (
  <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Clinic<span className="text-cyan-400">Portal</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
            Dashboard
          </Link>
          <Link to="/appointments" className="hidden sm:block text-sm font-medium text-white border-b-2 border-cyan-400 pb-0.5">
            Appointments
          </Link>
          <button
            onClick={logoutUser}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
);

// ─── Patient Profile Form (one-time) ──────────────────────────────────────────
const PatientProfileForm = ({ onComplete }) => {
  const [profile, setProfile] = useState({
    age: '', contact: '', gender: '', medical_history: '', allergies: '', current_medication: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await API.post('patient/profile/', profile);
      onComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm";

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white">Complete Your Profile</h2>
          <p className="text-slate-400 text-sm mt-1">We need a few details before you can book appointments</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Age *</label>
              <input type="number" required min="1" max="120" value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                placeholder="e.g. 28" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Gender *</label>
              <select required value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="" className="bg-slate-800">Select</option>
                <option value="MALE" className="bg-slate-800">Male</option>
                <option value="FEMALE" className="bg-slate-800">Female</option>
                <option value="OTHER" className="bg-slate-800">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Number *</label>
            <input type="tel" required value={profile.contact}
              onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
              placeholder="e.g. +91 98765 43210" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Medical History <span className="text-slate-600">(optional)</span></label>
            <textarea rows="2" value={profile.medical_history}
              onChange={(e) => setProfile({ ...profile, medical_history: e.target.value })}
              placeholder="e.g. Diabetes, Hypertension" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Allergies <span className="text-slate-600">(optional)</span></label>
            <input type="text" value={profile.allergies}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Dust" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Current Medication <span className="text-slate-600">(optional)</span></label>
            <input type="text" value={profile.current_medication}
              onChange={(e) => setProfile({ ...profile, current_medication: e.target.value })}
              placeholder="e.g. Metformin 500mg" className={inputClass} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all duration-200 transform hover:-translate-y-0.5">
            {saving ? 'Saving...' : 'Save Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Appointments() {
  const role = localStorage.getItem('role') || '';

  // Patient profile check
  const [profileCompleted, setProfileCompleted] = useState(role !== 'PATIENT'); // non-patients skip
  const [profileLoading, setProfileLoading] = useState(role === 'PATIENT');

  // Booking form state
  const [formData, setFormData] = useState({ doctor: '', date: '', time: '', reason: '', appointment_type: 'NORMAL' });
  const [bookResult, setBookResult] = useState(null);
  const [bookError, setBookError] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  // Doctors for dropdown
  const [doctors, setDoctors] = useState([]);

  // Appointments list state
  const [appointments, setAppointments] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');

  // Status update
  const [updating, setUpdating] = useState(null);

  // ── Check patient profile on mount ─────────────────────────────────────────
  useEffect(() => {
    if (role === 'PATIENT') {
      API.get('patient/profile/')
        .then((res) => {
          const data = res.data?.data ?? res.data;
          setProfileCompleted(data?.profile_completed === true);
        })
        .catch(() => setProfileCompleted(false))
        .finally(() => setProfileLoading(false));
    }
  }, [role]);

  const fetchAppointments = () => {
    setFetchLoading(true);
    setFetchError(null);
    API.get('appointments/')
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setAppointments(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setFetchError('Could not fetch appointments. Are you logged in?'))
      .finally(() => setFetchLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
    API.get('doctors/').then((res) => {
      const raw = res.data?.data ?? res.data;
      setDoctors(Array.isArray(raw) ? raw : []);
    }).catch(() => {});
  }, []);

  // ── Filtered appointments ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return appointments.filter((a) => {
      const matchDate   = filterDate   ? a.date === filterDate : true;
      const matchDoctor = filterDoctor ? String(a.doctor) === filterDoctor : true;
      return matchDate && matchDoctor;
    });
  }, [appointments, filterDate, filterDoctor]);

  const doctorIds = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return [...new Set(appointments.map((a) => a.doctor))];
  }, [appointments]);

  // ── Book appointment ────────────────────────────────────────────────────────
  const handleBook = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    setBookError(null);
    setBookResult(null);
    try {
      const res = await API.post('appointments/', formData);
      setBookResult(res.data.data || res.data);
      setFormData({ doctor: '', date: '', time: '', reason: '', appointment_type: 'NORMAL' });
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Booking failed.';
      setBookError(msg);
    } finally {
      setIsBooking(false);
    }
  };

  // ── Update status ───────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await API.patch(`appointments/${id}/`, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Update failed.';
      alert(msg);
    } finally {
      setUpdating(null);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile loading */}
        {profileLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm">Checking your profile...</p>
            </div>
          </div>
        ) : role === 'PATIENT' && !profileCompleted ? (
          /* Show profile form for first-time patients */
          <PatientProfileForm onComplete={() => setProfileCompleted(true)} />
        ) : (
          /* Main appointments interface */
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-black text-white">Appointments</h1>
              <p className="text-slate-400 text-sm mt-1">Book, filter, and manage appointments</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

              {/* ── Booking Form (patients only) ─────────────────────────────────── */}
              {role === 'PATIENT' && (
                <div className="xl:col-span-1">
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sticky top-24">
                    <h2 className="font-bold text-white mb-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                      Book Appointment
                    </h2>
                    <p className="text-slate-500 text-xs mb-5">Select your doctor and preferred slot</p>

                    {/* Success */}
                    {bookResult && (
                      <div className="mb-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm">
                        <p className="font-bold mb-2">✓ Booked Successfully!</p>
                        <div className="flex gap-6 mt-1">
                          <div>
                            <p className="text-2xl font-black">{bookResult.token_number || '—'}</p>
                            <p className="text-xs text-emerald-400/70">Token No.</p>
                          </div>
                          <div className="w-px bg-emerald-500/30" />
                          <div>
                            <p className="text-2xl font-black">{bookResult.estimated_wait_time || '0'}</p>
                            <p className="text-xs text-emerald-400/70">Min wait</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {bookError && (
                      <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                        {bookError}
                      </div>
                    )}

                    <form onSubmit={handleBook} className="space-y-3">
                      {/* Doctor dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Select Doctor</label>
                        <div className="relative">
                          <select required value={formData.doctor}
                            onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                            className={`${inputClass} appearance-none cursor-pointer`}>
                            <option value="" className="bg-slate-800">-- Choose a doctor --</option>
                            {doctors.map((doc) => (
                              <option key={doc.id} value={doc.id} className="bg-slate-800">
                                {doc.name} — {doc.specialization}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {formData.doctor && (() => {
                          const d = doctors.find((x) => String(x.id) === String(formData.doctor));
                          return d ? (
                            <p className="text-xs text-cyan-400/80 mt-1">
                              ₹{d.consultation_fee} · ~{d.avg_consultation_time} min/visit
                            </p>
                          ) : null;
                        })()}
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                          <input name="date" type="date" required value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className={`${inputClass} [color-scheme:dark]`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Time</label>
                          <input name="time" type="time" required value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className={`${inputClass} [color-scheme:dark]`} />
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Visit</label>
                        <textarea rows="2" value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          placeholder="e.g. Fever, headache for 3 days"
                          className={inputClass} />
                      </div>

                      {/* Appointment Type */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Appointment Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { val: 'NORMAL', label: 'New Visit', icon: '🩺' },
                            { val: 'FOLLOWUP', label: 'Follow-Up', icon: '🔄' },
                          ].map(({ val, label, icon }) => (
                            <button key={val} type="button"
                              onClick={() => setFormData({ ...formData, appointment_type: val })}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                                formData.appointment_type === val
                                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                              }`}>
                              <span>{icon}</span> {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="submit" disabled={isBooking}
                        className="w-full mt-1 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 shadow-lg shadow-blue-600/20 transition-all duration-200 transform hover:-translate-y-0.5">
                        {isBooking ? 'Booking...' : 'Book Now'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Table Panel ──────────────────────────────────────────────────── */}
              <div className={role === 'PATIENT' ? 'xl:col-span-3' : 'xl:col-span-4'}>
                {/* Filter bar */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input type="date" value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 [color-scheme:dark]" />
                    {filterDate && (
                      <button onClick={() => setFilterDate('')} className="text-slate-400 hover:text-white transition-colors text-xs">✕ Clear</button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <select value={filterDoctor}
                      onChange={(e) => setFilterDoctor(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400">
                      <option value="">All Doctors</option>
                      {doctorIds.map((id) => (
                        <option key={id} value={id}>Doctor #{id}</option>
                      ))}
                    </select>
                    {filterDoctor && (
                      <button onClick={() => setFilterDoctor('')} className="text-slate-400 hover:text-white transition-colors text-xs">✕ Clear</button>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-slate-500 text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    <button onClick={fetchAppointments}
                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-slate-300 hover:text-cyan-400 text-sm transition-colors hover:border-cyan-400/30">
                      ↻ Refresh
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
                  {fetchLoading ? (
                    <div className="py-16 text-center text-slate-500 text-sm">
                      <svg className="animate-spin w-6 h-6 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Loading appointments...
                    </div>
                  ) : fetchError ? (
                    <div className="py-12 text-center text-red-400 text-sm px-6">{fetchError}</div>
                  ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-sm">
                      No appointments match your filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-slate-900/50">
                            {['Token', 'Doctor', 'Patient', 'Date', 'Time', 'Wait', 'Type', 'Status', 'Actions'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filtered.map((appt, i) => (
                            <tr key={appt.id ?? i} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black">
                                  {appt.token_number || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-300 font-medium">#{appt.doctor}</td>
                              <td className="px-4 py-3 text-slate-300">#{appt.patient}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.date}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.time}</td>
                              <td className="px-4 py-3 text-slate-400">
                                {appt.estimated_wait_time != null ? `${appt.estimated_wait_time}m` : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  appt.appointment_type === 'FOLLOWUP'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-700/50 text-slate-400'
                                }`}>
                                  {appt.appointment_type === 'FOLLOWUP' ? 'Follow-Up' : 'New'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={appt.status} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {role === 'DOCTOR' && appt.status === 'BOOKED' && (
                                    <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 whitespace-nowrap">
                                      {updating === appt.id ? '...' : '✓ Complete'}
                                    </button>
                                  )}
                                  {role === 'RECEPTIONIST' && appt.status === 'BOOKED' && (
                                    <button onClick={() => updateStatus(appt.id, 'CANCELLED')} disabled={updating === appt.id}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40 whitespace-nowrap">
                                      {updating === appt.id ? '...' : '✕ Cancel'}
                                    </button>
                                  )}
                                  {role === 'ADMIN' && appt.status === 'BOOKED' && (
                                    <>
                                      <button onClick={() => updateStatus(appt.id, 'COMPLETED')} disabled={updating === appt.id}
                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
                                        {updating === appt.id ? '...' : '✓'}
                                      </button>
                                      <button onClick={() => updateStatus(appt.id, 'CANCELLED')} disabled={updating === appt.id}
                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40">
                                        {updating === appt.id ? '...' : '✕'}
                                      </button>
                                    </>
                                  )}
                                  {appt.status !== 'BOOKED' && (
                                    <span className="text-slate-600 text-xs italic">—</span>
                                  )}
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

            </div>
          </>
        )}
      </main>
    </div>
  );
}
