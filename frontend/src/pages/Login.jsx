import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, resetPassword } from '../services/auth';

// ── Inline Reset-Password Modal ────────────────────────────────────────────────
function ResetPasswordModal({ onClose }) {
  const [email, setEmail]             = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ email, newPassword });
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-slate-900/90 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-black text-lg tracking-tight">Reset Password</h2>
            <p className="text-slate-400 text-xs mt-0.5">Update your credentials securely</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-teal-400 font-bold text-sm">Password updated successfully!</p>
              <button
                onClick={onClose}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-bold shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 pr-12 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showPw ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !newPassword}
                  className="w-full mt-2 py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Main Login Page ─────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData]         = useState({ username: '', password: '' });
  const [error, setError]               = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset]       = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const isFormValid = formData.username.trim() !== '' && formData.password.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginUser(formData);
      localStorage.setItem('token', data.access);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_id', data.user_id);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.non_field_errors?.[0] || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const featureCards = [
    { title: 'Smart Booking', icon: '📅' },
    { title: 'Doctor Management', icon: '👨‍⚕️' },
    { title: 'Live Queue Tracking', icon: '⏱️' },
    { title: 'Secure Records', icon: '🛡️' }
  ];

  return (
    <>
      {showReset && <ResetPasswordModal onClose={() => setShowReset(false)} />}

      {/* Main Base Container */}
      <div className="min-h-screen font-sans selection:bg-cyan-500/30 flex flex-col lg:flex-row bg-slate-950 overflow-hidden relative">
        
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop")' }}
          />
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"></div>
        </div>

        {/* ── LEFT PANEL (Branding Section) ── */}
        <div className="relative w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-slate-900/40 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-slate-800 z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-400 p-[1px] shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">ClinicPortal</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
               <span className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase">HIPAA Compliant</span>
            </div>
          </div>

          {/* Main Copy */}
          <div className="my-12 lg:my-auto animate-in fade-in slide-in-from-left-8 duration-700 delay-150">
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.15] mb-6 tracking-tight">
              Smart Clinic <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Management System</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-md font-medium mb-12">
              Seamlessly manage appointments, doctors, and patient queues in real-time.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              {featureCards.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all">
                  <span className="text-xl">{feat.icon}</span>
                  <span className="text-sm font-semibold text-slate-300">{feat.title}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col gap-2 text-slate-500 text-sm font-medium animate-in fade-in duration-1000 delay-300 mt-8">
            <div className="flex flex-col gap-1.5 mb-4 text-slate-400 text-xs">
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> support@clinicportal.com</span>
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> +91 6396570478</span>
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Mon - Sat, 9:00 AM - 6:00 PM</span>
            </div>
            © {new Date().getFullYear()} ClinicPortal | All rights reserved
          </div>
        </div>

        {/* ── RIGHT PANEL (Login Section) ── */}
        <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-[500px]">

          {/* Login Card */}
          <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700 delay-300">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 p-8 sm:p-10 rounded-2xl shadow-xl">
              
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome back</h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-in slide-in-from-top-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-cyan-400">Email / Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your email or username"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-cyan-400">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all font-medium tracking-widest"
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="w-full mt-6 py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.5)] hover:-translate-y-[1px] flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
              </form>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-700/50"></div>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">New here?</span>
                <div className="flex-1 h-px bg-slate-700/50"></div>
              </div>

              <div className="mt-6">
                <Link
                  to="/signup"
                  className="w-full py-3.5 rounded-xl font-bold text-slate-300 text-sm bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create an Account
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
