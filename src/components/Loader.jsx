import React, { useEffect, useState } from 'react';

export default function Loader({ isLoading, progress = 0, currentTheme, label = 'Initializing Studio Asset' }) {
  const [displayPct, setDisplayPct] = useState(0);
  const [visible, setVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      setDisplayPct(100);
      const t = setTimeout(() => setVisible(false), 450);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => {
      setDisplayPct((prev) => {
        const target = progress > 0 ? progress : 88;
        if (prev >= target) return prev;
        const step = Math.max(1, Math.ceil((target - prev) * 0.18));
        return Math.min(target, prev + step);
      });
    }, 35);
    return () => clearInterval(id);
  }, [isLoading, progress]);

  if (!visible) return null;

  return (
    <div
      style={{
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="fixed inset-0 z-[70] bg-[#07080c] flex flex-col items-center justify-between p-8 md:p-12 select-none pointer-events-auto"
    >
      <div className="flex items-center w-full justify-between text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400">
        <span>System Telemetry</span>
        <span>Atelier Virtual Showroom</span>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-[clamp(64px,11vw,132px)] font-extralight tracking-tighter text-white font-mono leading-none">
          {displayPct}%
        </div>
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-neutral-400">
          {label}
        </div>
      </div>

      <div className="w-full max-w-xs h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-150 ease-out"
          style={{
            width: `${displayPct}%`,
            backgroundColor: currentTheme.primary,
            boxShadow: `0 0 12px ${currentTheme.primary}`
          }}
        />
      </div>
    </div>
  );
}