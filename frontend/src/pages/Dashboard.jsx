import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import DoctorDashboard from '../components/DoctorDashboard';
import PatientDashboard from '../components/PatientDashboard';
import ReceptionistDashboard from '../components/ReceptionistDashboard';

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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Clinic Dashboard</h1>
        <button className="text-red-500 hover:text-red-700" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
      </header>
      <main className="flex-1 p-6">
        {renderDashboard()}
      </main>
    </div>
  );
}
