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
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm">Loading dashboard…</p>
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
  const [error,         setError]         = useState(null);

  // Global modals (accessible from anywhere via nav bar)
  const [bookingOpen,   setBookingOpen]   = useState(false);
  const [walkInOpen,    setWalkInOpen]    = useState(false);

  // Toast
  const [toast,         setToast]         = useState(null);

  /* ── data loading ─────────────────────────────────────────── */
  const loadData = () => {
    setLoading(true);
    API.get('dashboard/receptionist/')
      .then(res => {
        const d = res.data?.data ?? res.data;
        setAppointments(d.appointments || []);

        // Build stats; backend may or may not include active_doctors
        const s = d.stats || {};
        setStats({
          total_patients: s.total_patients ?? 0,
          arrived:        s.arrived        ?? 0,
          pending:        s.pending        ?? 0,
          completed:      s.completed      ?? 0,
          cancelled:      s.cancelled      ?? 0,
          active_doctors: s.active_doctors ?? 0,
        });
      })
      .catch(() => setError('Failed to load receptionist data.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

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
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400">
        {error}
        <button onClick={loadData} className="ml-4 underline text-red-300 hover:text-red-200">Retry</button>
      </div>
    );

    switch (activePage) {
      case 'dashboard':    return <DashboardPage stats={stats} />;
      case 'queue':        return (
        <QueuePage
          appointments={appointments}
          onRefresh={loadData}
          onBooking={() => setBookingOpen(true)}
          onWalkIn={() => setWalkInOpen(true)}
        />
      );
      case 'appointments': return <AppointmentPage appointments={appointments} onRefresh={loadData} />;
      case 'doctors':      return <DoctorPage />;
      case 'patients':     return <PatientPage />;
      default:             return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] -mx-4 sm:-mx-6 lg:-mx-8">

      {/* ── Mobile sidebar overlay ─────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 h-full" onClick={e => e.stopPropagation()}>
            <Sidebar
              active={activePage}
              onNavigate={p => { setActivePage(p); setSidebarOpen(false); }}
              pendingCount={pendingCount}
            />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <div className="hidden lg:flex">
        <Sidebar
          active={activePage}
          onNavigate={setActivePage}
          pendingCount={pendingCount}
        />
      </div>

      {/* ── Main area ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">

        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/90 backdrop-blur-xl px-5 py-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-slate-800 text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <p className="text-sm font-semibold text-slate-300 hidden lg:block capitalize">
            {activePage === 'queue' ? '🗂️ Queue Management' :
             activePage === 'dashboard' ? '📊 Dashboard' :
             activePage === 'appointments' ? '📅 Appointments' :
             activePage === 'doctors' ? '👨‍⚕️ Doctors' : '👥 Patients'}
          </p>

          {/* Quick action buttons — always visible */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setWalkInOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              + Walk-in
            </button>
            <button
              onClick={() => setBookingOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white hover:from-blue-500 hover:to-cyan-400 transition shadow"
            >
              + Book
            </button>
            <button
              onClick={loadData}
              className="rounded-xl border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          {renderPage()}
        </main>
      </div>

      {/* ── Toast ──────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-semibold shadow-xl ${
          toast.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Global Booking Modal ───────────────────────────── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccess={() => {
          setBookingOpen(false);
          showToast('Appointment booked! ✓');
          loadData();
        }}
      />

      {/* ── Global Walk-in Modal ───────────────────────────── */}
      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSuccess={() => {
          setWalkInOpen(false);
          showToast('Walk-in added! ✓');
          loadData();
        }}
      />
    </div>
  );
}
