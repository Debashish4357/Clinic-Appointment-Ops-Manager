import React from 'react';

export default function HeroSection({ name, onBook, onEditProfile }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-slate-900 p-6 sm:p-8 shadow-2xl shadow-cyan-500/5">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-600/15 blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              ● Active Patient
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {name?.split(' ')[0] || 'Patient'}
            </span>{' '}
            👋
          </h1>
          <p className="mt-1.5 text-slate-400 text-sm sm:text-base">
            Welcome back to your health dashboard
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end">
          <button
            onClick={onBook}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-blue-500 hover:to-cyan-400 active:scale-95 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
