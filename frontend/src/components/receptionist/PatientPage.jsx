import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const STATUS_STYLES = {
  BOOKED:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ARRIVED:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
  NO_SHOW:   'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

export default function PatientPage() {
  const [patients,  setPatients]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);   // patient detail
  const [fetching,  setFetching]  = useState(false);

  useEffect(() => {
    API.get('patients/')
      .then(r => setPatients(r.data || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return !q
      || p.name?.toLowerCase().includes(q)
      || p.contact?.toLowerCase().includes(q);
  });

  const fetchDetails = async (id) => {
    setFetching(true);
    try {
      const r = await API.get(`patient/${id}/details/`);
      setSelected(r.data);
    } catch { alert('Failed to load patient details.'); }
    finally { setFetching(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">Patients</h1>
        <p className="text-slate-400 text-xs mt-0.5">Search and view patient details</p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        placeholder="Search by name or phone number…"
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
      />

      {/* Patient list */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-md">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-slate-400 text-sm">{search ? 'No patients match your search.' : 'No patients registered yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/60">
                  {['Patient', 'Contact', 'Gender', 'Blood Group', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-black">
                          {p.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <span className="font-semibold text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{p.contact || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{p.gender || '—'}</td>
                    <td className="px-4 py-3">
                      {p.blood_group ? (
                        <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-xs font-bold text-red-300">
                          {p.blood_group}
                        </span>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchDetails(p.id)}
                        className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fetching overlay */}
      {fetching && (
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

      {/* Patient detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="font-black text-white text-lg">{selected.name}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                  {selected.age       && <span>🎂 {selected.age} yrs</span>}
                  {selected.gender    && <span>· {selected.gender}</span>}
                  {selected.blood_group && (
                    <span className="rounded bg-red-500/20 text-red-300 px-1.5 py-0.5 font-bold border border-red-500/20">
                      🩸 {selected.blood_group}
                    </span>
                  )}
                  {selected.contact   && <span>📞 {selected.contact}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {/* Medical info */}
              {[
                { label: 'Medical History',    val: selected.medical_history },
                { label: 'Allergies',          val: selected.allergies },
                { label: 'Current Medication', val: selected.current_medication },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
                  <p className="text-slate-300">{val || 'None provided'}</p>
                </div>
              ))}

              {/* Lab Reports */}
              {selected.lab_reports?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">🧪 Lab Reports</p>
                  <div className="space-y-1.5">
                    {selected.lab_reports.map((r, i) => (
                      <a key={i} href={r.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10 transition">
                        <span className="text-slate-300 font-medium">{r.title}</span>
                        <span className="text-xs text-cyan-400">Open ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Visit history */}
              {selected.recent_appointments?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">🕐 Visit History</p>
                  <div className="space-y-1.5">
                    {selected.recent_appointments.map((v, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                        <span className="text-slate-300">{v.date}</span>
                        <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${STATUS_STYLES[v.status] || 'bg-slate-700 text-slate-300'}`}>
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
