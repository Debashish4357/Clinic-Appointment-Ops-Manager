import React from 'react';

function NotifItem({ icon, title, desc, tag, tagColor }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-800/40 px-3 py-2.5 hover:bg-slate-800/60 transition">
      <div className="mt-0.5 text-lg shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
      </div>
      {tag && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${tagColor}`}>
          {tag}
        </span>
      )}
    </div>
  );
}

export default function Notifications({ appointments }) {
  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // Dynamic reminders based on real appointments
  const items = [];

  // Upcoming today
  appointments
    .filter(a => a.date === today && ['BOOKED', 'ARRIVED'].includes(a.status))
    .forEach(a => {
      items.push({
        icon: '🏥',
        title: `Appointment today at ${a.time?.slice(0, 5)}`,
        desc: `with ${a.doctor_name || 'your doctor'} · Token #${a.token_number}`,
        tag: 'Today',
        tagColor: 'bg-amber-500/20 text-amber-300',
      });
    });

  // Tomorrow appointments
  appointments
    .filter(a => a.date === tomorrow && a.status === 'BOOKED')
    .forEach(a => {
      items.push({
        icon: '📅',
        title: `Follow-up tomorrow at ${a.time?.slice(0, 5)}`,
        desc: `with ${a.doctor_name || 'your doctor'}`,
        tag: 'Tomorrow',
        tagColor: 'bg-blue-500/20 text-blue-300',
      });
    });

  // Prescriptions reminder (if any recent completed with meds)
  const recentRx = appointments
    .filter(a => a.status === 'COMPLETED' && Array.isArray(a.prescription) && a.prescription.length > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (recentRx) {
    items.push({
      icon: '💊',
      title: 'Take your medicines',
      desc: `${recentRx.prescription.length} medication(s) from ${recentRx.date}`,
      tag: 'Reminder',
      tagColor: 'bg-emerald-500/20 text-emerald-300',
    });
  }

  // Generic health tip if nothing else
  if (items.length === 0) {
    items.push({
      icon: '💧',
      title: 'Stay hydrated',
      desc: 'Drink at least 8 glasses of water today',
      tag: 'Tip',
      tagColor: 'bg-cyan-500/20 text-cyan-300',
    });
    items.push({
      icon: '🚶',
      title: 'Stay active',
      desc: 'A 30-minute walk improves cardiovascular health',
      tag: 'Tip',
      tagColor: 'bg-purple-500/20 text-purple-300',
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
          🔔 Reminders
        </h3>
        {items.length > 0 && (
          <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {items.length}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <NotifItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
