import React, { useState } from 'react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function CalendarWidget({ appointments }) {
  const now    = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const bookedDates = new Set(
    appointments
      .filter(a => !['CANCELLED', 'NO_SHOW'].includes(a.status))
      .map(a => a.date)
  );

  // First day of month + number of days
  const firstDay  = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();

  const todayStr = now.toISOString().slice(0, 10);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition text-sm"
        >
          ‹
        </button>
        <h3 className="text-sm font-bold text-white">
          {MONTHS[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition text-sm"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday  = dateStr === todayStr;
          const isBooked = bookedDates.has(dateStr);

          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                isToday
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
                {day}
                {isBooked && !isToday && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-cyan-400" />
                )}
                {isBooked && isToday && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
          <span className="text-[10px] text-slate-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-slate-500">Appointment</span>
        </div>
      </div>
    </div>
  );
}
