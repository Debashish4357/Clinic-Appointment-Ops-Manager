import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { VitalsModal, RescheduleModal } from './Modals';

const STATUS_STYLES = {
  BOOKED:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  COMPLETED:   'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED:   'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:     'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

const FILTER_TABS = ['Active', 'All', 'BOOKED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function QueueBanner({ appointments }) {
  const serving  = appointments.find(a => a.status === 'IN_PROGRESS' || a.status === 'ARRIVED');
  const pending  = appointments.filter(a => a.status === 'BOOKED');
  const nextUp   = pending[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-center shadow-lg transition hover:bg-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400/80">Now Serving</p>
        <p className="mt-2 text-4xl font-black text-amber-300 drop-shadow-md">
          {serving ? `#${serving.token_number}` : '—'}
        </p>
        {serving && <p className="text-sm font-semibold text-amber-100 mt-1 truncate">{serving.patient_name}</p>}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-center shadow-lg transition hover:bg-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-400/80">Next</p>
        <p className="mt-2 text-4xl font-black text-cyan-300 drop-shadow-md">
          {nextUp ? `#${nextUp.token_number}` : '—'}
        </p>
        {nextUp && <p className="text-sm font-semibold text-cyan-100 mt-1 truncate">{nextUp.patient_name}</p>}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-center shadow-lg transition hover:bg-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Waiting</p>
        <p className="mt-2 text-4xl font-black text-white drop-shadow-md">{pending.length}</p>
        <p className="text-sm font-semibold text-slate-300 mt-1">in queue</p>
      </div>
    </div>
  );
}

function ActionBtn({ label, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${color}`}
    >
      {label}
    </button>
  );
}

export default function QueuePage({ appointments, onRefresh, onBooking, onWalkIn, loadingAppts, selectedDate, onDateChange }) {
  const [filter,    setFilter]    = useState('Active');
  const [search,    setSearch]    = useState('');
  const [updating,  setUpdating]  = useState(null);
  const [vitalsFor, setVitalsFor] = useState(null);
  const [reschedFor, setReschedFor] = useState(null);
  const [patientModal, setPatientModal] = useState(null);
  const [fetchingPt, setFetchingPt] = useState(false);
  
  // Last updated timer
  const [lastUpdated, setLastUpdated] = useState(0);

  useEffect(() => {
    // Polling every 10 seconds
    const intervalId = setInterval(() => {
      onRefresh(true); // pass true for silent reload without showing loading spinner
    }, 10000);

    // Timer for "Updated X sec ago"
    const timerId = setInterval(() => {
      setLastUpdated(prev => prev + 1);
    }, 1000);

    return () => { clearInterval(intervalId); clearInterval(timerId); };
  }, [onRefresh]);

  // Reset timer when appointments change (meaning a refresh happened)
  useEffect(() => {
    setLastUpdated(0);
  }, [appointments]);

  const filtered = appointments.filter(a => {
    let matchStatus = false;
    if (filter === 'Active') {
      matchStatus = ['BOOKED', 'ARRIVED', 'IN_PROGRESS'].includes(a.status);
    } else if (filter === 'All') {
      matchStatus = true;
    } else {
      matchStatus = a.status === filter;
    }
    const q = search.toLowerCase();
    const matchSearch = !q || a.patient_name?.toLowerCase().includes(q) || a.patient_phone?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  /* ── keyboard shortcuts ────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const pending = appointments.filter(a => a.status === 'BOOKED');
      const arrived = appointments.filter(a => a.status === 'ARRIVED');
      
      if (e.key.toLowerCase() === 'a') {
        if (pending.length > 0 && !updating) updateStatus(pending[0].id, 'ARRIVED');
      }
      if (e.key.toLowerCase() === 'n') {
        if (arrived.length > 0 && !updating) updateStatus(arrived[0].id, 'IN_PROGRESS');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appointments, updating]);

  /* ── actions ───────────────────────────────────────────────────── */
  const updateStatus = async (id, status) => {
    setUpdating(id);
    try { await API.patch(`appointments/${id}/`, { status }); onRefresh(true); }
    catch (err) { alert(err?.response?.data?.message || 'Action failed.'); }
    finally { setUpdating(null); }
  };

  const moveQueue = async (id, action) => {
    setUpdating(id);
    try { await API.patch(`appointments/${id}/move/`, { action }); onRefresh(true); }
    catch (err) { alert(err?.response?.data?.message || 'Move failed.'); }
    finally { setUpdating(null); }
  };

  const adjustWait = async (id, change) => {
    setUpdating(id);
    try { await API.patch(`appointments/${id}/wait-time/`, { change }); onRefresh(true); }
    catch { alert('Failed to update wait time.'); }
    finally { setUpdating(null); }
  };

  const fetchPatient = async (patientId) => {
    setFetchingPt(true);
    try { const r = await API.get(`patient/${patientId}/details/`); setPatientModal(r.data); }
    catch { alert('Failed to load patient.'); }
    finally { setFetchingPt(false); }
  };

  /* ── dynamic wait time calculation (override API if needed) ───── */
  // The plan asks to calculate wait time dynamically: patientsAhead * 15.
  // We'll calculate it for BOOKED patients based on their index.
  const calcWaitTime = (appt, idx, allBooked) => {
    if (appt.status !== 'BOOKED') return appt.estimated_wait_time;
    const bookedIndex = allBooked.findIndex(a => a.id === appt.id);
    if (bookedIndex === -1) return appt.estimated_wait_time;
    // Base wait time calculation: 15 mins per patient ahead
    return bookedIndex * 15;
  };

  const allBooked = filtered.filter(a => a.status === 'BOOKED');

  return (
    <div className="space-y-6">
      {/* Header + quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white drop-shadow-sm">Queue Management</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm font-medium">Daily appointment queue</p>
            <div className="h-1 w-1 rounded-full bg-slate-600"></div>
            <p className="text-slate-500 text-xs italic">Updated {lastUpdated}s ago</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none transition shadow-sm"
          />
          <button onClick={() => { setLastUpdated(0); onRefresh(true); }}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition shadow-sm">
            ↻
          </button>
        </div>
      </div>

      {/* Queue banner */}
      <QueueBanner appointments={appointments} />

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text" value={search} placeholder="Search patient name or phone..."
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:bg-white/10 focus:outline-none transition shadow-inner"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur p-1 overflow-x-auto hide-scrollbar">
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filter === tab ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Queue table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
        {loadingAppts && filtered.length === 0 ? (
           <div className="p-4 space-y-3">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl border border-white/5"></div>
             ))}
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <tr>
                  {['Token', 'Patient', 'Doctor', 'Time / Wait', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((appt, idx) => {
                  const wait = calcWaitTime(appt, idx, allBooked);
                  
                  return (
                  <tr key={appt.id} className="hover:bg-white/10 transition-colors group">
                    {/* Token */}
                    <td className="px-5 py-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-sm font-black text-white shadow-inner group-hover:border-cyan-500/50 group-hover:text-cyan-300 transition-colors">
                        {appt.token_number}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-white text-base">{appt.patient_name}</p>
                          {appt.patient_phone && <p className="text-xs text-slate-400 mt-0.5">{appt.patient_phone}</p>}
                          {appt.reason && <p className="text-xs text-slate-400 italic truncate max-w-[180px] mt-0.5">"{appt.reason}"</p>}
                        </div>
                        <button onClick={() => fetchPatient(appt.patient_id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition shadow-sm" title="Patient Details">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {(appt.bp || appt.heart_rate) && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-teal-500/10 text-teal-300 rounded-md border border-teal-500/20">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            Vitals
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-200 whitespace-nowrap">{appt.doctor_name}</p>
                    </td>

                    {/* Time + wait */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-200 whitespace-nowrap">{appt.time}</p>
                      {(appt.status === 'BOOKED' || appt.status === 'ARRIVED') && (
                        <div className="flex items-center gap-1.5 mt-1 border border-white/5 bg-slate-900/50 rounded-lg px-2 py-1 w-fit">
                          <span className="text-xs font-medium text-amber-400/80">~{wait} min wait</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-black shadow-sm ${STATUS_STYLES[appt.status] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {appt.status === 'BOOKED' && (
                          <>
                            <ActionBtn label="Mark Arrived" disabled={updating === appt.id}
                              color="bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                              onClick={() => updateStatus(appt.id, 'ARRIVED')} />
                            <ActionBtn label="Cancel" disabled={updating === appt.id}
                              color="bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20"
                              onClick={() => { if (window.confirm('Cancel appointment?')) updateStatus(appt.id, 'CANCELLED'); }} />
                          </>
                        )}
                        
                        {appt.status === 'ARRIVED' && (
                          <>
                            <ActionBtn label="Vitals" disabled={updating === appt.id}
                              color="bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20"
                              onClick={() => setVitalsFor(appt)} />
                            <ActionBtn label="Start Consultation" disabled={updating === appt.id}
                              color="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                              onClick={() => updateStatus(appt.id, 'IN_PROGRESS')} />
                          </>
                        )}

                        {appt.status === 'IN_PROGRESS' && (
                          <ActionBtn label="Complete" disabled={updating === appt.id}
                            color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                            onClick={() => updateStatus(appt.id, 'COMPLETED')} />
                        )}

                        {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status) && (
                          <span className="text-xs font-semibold text-slate-500 italic">—</span>
                        )}

                        {/* Queue move buttons - only for booked */}
                        {appt.status === 'BOOKED' && (
                          <div className="flex gap-1 ml-2 border-l border-white/10 pl-2">
                            <button onClick={() => moveQueue(appt.id, 'UP')}
                              disabled={updating === appt.id || idx === 0}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:hover:bg-slate-800 shadow-sm" title="Move Up">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button onClick={() => moveQueue(appt.id, 'DOWN')}
                              disabled={updating === appt.id || idx === allBooked.length - 1}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:hover:bg-slate-800 shadow-sm" title="Move Down">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center">
                      <p className="text-slate-400 font-medium">No patients found</p>
                      <p className="text-slate-500 text-xs mt-1">There are no appointments matching your current view.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vitals Modal */}
      <VitalsModal open={!!vitalsFor} appt={vitalsFor}
        onClose={() => setVitalsFor(null)} onSuccess={() => { setVitalsFor(null); onRefresh(true); }} />

      {/* Reschedule Modal */}
      <RescheduleModal open={!!reschedFor} appt={reschedFor}
        onClose={() => setReschedFor(null)} onSuccess={() => { setReschedFor(null); onRefresh(true); }} />

      {/* Patient loading overlay */}
      {fetchingPt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 flex flex-col items-center gap-4 shadow-2xl">
            <svg className="animate-spin w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white font-bold tracking-wide">Loading patient record...</p>
          </div>
        </div>
      )}

      {/* Patient info modal */}
      {patientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setPatientModal(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/5 bg-slate-800/50 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xl shadow-inner">
                  {patientModal.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-white text-xl">{patientModal.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-400 mt-1">
                    {patientModal.age && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>{patientModal.age} yrs</span>}
                    {patientModal.gender && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{patientModal.gender}</span>}
                    {patientModal.contact && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{patientModal.contact}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setPatientModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Medical History', val: patientModal.medical_history, icon: '📋' },
                  { label: 'Allergies',       val: patientModal.allergies,       icon: '⚠️' },
                ].map(({ label, val, icon }) => (
                  <div key={label} className="rounded-2xl border border-white/5 bg-slate-800/40 p-4 shadow-inner">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"><span>{icon}</span> {label}</p>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">{val || 'None recorded'}</p>
                  </div>
                ))}
                <div className="sm:col-span-2 rounded-2xl border border-white/5 bg-slate-800/40 p-4 shadow-inner">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"><span>💊</span> Current Medication</p>
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">{patientModal.current_medication || 'None'}</p>
                </div>
              </div>
              
              {patientModal.recent_appointments?.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-3 border-b border-white/10 pb-2">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Recent Visits
                  </h4>
                  <div className="space-y-2">
                    {patientModal.recent_appointments.slice(0, 5).map((v, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/30 px-4 py-3 hover:bg-slate-800/60 transition">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                          <span className="text-sm font-semibold text-slate-300">{v.date}</span>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm ${STATUS_STYLES[v.status] || 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
