import React, { useEffect, useState } from 'react';
import API from '../services/api';

import Sidebar         from './receptionist/Sidebar';
import DashboardPage   from './receptionist/DashboardPage';
import QueuePage       from './receptionist/QueuePage';
import AppointmentPage from './receptionist/AppointmentPage';
import DoctorPage      from './receptionist/DoctorPage';
import PatientPage     from './receptionist/PatientPage';
import { BookingModal, WalkInModal } from './receptionist/Modals';

/* ── tiny loading spinner ─────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <svg className="h-10 w-10 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-semibold tracking-wide">Loading dashboard…</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECEPTIONIST DASHBOARD — orchestrator
═══════════════════════════════════════════════════════════════ */
export default function ReceptionistDashboard() {
  const [activePage,    setActivePage]    = useState('queue');      // default to Queue
  const [appointments,  setAppointments]  = useState([]);
  const [stats,         setStats]         = useState({
    total_patients: 0, arrived: 0, pending: 0,
    completed: 0, cancelled: 0, active_doctors: 0,
  });
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false); // Used for silent reloads
  const [error,         setError]         = useState(null);

  // Global modals
  const [bookingOpen,   setBookingOpen]   = useState(false);
  const [walkInOpen,    setWalkInOpen]    = useState(false);

  // Toast
  const [toast,         setToast]         = useState(null);

  /* ── data loading ─────────────────────────────────────────── */
  const loadData = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    API.get('dashboard/receptionist/')
      .then(res => {
        const d = res.data?.data ?? res.data;
        setAppointments(d.appointments || []);

        const s = d.stats || {};
        setStats({
          total_patients: s.total_patients ?? 0,
          arrived:        s.arrived        ?? 0,
          pending:        s.pending        ?? 0,
          completed:      s.completed      ?? 0,
          cancelled:      s.cancelled      ?? 0,
          active_doctors: s.active_doctors ?? 0,
        });
        setError(null);
      })
      .catch(() => {
        if (!silent) setError('Failed to load receptionist data.');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => { loadData(false); }, []);

  /* ── toast helper ─────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── pending count for sidebar badge ─────────────────────── */
  const today        = new Date().toISOString().slice(0, 10);
  const pendingCount = appointments.filter(
    a => a.date === today && a.status === 'BOOKED'
  ).length;

  /* ── mobile sidebar state ─────────────────────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── render page ──────────────────────────────────────────── */
  const renderPage = () => {
    if (loading) return <Spinner />;
    if (error)   return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400 max-w-lg mx-auto mt-10">
        <p className="font-bold mb-2">Error</p>
        {error}
        <button onClick={() => loadData(false)} className="block mx-auto mt-4 rounded-lg bg-red-500/20 px-4 py-2 hover:bg-red-500/30 transition">Retry</button>
      </div>
    );

    switch (activePage) {
      case 'dashboard':    return <DashboardPage stats={stats} />;
      case 'queue':        return (
        <QueuePage
          appointments={appointments}
          onRefresh={(silent = false) => loadData(silent)}
          onBooking={() => setBookingOpen(true)}
          onWalkIn={() => setWalkInOpen(true)}
          loadingAppts={refreshing}
        />
      );
      case 'appointments': return <AppointmentPage appointments={appointments} onRefresh={() => loadData(false)} />;
      case 'doctors':      return <DoctorPage />;
      case 'patients':     return <PatientPage />;
      default:             return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-300 font-sans selection:bg-cyan-500/30">

      {/* ── Mobile sidebar overlay ─────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl" onClick={e => e.stopPropagation()}>
            <Sidebar
              active={activePage}
              onNavigate={p => { setActivePage(p); setSidebarOpen(false); }}
              pendingCount={pendingCount}
            />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <div className="hidden lg:flex z-10 shadow-2xl">
        <Sidebar
          active={activePage}
          onNavigate={setActivePage}
          pendingCount={pendingCount}
        />
      </div>

      {/* ── Main area ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        
        {/* Decorative Background Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <p className="text-sm font-bold text-white hidden lg:block tracking-wide">
              {activePage === 'queue' ? 'Queue Management' :
               activePage === 'dashboard' ? 'Overview Dashboard' :
               activePage === 'appointments' ? 'All Appointments' :
               activePage === 'doctors' ? 'Doctor Directory' : 'Patient Records'}
            </p>
          </div>

          {/* Quick action buttons — always visible */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto relative z-10">
            <button
              onClick={() => setWalkInOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 transition shadow-sm"
            >
              + Walk-in
            </button>
            <button
              onClick={() => setBookingOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 transition shadow-md shadow-cyan-500/20"
            >
              + Book
            </button>
            
            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-white">Receptionist</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online</span>
            </div>
            
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.href = '/';
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="mx-auto max-w-7xl">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* ── Toast ──────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-100'
            : 'border-red-500/30 bg-red-500/20 text-red-100'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            {toast.msg}
          </div>
        </div>
      )}

      {/* ── Global Booking Modal ───────────────────────────── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccess={() => {
          setBookingOpen(false);
          showToast('Appointment booked! ✓');
          loadData(true);
        }}
      />

      {/* ── Global Walk-in Modal ───────────────────────────── */}
      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSuccess={() => {
          setWalkInOpen(false);
          showToast('Walk-in added! ✓');
          loadData(true);
        }}
      />
    </div>
  );
}
