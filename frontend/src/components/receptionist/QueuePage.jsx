import React, { useState } from 'react';
import API from '../../services/api';
import { VitalsModal, RescheduleModal } from './Modals';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

const FILTER_TABS = ['All', 'BOOKED', 'ARRIVED', 'COMPLETED', 'CANCELLED'];

function QueueBanner({ appointments }) {
  const serving  = appointments.find(a => a.status === 'ARRIVED');
  const pending  = appointments.filter(a => a.status === 'BOOKED');
  const nextUp   = pending[0];

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400/70">Now Serving</p>
        <p className="mt-1 text-3xl font-black text-amber-300">
          {serving ? `#${serving.token_number}` : '—'}
        </p>
        {serving && <p className="text-xs text-amber-400/60 mt-0.5 truncate">{serving.patient_name}</p>}
      </div>
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-400/70">Next</p>
        <p className="mt-1 text-3xl font-black text-cyan-300">
          {nextUp ? `#${nextUp.token_number}` : '—'}
        </p>
        {nextUp && <p className="text-xs text-cyan-400/60 mt-0.5 truncate">{nextUp.patient_name}</p>}
      </div>
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Waiting</p>
        <p className="mt-1 text-3xl font-black text-white">{pending.length}</p>
        <p className="text-xs text-slate-500 mt-0.5">in queue</p>
      </div>
    </div>
  );
}

function ActionBtn({ label, color, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
    >
      {label}
    </button>
  );
}

