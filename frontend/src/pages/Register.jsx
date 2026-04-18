import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/auth';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Always register as PATIENT — role not user-selectable
      await registerUser({ ...formData, role: 'PATIENT' });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.detail || err.response.data.error || 'Registration failed.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1538108149393-ce162afd6b1b?q=80&w=2670&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Patient Sign Up</h2>
          <p className="text-sm text-gray-600 mt-2">Create your patient account to book appointments.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50/90 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50/90 border-l-4 border-emerald-500 p-4 rounded-md">
              <p className="text-sm text-emerald-700 font-medium">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="username">Username</label>
            <input
              id="username" name="username" type="text" required
              value={formData.username} onChange={handleChange}
              placeholder="Choose a username"
              className="block w-full px-4 py-3 rounded-xl border border-gray-300/80 bg-white/70 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" required minLength={6}
              value={formData.password} onChange={handleChange}
              placeholder="Min. 6 characters"
              className="block w-full px-4 py-3 rounded-xl border border-gray-300/80 bg-white/70 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none placeholder-gray-400"
            />
          </div>

          {/* No role dropdown — patients only */}

          <button
            type="submit" disabled={loading || !!success}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : 'Create Patient Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
