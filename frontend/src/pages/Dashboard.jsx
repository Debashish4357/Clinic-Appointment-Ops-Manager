import React from 'react';
import AdminDashboard from '../components/AdminDashboard';
import DoctorDashboard from '../components/DoctorDashboard';
import ReceptionistDashboard from '../components/ReceptionistDashboard';
import PatientDashboard from '../components/PatientDashboard';

const Dashboard = () => {
  const role = localStorage.getItem('role');

  const renderDashboard = () => {
    switch (role) {
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
          <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600">Welcome! Your role is not recognized.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
