import React from 'react';

const PRESETS = [
  { id: 'hero', label: 'Hero' },
  { id: 'profile', label: 'Profile' },
  { id: 'rear', label: 'Rear' },
  { id: 'interior', label: 'Interior' }
];

export default function ActionDock({ cameraPreset, onSelectPreset }) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-25 flex flex-col items-end gap-2 bg-black/60 backdrop-blur-xl px-2.5 py-3.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-500 px-3 mb-1">
        Camera
      </div>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelectPreset(preset.id)}
          className={`w-28 text-left px-3.5 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-all ${
            cameraPreset === preset.id
              ? 'bg-white text-black font-medium shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}