import React, { useState, useEffect } from 'react';

const TIPS = [
  "Drink enough water 💧",
  "Stay active 🚶",
  "Eat healthy 🥗",
  "Get enough sleep 😴",
  "Take deep breaths 🌬️",
  "Stretch regularly 🧘‍♀️"
];

export default function SunnyLoader() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 2500); // Rotate tip every 2.5 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 via-yellow-50 to-sky-100">
      
      {/* Subtle floating background elements (optional clouds/sunrays effect) */}
      <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-orange-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-sky-200/40 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative flex flex-col items-center justify-center p-8 text-center">
        
        {/* Animated Sun */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse" />
          <div className="relative text-7xl drop-shadow-xl transform transition-transform duration-1000 hover:scale-110 animate-[spin_10s_linear_infinite]">
            ☀️
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-black text-orange-600 mb-2 tracking-tight drop-shadow-sm">
          Good health is loading...
        </h1>
        <p className="text-sm sm:text-base font-medium text-slate-500 mb-8 max-w-xs">
          Preparing your wellness dashboard
        </p>

        {/* Rotating Tips */}
        <div className="h-10 flex items-center justify-center overflow-hidden">
          <p 
            key={tipIndex}
            className="text-sm sm:text-base font-bold text-sky-600 transition-opacity duration-500"
          >
            {TIPS[tipIndex]}
          </p>
        </div>

      </div>
    </div>
  );
}
