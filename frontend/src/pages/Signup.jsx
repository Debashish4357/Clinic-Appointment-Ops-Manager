import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData]         = useState({ username: '', email: '', password: '' });
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 6)  strength++;
      if (value.length >= 10) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const isFormValid = formData.username.trim() !== '' && formData.password.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        email: formData.username.includes('@') ? formData.username : formData.email || '',
      };
      await registerUser(payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const data = err.response?.data;
      const msg  = data?.detail || data?.email?.[0] || data?.username?.[0] || 'Registration failed. Please try again.';
      setError(msg);
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

  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-teal-400', 'bg-cyan-500'];

  return (
    <>
      {/* Main Base Container */}
      <div className="min-h-screen font-sans selection:bg-cyan-500/30 flex flex-col lg:flex-row bg-slate-950 overflow-hidden relative">
        
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
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
            <div className="flex flex-col gap-4 text-slate-300 font-medium mb-12">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">1</div>
                <span>Create account</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">2</div>
                <span>Complete profile</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">3</div>
                <span>Manage appointments</span>
              </div>
            </div>

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

        {/* ── RIGHT PANEL (Signup Form Section) ── */}
        <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-[500px]">

          {/* Registration Card */}
          <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700 delay-300">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 p-8 sm:p-10 rounded-2xl shadow-xl">
              
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Account</h2>
                <p className="text-slate-400 text-sm mt-1.5 font-medium">Complete your profile after registration</p>
              </div>

              {success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Registration Successful!</h3>
                  <p className="text-slate-400 text-sm">Redirecting you to login securely...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-in slide-in-from-top-2">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
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

                    {/* Password Input */}
                    <div className="space-y-1.5 group">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-cyan-400">Password</label>
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
                          placeholder="Create a strong password"
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

                      {/* Password Strength Indicator */}
                      {formData.password.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 w-full rounded-full transition-colors duration-300 ${
                                passwordStrength >= level ? strengthColor[passwordStrength] : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      )}
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
                          Processing...
                        </>
                      ) : (
                        <>
                          Register Account
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
                    <p className="text-slate-400 text-xs font-medium">
                      Already have an account?{' '}
                      <Link to="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
