import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import DoctorDashboard from '../components/DoctorDashboard';
import PatientDashboard from '../components/PatientDashboard';
import ReceptionistDashboard from '../components/ReceptionistDashboard';
import { logoutUser } from '../services/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Dummy check for role from local storage/token
    const userRole = localStorage.getItem('role');
    if (!userRole) {
      navigate('/');
    } else {
      setRole(userRole);
    }
  }, [navigate]);

  const renderDashboard = () => {
    switch (role) {
      case 'ADMIN': return <AdminDashboard />;
      case 'DOCTOR': return <DoctorDashboard />;
      case 'RECEPTIONIST': return <ReceptionistDashboard />;
      case 'PATIENT': return <PatientDashboard />;
      default: return <div>Loading...</div>;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'DOCTOR':
        return <DoctorDashboard />;
      case 'RECEPTIONIST':
        return <ReceptionistDashboard />;
      case 'PATIENT':
        return <PatientDashboard />;
      default:
        return (
          <div className="py-8">
            <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
              <p className="text-gray-600">Welcome! Your role is not recognized or you have no assigned dashboard.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Clinic Dashboard</h1>
        <button className="text-red-500 hover:text-red-700" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
      </header>
      <main className="flex-1 p-6">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Clinic<span className="text-blue-600">Portal</span></span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                {role} Mode
              </span>
              <button
                onClick={logoutUser}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 focus:outline-none transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
