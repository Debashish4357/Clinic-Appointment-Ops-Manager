import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

import DoctorDashboard from '../components/DoctorDashboard';
import ReceptionistDashboard from '../components/ReceptionistDashboard';
import AdminDashboard from '../components/AdminDashboard';
import PatientDashboard from './PatientDashboard'; // NEW: Points to pages/PatientDashboard.jsx
import SunnyLoader from '../components/SunnyLoader';

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch user profile from the backend to guarantee correct role
    API.get('profile/')
      .then((res) => {
        const userRole = res.data.role;
        setRole(userRole);
        // Sync local storage just in case it was modified
        localStorage.setItem('role', userRole);
      })
      .catch((err) => {
        // If profile fetch fails (e.g., token expired), logout
        console.error('Failed to fetch profile:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return <SunnyLoader />;
  }

  // Render role-specific dashboard
  switch (role) {
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'RECEPTIONIST':
      return <ReceptionistDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    default:
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f172a] text-white">
          <p className="text-xl">
            Unknown Role: <span className="font-bold text-red-500">{role}</span>. Please contact support.
          </p>
        </div>
      );
  }
}