export default function QueuePage({ appointments, onRefresh, onBooking, onWalkIn }) {
  const [filter,    setFilter]    = useState('All');
  const [search,    setSearch]    = useState('');
  const [updating,  setUpdating]  = useState(null);
  const [vitalsFor, setVitalsFor] = useState(null);
  const [reschedFor, setReschedFor] = useState(null);
  const [patientModal, setPatientModal] = useState(null);
  const [fetchingPt, setFetchingPt] = useState(false);

  /* ── actions ───────────────────────────────────────────────────── */
  const updateStatus = async (id, status) => {
    setUpdating(id);
    try { await API.patch(`appointments/${id}/`, { status }); onRefresh(); }
    catch (err) { alert(err?.response?.data?.message || 'Action failed.'); }
    finally { setUpdating(null); }
  };

  const moveQueue = async (id, action) => {
    setUpdating(id);
    try { await API.patch(`appointments/${id}/move/`, { action }); onRefresh(); }
    catch (err) { alert(err?.response?.data?.message || 'Move failed.'); }
    finally { setUpdating(null); }
  };

  const adjustWait = async (id, change) => {
    setUpdating(id);
    try { await API.patch(`appointments/${id}/wait-time/`, { change }); onRefresh(); }
    catch { alert('Failed to update wait time.'); }
    finally { setUpdating(null); }
  };

  const fetchPatient = async (patientId) => {
    setFetchingPt(true);
    try { const r = await API.get(`patient/${patientId}/details/`); setPatientModal(r.data); }
    catch { alert('Failed to load patient.'); }
    finally { setFetchingPt(false); }
  };

  /* ── filtering ─────────────────────────────────────────────────── */
  const filtered = appointments.filter(a => {
    const matchStatus = filter === 'All' || a.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.patient_name?.toLowerCase().includes(q) || a.contact?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const todayOnly = filtered.filter(a => {
    const today = new Date().toISOString().slice(0, 10);
    return a.date === today;
  });

  return (
    <div className="space-y-5">
      {/* Header + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Queue Management</h1>
          <p className="text-slate-400 text-xs mt-0.5">Today's appointment queue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onWalkIn}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 hover:bg-amber-500/20 transition">
            <span>+</span> Walk-in
          </button>
          <button onClick={onBooking}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 transition shadow-md">
            <span>+</span> Book Appointment
          </button>
          <button onClick={onRefresh}
            className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Queue banner */}
      <QueueBanner appointments={appointments} />

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" value={search} placeholder="Search by name or phone…"
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <div className="flex gap-1 rounded-xl border border-white/10 bg-slate-800 p-1">
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === tab ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Queue table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-md">
        {todayOnly.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/60">
                  {['Token', 'Patient', 'Doctor', 'Time', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayOnly.map((appt, idx) => (
                  <tr key={appt.id} className="hover:bg-white/5 transition-colors">
                    {/* Token */}
                    <td className="px-4 py-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-xs font-black text-amber-300">
                        {appt.token_number}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-white">{appt.patient_name}</p>
                          {appt.reason && <p className="text-xs text-slate-500 italic truncate max-w-[150px]">"{appt.reason}"</p>}
                        </div>
                        <button onClick={() => fetchPatient(appt.patient_id)}
                          className="text-slate-500 hover:text-cyan-400 transition text-sm" title="View details">
                          👁
                        </button>
                        {(appt.bp || appt.heart_rate) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/15 text-teal-300 rounded border border-teal-500/20">
                            ✓ Vitals
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{appt.doctor_name}</td>

                    {/* Time + wait */}
                    <td className="px-4 py-3">
                      <p className="text-slate-300 whitespace-nowrap">{appt.time}</p>
                      {(appt.status === 'BOOKED' || appt.status === 'ARRIVED') && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-slate-500">~{appt.estimated_wait_time}m</span>
                          <button onClick={() => adjustWait(appt.id, -5)} disabled={updating === appt.id}
                            className="text-red-400/60 hover:text-red-400 text-xs disabled:opacity-30">−</button>
                          <button onClick={() => adjustWait(appt.id, 5)} disabled={updating === appt.id}
                            className="text-emerald-400/60 hover:text-emerald-400 text-xs disabled:opacity-30">+</button>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[appt.status] || 'bg-slate-700 text-slate-300'}`}>
                        {appt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {appt.status === 'BOOKED' && (
                          <>
                            <ActionBtn label="Arrived" disabled={updating === appt.id}
                              color="bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                              onClick={() => updateStatus(appt.id, 'ARRIVED')} />
                            <ActionBtn label="Vitals" disabled={updating === appt.id}
                              color="bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20"
                              onClick={() => setVitalsFor(appt)} />
                            <ActionBtn label="Reschedule" disabled={updating === appt.id}
                              color="bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20"
                              onClick={() => setReschedFor(appt)} />
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
                            <ActionBtn label="Complete" disabled={updating === appt.id}
                              color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                              onClick={() => updateStatus(appt.id, 'COMPLETED')} />
                            <ActionBtn label="Mark Paid" disabled={updating === appt.id}
                              color="bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                              onClick={() => updateStatus(appt.id, 'COMPLETED')} />
                          </>
                        )}
                        {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status) && (
                          <span className="text-xs text-slate-600 italic">—</span>
                        )}

                        {/* Queue move buttons */}
                        {appt.status === 'BOOKED' && (
                          <div className="flex gap-1 ml-1">
                            <button onClick={() => moveQueue(appt.id, 'UP')}
                              disabled={updating === appt.id || idx === 0}
                              className="h-6 w-6 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 text-xs disabled:opacity-30">
                              ↑
                            </button>
                            <button onClick={() => moveQueue(appt.id, 'DOWN')}
                              disabled={updating === appt.id || idx === todayOnly.length - 1}
                              className="h-6 w-6 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 text-xs disabled:opacity-30">
                              ↓
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">🏥</p>
            <p className="text-slate-400 text-sm">No appointments match the current filter.</p>
          </div>
        )}
      </div>

      {/* Vitals Modal */}
      <VitalsModal open={!!vitalsFor} appt={vitalsFor}
        onClose={() => setVitalsFor(null)} onSuccess={() => { setVitalsFor(null); onRefresh(); }} />

      {/* Reschedule Modal */}
      <RescheduleModal open={!!reschedFor} appt={reschedFor}
        onClose={() => setReschedFor(null)} onSuccess={() => { setReschedFor(null); onRefresh(); }} />

      {/* Patient loading overlay */}
      {fetchingPt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-slate-800 p-8 flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-300 text-sm">Loading patient…</p>
          </div>
        </div>
      )}

      {/* Patient info modal */}
      {patientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPatientModal(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="font-black text-white text-lg">{patientModal.name}</h3>
                <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                  {patientModal.age && <span>{patientModal.age} yrs</span>}
                  {patientModal.gender && <span>· {patientModal.gender}</span>}
                  {patientModal.blood_group && <span className="text-red-300">· 🩸 {patientModal.blood_group}</span>}
                  {patientModal.contact && <span>· 📞 {patientModal.contact}</span>}
                </div>
              </div>
              <button onClick={() => setPatientModal(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {[
                { label: 'Medical History',    val: patientModal.medical_history },
                { label: 'Allergies',          val: patientModal.allergies },
                { label: 'Current Medication', val: patientModal.current_medication },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
                  <p className="text-slate-300">{val || 'None provided'}</p>
                </div>
              ))}
              {patientModal.recent_appointments?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recent Visits</p>
                  <div className="space-y-2">
                    {patientModal.recent_appointments.map((v, i) => (
                      <div key={i} className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                        <span className="text-slate-300">{v.date}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[v.status] || 'bg-slate-700 text-slate-300'}`}>
                          {v.status}
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
