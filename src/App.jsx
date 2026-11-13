import React, { useEffect, useState, useCallback, useMemo } from 'react';
import CanvasScene from './components/CanvasScene.jsx';
import ActionDock from './components/ActionDock.jsx';
import CarDrawer from './components/CarDrawer.jsx';
import HotspotOverlay from './components/HotspotOverlay.jsx';

export default function App() {
  const [cars, setCars] = useState([]);
  const [currentCar, setCurrentCar] = useState(null);
  const [projectedHotspots, setProjectedHotspots] = useState([]);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('hero');
  const [graphicsQuality, setGraphicsQuality] = useState('ultra'); // 'ultra' or 'performance'
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetch('/data/cars.json')
      .then((res) => res.json())
      .then((data) => {
        setCars(data);
        if (data.length > 0) setCurrentCar(data[0]);
      })
      .catch((err) => console.error('Failed to load cars.json:', err));
  }, []);

  const handleSelectCar = useCallback((car) => {
    setIsLoading(true);
    setActiveHotspot(null);
    setCameraPreset('hero');
    setCurrentCar(car);
  }, []);

  const handleModelLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSelectPreset = useCallback((preset) => {
    setActiveHotspot(null);
    setIsAutoRotate(false);
    setCameraPreset(preset);
  }, []);

  const handleSelectHotspot = useCallback((hotspot) => {
    setActiveHotspot(hotspot);
    if (hotspot) {
      setIsAutoRotate(false);
    }
  }, []);

  // Memoize CanvasScene so changing quality state doesn't trigger unmount/remount
  const memoizedCanvas = useMemo(() => {
    return (
      <CanvasScene
        currentCar={currentCar}
        cameraPreset={cameraPreset}
        activeHotspot={activeHotspot}
        graphicsQuality={graphicsQuality}
        isAutoRotate={isAutoRotate}
        onHotspotsProjected={setProjectedHotspots}
        onModelLoaded={handleModelLoaded}
        onUserInteract={() => setIsAutoRotate(false)}
      />
    );
  }, [currentCar, cameraPreset, activeHotspot, graphicsQuality, isAutoRotate]);

  return (
    <div className="relative w-screen h-screen bg-[#050608] text-neutral-100 overflow-hidden select-none">
      {memoizedCanvas}

      {showHotspots && cameraPreset !== 'interior' && (
        <HotspotOverlay
          hotspots={projectedHotspots}
          activeHotspot={activeHotspot}
          onSelectHotspot={handleSelectHotspot}
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-20 px-6 md:px-10 py-6 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <span>Atelier Virtual Showroom</span>
          </div>
          {currentCar && (
            <div className="mt-3">
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                {currentCar.brand} — {currentCar.year}
              </div>
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white mt-0.5">
                {currentCar.name}
              </h1>
              <p className="hidden md:block text-xs text-neutral-400 font-light max-w-sm mt-2.5 leading-relaxed">
                {currentCar.description}
              </p>
            </div>
          )}
        </div>

        {currentCar && (
          <div className="pointer-events-auto flex flex-col items-end gap-4">
            <div className="grid grid-cols-3 gap-6 bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-3.5 rounded-2xl">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Output</div>
                <div className="text-sm md:text-base font-medium text-white mt-0.5">{currentCar.specs.hp}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">0–100 km/h</div>
                <div className="text-sm md:text-base font-medium text-white mt-0.5">{currentCar.specs.zeroSixty}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">V-Max</div>
                <div className="text-sm md:text-base font-medium text-white mt-0.5">{currentCar.specs.topSpeed}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setGraphicsQuality((q) => (q === 'ultra' ? 'performance' : 'ultra'))}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider border border-white/10 bg-black/40 text-neutral-300 hover:text-white backdrop-blur-md transition-all"
              >
                Quality: <span className="text-white font-medium">{graphicsQuality}</span>
              </button>
              <button
                onClick={() => setShowHotspots((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all backdrop-blur-md ${
                  showHotspots
                    ? 'bg-white/10 border-white/25 text-white'
                    : 'bg-black/40 border-white/10 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Pins {showHotspots ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => setIsAutoRotate((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all backdrop-blur-md ${
                  isAutoRotate
                    ? 'bg-white text-black border-white'
                    : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                Orbit {isAutoRotate ? 'Auto' : 'Manual'}
              </button>
            </div>
          </div>
        )}
      </header>

      {isLoading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#050608]/80 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              Loading Studio Asset
            </span>
          </div>
        </div>
      )}

      <CarDrawer
        cars={cars}
        currentCar={currentCar}
        onSelectCar={handleSelectCar}
        isOpen={isDrawerOpen}
        onToggleOpen={() => setIsDrawerOpen((v) => !v)}
      />

      <ActionDock cameraPreset={cameraPreset} onSelectPreset={handleSelectPreset} />
    </div>
  );
}