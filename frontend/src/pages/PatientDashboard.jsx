import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

// Components
import HeroSection          from '../components/patient/HeroSection';
import StatsCards           from '../components/patient/StatsCards';
import UpcomingAppointments from '../components/patient/UpcomingAppointments';
import HealthHistory        from '../components/patient/HealthHistory';
import RightPanel           from '../components/patient/RightPanel';
import BookingModal         from '../components/patient/BookingModal';

/* ─── Inline Edit Profile Modal ─────────────────────────────────── */
function EditProfileModal({ open, profile, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(profile || {});
      setErr('');
      setSuccessMsg('');
      setImageFile(null);
      setImagePreview(profile?.profile_image || null);
    }
  }, [open, profile]);

  if (!open) return null;

  const iCls = 'w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none';

  const requiredFields = ['age', 'contact', 'blood_group', 'gender', 'address'];
  const isFormValid = requiredFields.every(k => {
    const val = form[k];
    if (typeof val === 'string') return val.trim().length > 0;
    return val !== null && val !== undefined;
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) {
      setErr('Please fill all required fields');
      return;
    }
    
    setSaving(true); setErr(''); setSuccessMsg('');
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        let val = form[k];
        // Clean phone numbers on frontend too for immediate UX
        if ((k === 'contact' || k === 'emergency_contact') && val) {
          val = String(val).replace(/\D/g, ''); // keep only digits
        }
        if (val !== null && val !== undefined) {
          fd.append(k, val);
        }
      });
      if (imageFile) {
        fd.append('profile_image', imageFile);
      }

      await API.patch('patient/profile/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Profile saved successfully!');
      
      // Delay closing to let user see the success message
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1000);
      
    } catch (e) {
      setErr(e?.response?.data?.message || 'Save failed. Please check your inputs (Age and 10-digit Contact are required).');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-black text-white text-lg">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {err && <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{err}</div>}
          {successMsg && <div className="text-sm text-emerald-400 bg-emerald-500/10 rounded-xl px-4 py-2">{successMsg}</div>}
          {!isFormValid && !err && !successMsg && (
             <div className="text-xs text-amber-400/80 bg-amber-500/10 rounded-xl px-4 py-2">
               Please fill all required fields (*).
             </div>
          )}

          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl text-slate-500">👤</span>
                )}
              </div>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-400 transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </label>
              <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
            <p className="text-xs text-slate-500">Update Profile Picture</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Age *', 'age', 'number', '28'],
              ['Contact *', 'contact', 'text', '9876543210'],
              ['Emergency Contact', 'emergency_contact', 'text', '9876543211'],
              ['Blood Group *', 'blood_group', 'select', ['A+','A-','B+','B-','O+','O-','AB+','AB-']],
              ['Gender *', 'gender', 'select', [['MALE','Male'],['FEMALE','Female'],['OTHER','Other']]],
            ].map(([label, key, type, options]) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
                {type === 'select' ? (
                  <select value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={iCls}>
                    <option value="">Select</option>
                    {typeof options[0] === 'string' 
                      ? options.map(o => <option key={o} value={o}>{o}</option>)
                      : options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
                  </select>
                ) : (
                  <input type={type} placeholder={options} value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={iCls} />
                )}
              </div>
            ))}
          </div>

          {/* Full width fields */}
          {[
            ['Address *', 'address', 'text', '123 Main St, City'],
            ['Medical History', 'medical_history', 'textarea', 'Records of past illnesses, surgeries, and family medical background.'],
            ['Allergies', 'allergies', 'textarea', 'Known sensitivities to medications or food.'],
            ['Current Medications', 'current_medication', 'textarea', 'A list of active prescriptions and dosages.'],
            ['Insurance Info', 'insurance_info', 'textarea', 'Insurance provider, policy number, etc.'],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
              {type === 'textarea' ? (
                <textarea placeholder={ph} value={form[key] || ''} rows={2}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={iCls} />
              ) : (
                <input type={type} placeholder={ph} value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={iCls} />
              )}
            </div>
          ))}

        </div>
        <div className="flex gap-3 border-t border-white/10 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !isFormValid}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20 active:scale-95">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Dropdown ───────────────────────────────────────────── */
