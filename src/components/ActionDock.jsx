import React from 'react';

export default function ActionDock({ partsState, onTogglePart, isCockpitView, onToggleCockpit }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
      <button
        onClick={() => onTogglePart('doors')}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
          partsState.doors ? 'bg-sky-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
        }`}
      >
        {partsState.doors ? 'Close Doors' : 'Open Doors'}
      </button>

      <button
        onClick={() => onTogglePart('hood')}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
          partsState.hood ? 'bg-amber-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
        }`}
      >
        {partsState.hood ? 'Close Hood' : 'Open Hood'}
      </button>

      <button
        onClick={() => onTogglePart('spoiler')}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
          partsState.spoiler ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
        }`}
      >
        {partsState.spoiler ? 'Aero: Race' : 'Deploy Aero'}
      </button>

      <div className="h-4 w-px bg-slate-800 mx-1"></div>

      <button
        onClick={onToggleCockpit}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
          isCockpitView ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
        }`}
      >
        {isCockpitView ? 'Exterior Orbit' : "Driver's Seat"}
      </button>
    </div>
  );
}
