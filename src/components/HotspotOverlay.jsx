import React from 'react';

export default function HotspotOverlay({ hotspots, activeHotspot, onSelectHotspot }) {
  if (!hotspots || hotspots.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <svg className="w-full h-full">
        {hotspots.map((h) => {
          if (!h.visible) return null;
          const isActive = activeHotspot?.id === h.id;
          return (
            isActive && (
              <line
                key={`line-${h.id}`}
                x1={h.x}
                y1={h.y}
                x2={h.x + 45}
                y2={h.y - 35}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )
          );
        })}
      </svg>

      {hotspots.map((h) => {
        if (!h.visible) return null;
        const isActive = activeHotspot?.id === h.id;
        return (
          <div
            key={h.id}
            style={{ left: `${h.x}px`, top: `${h.y}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
          >
            <button
              onClick={() => onSelectHotspot(isActive ? null : h)}
              className="relative w-6 h-6 flex items-center justify-center"
            >
              <span className="absolute w-full h-full rounded-full bg-emerald-400/25 animate-ping"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md"></span>
            </button>

            {isActive && (
              <div className="absolute left-12 -top-10 bg-slate-950/90 border border-emerald-500/40 backdrop-blur-md p-3 rounded-xl shadow-2xl w-52 text-left pointer-events-auto">
                <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block">Component Info</span>
                <h5 className="text-xs font-bold text-white mt-0.5">{h.label}</h5>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{h.detail}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
