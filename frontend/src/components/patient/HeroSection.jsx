import React from 'react';

export default function HeroSection({ name, onBook, onEditProfile }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-6 shadow-lg shadow-blue-900/40">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -right-4 h-36 w-36 rounded-full bg-white/5" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — greeting */}
        <div>
          <p className="text-sm font-medium text-blue-100">{greeting},</p>
          <h1 className="mt-0.5 text-2xl font-black text-white">
            {name || 'Patient'} 👋
          </h1>
          <p className="mt-1 text-sm text-blue-200">
            Welcome back to your health dashboard.
          </p>
        </div>

        {/* Right — actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onEditProfile}
            className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            Edit Profile
          </button>
          <button
            id="hero-book-btn"
            onClick={onBook}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Book New Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
