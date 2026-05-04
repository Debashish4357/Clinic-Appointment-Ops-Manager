import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 transition-colors';

function CreateReceptionistForm({ onCreated }) {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await API.post('create-receptionist/', form);
      setMsg({ type: 'success', text: res.data.message });
      setForm({ username: '', password: '' });
      if (onCreated) onCreated();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create receptionist.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-white text-xl">New Receptionist</h2>
          <p className="text-cyan-400 text-sm mt-0.5">Register a staff account</p>
        </div>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 relative z-10 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span className="text-xl">{msg.type === 'success' ? '✅' : '❌'}</span>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
          <input
            type="text" required
            value={form.username}
            onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
            className={inputCls}
            placeholder="e.g. jdoe_frontdesk"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
          <input
            type="password" required minLength={6}
            value={form.password}
            onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
            className={inputCls}
            placeholder="Min. 6 characters"
          />
        </div>
        <button
          type="submit" disabled={saving}
          className="w-full mt-2 py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
        >
          {saving ? 'Creating Account...' : 'Create Receptionist'}
        </button>
      </form>
    </div>
  );
}

export default function StaffManagement() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = () => {
    setLoading(true);
    API.get('staff/')
      .then(res => setStaff(res.data.data || []))
      .catch(() => setError('Failed to load staff list.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-slate-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Staff Management</h1>
              <p className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Admin Tools</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Staff List */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Staff Members</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Username</th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Role</th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Email</th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
                      <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-10"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                    ) : staff.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-slate-500 py-10">No staff found.</td></tr>
                    ) : (
                      staff.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 font-semibold text-white">{user.username}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400">{user.email}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{user.date_joined}</td>
                          <td className="px-5 py-3 text-center">
                            <div className={`w-2 h-2 rounded-full mx-auto ${user.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`} title={user.is_active ? 'Active' : 'Inactive'} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Add Staff */}
          <div className="lg:col-span-4">
            <CreateReceptionistForm onCreated={fetchStaff} />
          </div>
        </div>
      </main>
    </div>
  );
}
