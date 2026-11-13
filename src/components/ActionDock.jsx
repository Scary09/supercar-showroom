import React from 'react';

const PRESETS = [
  { id: 'hero', label: 'Hero' },
  { id: 'profile', label: 'Profile' },
  { id: 'rear', label: 'Rear' },
  { id: 'interior', label: 'Interior' }
];

export default function ActionDock({ cameraPreset, onSelectPreset }) {
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-25 flex items-center gap-1.5 bg-black/60 backdrop-blur-xl px-3.5 py-2 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelectPreset(preset.id)}
          className={`px-4 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all ${
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