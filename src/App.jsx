import React, { useState, useEffect } from 'react';
import CanvasScene from './components/CanvasScene';
import ActionDock from './components/ActionDock';
import CarDrawer from './components/CarDrawer';
import HotspotOverlay from './components/HotspotOverlay';

export default function App() {
  const [cars, setCars] = useState([]);
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [partsState, setPartsState] = useState({ doors: false, hood: false, spoiler: false });
  const [isCockpitView, setIsCockpitView] = useState(false);
  const [projectedHotspots, setProjectedHotspots] = useState([]);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetch('/data/cars.json')
      .then((res) => res.json())
      .then((data) => {
        setCars(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const currentCar = cars[currentCarIndex];

  const handleNextCar = () => {
    if (cars.length === 0) return;
    setCurrentCarIndex((prev) => (prev + 1) % cars.length);
    resetControls();
  };

  const handlePrevCar = () => {
    if (cars.length === 0) return;
    setCurrentCarIndex((prev) => (prev - 1 + cars.length) % cars.length);
    resetControls();
  };

  const resetControls = () => {
    setPartsState({ doors: false, hood: false, spoiler: false });
    setIsCockpitView(false);
    setActiveHotspot(null);
  };

  const handleTogglePart = (part) => {
    setPartsState((prev) => ({ ...prev, [part]: !prev[part] }));
  };

  const handleSelectHotspot = (h) => {
    setActiveHotspot(h);
    if (!h) return;
    if (h.id === 'engine') setPartsState((prev) => ({ ...prev, hood: true }));
    if (h.id === 'cockpit') setPartsState((prev) => ({ ...prev, doors: true }));
    if (h.id === 'spoiler') setPartsState((prev) => ({ ...prev, spoiler: true }));
  };

  if (!currentCar) {
    return (
      <div className="w-screen h-screen bg-[#06080d] flex items-center justify-center text-slate-400 font-mono text-sm">
        Initializing Showroom Inventory...
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#06080d] select-none text-slate-100">
      <header className="fixed top-6 left-6 z-20 pointer-events-none">
        <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
          {currentCar.brand} • {currentCar.year}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{currentCar.name}</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{currentCar.subtitle}</p>

        <div className="flex gap-4 mt-3 bg-black/40 backdrop-blur-md p-2.5 rounded-xl border border-white/5 w-fit">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase">Output</span>
            <span className="text-xs font-bold text-white">{currentCar.specs.hp}</span>
          </div>
          <div className="w-px h-6 bg-slate-800 my-auto"></div>
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase">0–60 MPH</span>
            <span className="text-xs font-bold text-white">{currentCar.specs.zeroSixty}</span>
          </div>
          <div className="w-px h-6 bg-slate-800 my-auto"></div>
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase">V-Max</span>
            <span className="text-xs font-bold text-white">{currentCar.specs.speed}</span>
          </div>
        </div>
      </header>

      <div className="fixed top-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={handlePrevCar}
          className="w-10 h-10 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center text-white hover:bg-slate-900 transition-all shadow-lg active:scale-95"
        >
          &#8592;
        </button>
        <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 text-xs font-mono text-slate-300">
          {currentCarIndex + 1} / {cars.length}
        </div>
        <button
          onClick={handleNextCar}
          className="w-10 h-10 rounded-full bg-slate-950/80 border border-white/10 flex items-center justify-center text-white hover:bg-slate-900 transition-all shadow-lg active:scale-95"
        >
          &#8594;
        </button>
      </div>

      <CanvasScene
        currentCar={currentCar}
        partsState={partsState}
        isCockpitView={isCockpitView}
        onHotspotsProjected={setProjectedHotspots}
      />

      <HotspotOverlay
        hotspots={projectedHotspots}
        activeHotspot={activeHotspot}
        onSelectHotspot={handleSelectHotspot}
      />

      <CarDrawer
        cars={cars}
        currentCar={currentCar}
        onSelectCar={(car) => {
          const idx = cars.findIndex((c) => c.id === car.id);
          if (idx !== -1) {
            setCurrentCarIndex(idx);
            resetControls();
          }
        }}
        isOpen={isDrawerOpen}
        onToggleOpen={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      <ActionDock
        partsState={partsState}
        onTogglePart={handleTogglePart}
        isCockpitView={isCockpitView}
        onToggleCockpit={() => setIsCockpitView(!isCockpitView)}
      />
    </main>
  );
}
