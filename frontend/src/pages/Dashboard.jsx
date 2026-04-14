import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import DoctorDashboard from '../components/DoctorDashboard';
import PatientDashboard from '../components/PatientDashboard';
import ReceptionistDashboard from '../components/ReceptionistDashboard';
import { logoutUser, isAuthenticated } from '../services/auth';

const ROLE_COLORS = {
  ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  DOCTOR: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RECEPTIONIST: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  PATIENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
    setRole(localStorage.getItem('role'));
  }, [navigate]);

  const renderDashboard = () => {
    switch (role) {
      case 'ADMIN':        return <AdminDashboard />;
      case 'DOCTOR':       return <DoctorDashboard />;
      case 'RECEPTIONIST': return <ReceptionistDashboard />;
      case 'PATIENT':      return <PatientDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-sm font-medium">Loading your dashboard...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tight">
                Clinic<span className="text-cyan-400">Portal</span>
              </span>
            </Link>

            {/* Nav links + actions */}
            <div className="flex items-center gap-4">
              <Link
                to="/appointments"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Appointments
              </Link>

              {role && (
                <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[role] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                  {role}
                </span>
              )}

              <button
                onClick={logoutUser}
                className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
