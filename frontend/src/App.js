import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import { isAuthenticated } from './services/auth';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={isAuthenticated() ? <Appointments /> : <Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/appointments" element={<Appointments />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;