function ProfileDropdown({ name, profileImage, onEditProfile, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
      >
        {profileImage ? (
          <img src={profileImage} alt="Profile" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-xs font-black">
            {name?.[0]?.toUpperCase() || 'P'}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-white leading-tight">{name || 'Patient'}</p>
          <p className="text-[10px] text-slate-500">Patient</p>
        </div>
        <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slate-900 shadow-2xl z-50 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEditProfile(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
          <div className="h-px bg-white/10" />
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── NavLink ────────────────────────────────────────────────────── */
function NavLink({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-sm font-semibold pb-0.5 border-b-2 transition ${
        active
          ? 'text-cyan-400 border-cyan-400'
          : 'text-slate-400 border-transparent hover:text-white hover:border-white/30'
      }`}>
      {label}
    </button>
  );
}

/* ─── Spinner ────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-10 w-10 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-400 font-medium tracking-wide">Loading your dashboard…</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PATIENT DASHBOARD — orchestrator
═══════════════════════════════════════════════════════════════════ */
export default function PatientDashboard() {
  const navigate = useNavigate();

  const [profile,      setProfile]      = useState({});
  const [appointments, setAppointments] = useState([]);
  const [labReports,   setLabReports]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [activePage,   setActivePage]   = useState('dashboard'); // 'dashboard' | 'appointments'

  // Modals
  const [bookingOpen,     setBookingOpen]     = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res  = await API.get('dashboard/patient/');
      const data = res.data?.data || res.data;
      const prof = data.profile || {};
      setProfile(prof);
      setAppointments(data.patients_appointments || data.appointments || []);
      setLabReports(data.lab_reports || []);

      // NEW: Force open profile if not completed, but only once per session
      if (prof.profile_completed === false && !sessionStorage.getItem('profilePrompted')) {
        setEditProfileOpen(true);
        sessionStorage.setItem('profilePrompted', 'true');
      }
    } catch {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
    // NEW: Stop polling if a modal is open so the user doesn't lose their typed data
    if (bookingOpen || editProfileOpen) return;

    const id = setInterval(() => loadData(true), 20000);
    return () => clearInterval(id);
  }, [bookingOpen, editProfileOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading) return <Spinner />;

  // Resolve display name — dashboard returns profile.username; full name if set
  const profileName = profile.name || profile.username || 'Patient';

  // Stats helpers
  const today = new Date().toISOString().slice(0, 10);
  const todayObj = new Date(today + 'T00:00:00');
  const upcoming = appointments.filter(
    a => a.status === 'BOOKED' && new Date(a.date + 'T00:00:00') >= todayObj
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-cyan-500/30">

      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo + links */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                <span className="font-black text-sm">C</span>
              </div>
              <span className="text-lg font-black tracking-tight text-white">ClinicPortal</span>
            </div>
            <div className="hidden md:flex gap-6">
              <NavLink label="Dashboard"     active={activePage === 'dashboard'}     onClick={() => setActivePage('dashboard')} />
              <NavLink label="Appointments"  active={activePage === 'appointments'}  onClick={() => setActivePage('appointments')} />
            </div>
          </div>

          {/* Profile dropdown */}
          <ProfileDropdown
            name={profileName}
            profileImage={profile.profile_image}
            onEditProfile={() => setEditProfileOpen(true)}
            onLogout={handleLogout}
          />
        </div>
      </nav>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {activePage === 'dashboard' && (
            <>
              {/* 1. Hero */}
              <HeroSection
                name={profileName}
                onBook={() => setBookingOpen(true)}
                onEditProfile={() => setEditProfileOpen(true)}
              />

              {/* 2. Stats 4-col */}
              <StatsCards upcoming={upcoming} appointments={appointments} profile={profile} />
            </>
          )}

          {/* 3. Main grid */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

            {/* LEFT — 8 cols */}
            <div className="space-y-8 lg:col-span-8">
              <UpcomingAppointments
                appointments={appointments}
                filterMode={activePage === 'appointments' ? 'previous' : 'upcoming'}
                onCancel={loadData}
                onBook={() => setBookingOpen(true)}
              />
              {activePage === 'appointments' && <HealthHistory appointments={appointments} labReports={labReports} onReportsChanged={loadData} />}
            </div>

            {/* RIGHT — 4 cols */}
            {activePage === 'dashboard' && (
              <div className="lg:col-span-4">
                <div className="sticky top-20">
                  <RightPanel appointments={appointments} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccess={() => { setBookingOpen(false); loadData(true); }}
      />
      <EditProfileModal
        open={editProfileOpen}
        profile={profile}
        onClose={() => setEditProfileOpen(false)}
        onSaved={() => loadData(true)}
      />

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-slate-950/90 backdrop-blur-lg md:hidden">
        <div className="flex">
          {[['dashboard','Dashboard','M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
            ['appointments','Appointments','M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z']
          ].map(([page, label, path]) => (
            <button key={page} onClick={() => setActivePage(page)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                activePage === page ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activePage === page ? 2.5 : 1.5} d={path} />
              </svg>
              {label}
            </button>
          ))}
          <button onClick={() => setBookingOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-cyan-400">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Book
          </button>
        </div>
      </div>

      {/* Mobile bottom nav spacer */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
