import React from 'react';
import QueueStatus    from './QueueStatus';
import CalendarWidget from './CalendarWidget';
import Notifications  from './Notifications';

export default function RightPanel({ appointments }) {
  return (
    <div className="space-y-4">
      {/* 1. Live Queue */}
      <QueueStatus appointments={appointments} />

      {/* 2. Mini Calendar */}
      <CalendarWidget appointments={appointments} />

      {/* 3. Reminders */}
      <Notifications appointments={appointments} />
    </div>
  );
}
