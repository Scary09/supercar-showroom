import React from 'react';

export default function CarDrawer({ cars, currentCar, onSelectCar, isOpen, onToggleOpen }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
      <button
        onClick={onToggleOpen}
        className="text-xs bg-slate-950/90 hover:bg-slate-900 border border-white/10 px-4 py-1.5 rounded-full text-slate-300 shadow-lg mb-2"
      >
        {isOpen ? '✕ Close Showroom' : '▲ Showroom Inventory'}
      </button>

      {isOpen && (
        <div className="bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-3 max-w-4xl overflow-x-auto">
          {cars.map((car) => (
            <button
              key={car.id}
              onClick={() => {
                onSelectCar(car);
                onToggleOpen();
              }}
              className={`p-3 rounded-xl border text-left transition-all w-52 flex-shrink-0 ${
                currentCar.id === car.id
                  ? 'border-emerald-500/80 bg-emerald-500/10'
                  : 'border-white/5 bg-black/40 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase">
                <span>{car.brand}</span>
                <span>{car.year}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 leading-tight">{car.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{car.specs.hp} • {car.specs.zeroSixty}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
