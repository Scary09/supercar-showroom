import React from 'react';

export default function CarDrawer({ cars, currentCar, onSelectCar, isOpen, onToggleOpen }) {
  if (!cars || cars.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
      {isOpen && (
        <div className="mb-3 bg-black/75 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl flex gap-2.5 max-w-[92vw] overflow-x-auto">
          {cars.map((car) => {
            const isSelected = currentCar?.id === car.id;
            return (
              <button
                key={car.id}
                onClick={() => {
                  onSelectCar(car);
                  onToggleOpen();
                }}
                className={`px-4 py-3 rounded-xl border text-left transition-all w-48 flex-shrink-0 ${
                  isSelected
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  <span>{car.brand}</span>
                  <span>{car.year}</span>
                </div>
                <div className="text-sm font-medium text-white mt-1 truncate">{car.name}</div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">
                  {car.specs.hp} · {car.specs.zeroSixty}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onToggleOpen}
        className="text-[11px] font-mono uppercase tracking-[0.18em] bg-black/50 hover:bg-black/80 backdrop-blur-xl border border-white/10 hover:border-white/25 px-4 py-1.5 rounded-full text-neutral-300 transition-all"
      >
        {isOpen ? 'Close Collection' : `Collection (${cars.length})`}
      </button>
    </div>
  );
}