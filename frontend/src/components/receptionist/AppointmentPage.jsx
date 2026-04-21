import React, { useState } from 'react';
import API from '../../services/api';
import { BookingModal } from './Modals';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

const TABS = ['Today', 'Upcoming', 'History'];

export default function AppointmentPage({ appointments, onRefresh }) {
  const [tab,         setTab]         = useState('Today');
  const [bookingOpen, setBookingOpen] = useState(false);

  const today    = new Date().toISOString().slice(0, 10);
  const todayObj = new Date(today + 'T00:00:00');

  const byTab = appointments.filter(a => {
    const d = new Date(a.date + 'T00:00:00');
    if (tab === 'Today')    return a.date === today;
    if (tab === 'Upcoming') return d > todayObj && a.status === 'BOOKED';
    if (tab === 'History')  return ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status);
    return true;
  }).sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await API.patch(`appointments/${id}/`, { status: 'CANCELLED' }); onRefresh(); }
    catch (err) { alert(err?.response?.data?.message || 'Failed.'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Appointments</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage all scheduled appointments</p>
        </div>
        <button onClick={() => setBookingOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 transition shadow-md">
          + Book Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-slate-900 p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-md">
        {byTab.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/60">
                  {['Token', 'Patient', 'Doctor', 'Date', 'Time', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {byTab.map(appt => (
                  <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-black text-amber-300">
                        {appt.token_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{appt.patient_name}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{appt.doctor_name}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.date}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{appt.time}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[appt.status] || 'bg-slate-700 text-slate-300'}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {appt.status === 'BOOKED' && (
                        <button onClick={() => handleCancel(appt.id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition">
                          Cancel
                        </button>
                      )}
                      {!['BOOKED'].includes(appt.status) && (
                        <span className="text-xs text-slate-600 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-slate-400 text-sm">No appointments in this category.</p>
          </div>
        )}
      </div>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)}
        onSuccess={() => { setBookingOpen(false); onRefresh(); }} />
    </div>
  );
}
