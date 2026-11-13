import React from 'react';

export default function HotspotOverlay({ hotspots, activeHotspot, onSelectHotspot }) {
  if (!hotspots || hotspots.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
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
              aria-label={h.label}
              className="group relative w-7 h-7 flex items-center justify-center"
            >
              <span
                className={`absolute w-full h-full rounded-full transition-all duration-500 ${
                  isActive
                    ? 'bg-white/25 scale-125'
                    : 'bg-white/10 group-hover:bg-white/20 animate-ping'
                }`}
              />
              <span
                className={`relative w-2.5 h-2.5 rounded-full border transition-all ${
                  isActive
                    ? 'bg-white border-white scale-110'
                    : 'bg-black/80 border-white/80 group-hover:bg-white'
                }`}
              />
            </button>

            {isActive && (
              <div className="absolute left-9 -top-4 bg-black/80 border border-white/15 backdrop-blur-2xl p-3.5 rounded-xl shadow-2xl w-56 text-left pointer-events-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-neutral-400 font-mono uppercase tracking-[0.2em]">
                    Specification
                  </span>
                  <button
                    onClick={() => onSelectHotspot(null)}
                    className="text-[10px] font-mono text-neutral-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <h5 className="text-xs font-medium text-white mt-1">{h.label}</h5>
                <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed font-light">
                  {h.detail}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}