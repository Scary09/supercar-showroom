import React, { useEffect, useState, useCallback, useMemo } from 'react';
import CanvasScene from './components/CanvasScene.jsx';
import ActionDock from './components/ActionDock.jsx';
import CarDrawer from './components/CarDrawer.jsx';
import HotspotOverlay from './components/HotspotOverlay.jsx';
import LandingMenu from './components/LandingMenu.jsx';
import CursorTrail from './components/CursorTrail.jsx';
import Loader from './components/Loader.jsx';

export const THEMES = {
  violet: { name: 'Violet', primary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.35)', rgb: [0.30, 0.22, 0.52], lightRgb: [1.0, 0.96, 1.05] },
  cyan: { name: 'Cyan', primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)', rgb: [0.16, 0.36, 0.52], lightRgb: [0.92, 1.0, 1.08] },
  emerald: { name: 'Emerald', primary: '#34d399', glow: 'rgba(52, 211, 153, 0.35)', rgb: [0.16, 0.42, 0.30], lightRgb: [0.94, 1.05, 0.96] },
  amber: { name: 'Champagne', primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.35)', rgb: [0.46, 0.35, 0.16], lightRgb: [1.08, 1.0, 0.88] },
  ruby: { name: 'Crimson', primary: '#fb7185', glow: 'rgba(251, 113, 133, 0.35)', rgb: [0.48, 0.18, 0.26], lightRgb: [1.08, 0.92, 0.94] }
};

export default function App() {
  const [cars, setCars] = useState([]);
  const [currentCar, setCurrentCar] = useState(null);
  const [isInitialBoot, setIsInitialBoot] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [isExitingLanding, setIsExitingLanding] = useState(false);
  const [projectedHotspots, setProjectedHotspots] = useState([]);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('hero');
  const [graphicsQuality, setGraphicsQuality] = useState('ultra');
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentThemeKey, setCurrentThemeKey] = useState('violet');

  const currentTheme = THEMES[currentThemeKey];

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cars.json`)
      .then((res) => res.json())
      .then((data) => {
        setCars(data);
        if (data.length > 0) setCurrentCar(data[0]);
      })
      .catch((err) => console.error('Failed to load cars.json:', err))
      .finally(() => {
        setTimeout(() => setIsInitialBoot(false), 600);
      });
  }, []);

  const handleEnterShowroom = useCallback(
    (selectedCar) => {
      if (selectedCar && selectedCar.id !== currentCar?.id) {
        setLoadProgress(5);
        setIsLoading(true);
        setCurrentCar(selectedCar);
      }
      setActiveHotspot(null);
      setCameraPreset('hero');
      setIsExitingLanding(true);
      setTimeout(() => {
        setShowLanding(false);
        setIsExitingLanding(false);
      }, 650);
    },
    [currentCar]
  );

  const handleBackToMenu = useCallback(() => {
    setActiveHotspot(null);
    setIsAutoRotate(false);
    setShowLanding(true);
  }, []);

  const handleSelectCar = useCallback(
    (car) => {
      if (car.id === currentCar?.id) return;
      setLoadProgress(5);
      setIsLoading(true);
      setActiveHotspot(null);
      setCameraPreset('hero');
      setCurrentCar(car);
    },
    [currentCar]
  );

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

  const memoizedCanvas = useMemo(() => {
    return (
      <CanvasScene
        currentCar={currentCar}
        cameraPreset={cameraPreset}
        activeHotspot={activeHotspot}
        graphicsQuality={graphicsQuality}
        isAutoRotate={isAutoRotate}
        currentTheme={currentTheme}
        onHotspotsProjected={setProjectedHotspots}
        onModelLoaded={handleModelLoaded}
        onLoadProgress={setLoadProgress}
        onUserInteract={() => setIsAutoRotate(false)}
      />
    );
  }, [currentCar, cameraPreset, activeHotspot, graphicsQuality, isAutoRotate, currentTheme, handleModelLoaded]);

  const showLoaderOverlay = isInitialBoot || (isLoading && !showLanding);

  return (
    <div className="relative w-screen h-screen bg-[#07080c] text-neutral-100 overflow-hidden select-none font-['Inter',system-ui,sans-serif]">
      <CursorTrail />
      <Loader
        isLoading={showLoaderOverlay}
        progress={isInitialBoot ? 85 : loadProgress}
        currentTheme={currentTheme}
        label={isInitialBoot ? 'Initializing Atelier Vault' : `Loading ${currentCar?.name || 'Vehicle'}`}
      />

      {showLanding && (
        <LandingMenu
          cars={cars}
          currentTheme={currentTheme}
          onEnterShowroom={handleEnterShowroom}
          isExiting={isExitingLanding}
        />
      )}

      {memoizedCanvas}

      {showHotspots && cameraPreset !== 'interior' && !showLanding && (
        <HotspotOverlay
          hotspots={projectedHotspots}
          activeHotspot={activeHotspot}
          onSelectHotspot={handleSelectHotspot}
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-20 px-8 md:px-12 py-7 flex items-start justify-between pointer-events-none transition-opacity duration-300 ${
          !showHotspots && cameraPreset !== 'interior' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="pointer-events-auto">
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleBackToMenu}
              className="px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-200 hover:text-white backdrop-blur-md transition-all duration-300 shadow-lg hover:scale-[1.02]"
            >
              ← Volumes
            </button>
            <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.24em] text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: currentTheme.primary }} />
              <span>Atelier Virtual Showroom</span>
            </div>
          </div>

          {currentCar && (
            <div className="mt-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                {currentCar.brand} — {currentCar.year}
              </div>
              <h1 className="text-3xl md:text-5xl italic font-light tracking-tight text-white mt-1">
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
            <div className="grid grid-cols-3 gap-6 bg-black/60 backdrop-blur-2xl border border-white/15 px-6 py-4 rounded-3xl shadow-2xl">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Output</div>
                <div className="text-sm md:text-base font-medium text-white mt-0.5">{currentCar.specs.hp}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">0–100 km/h</div>
                <div className="text-sm md:text-base font-medium text-white mt-0.5">{currentCar.specs.zeroSixty}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">V-Max</div>
                <div className="text-sm md:text-base font-medium text-white mt-0.5">{currentCar.specs.topSpeed}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-2xl border border-white/15 px-3 py-2 rounded-full shadow-lg">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setCurrentThemeKey(key)}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      currentThemeKey === key ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t.primary }}
                    title={t.name}
                  />
                ))}
              </div>

              <button
                onClick={() => setGraphicsQuality((q) => (q === 'ultra' ? 'performance' : 'ultra'))}
                className="px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-wider border border-white/15 bg-black/50 text-neutral-200 hover:text-white backdrop-blur-xl transition-all duration-300 shadow-xl hover:scale-[1.02]"
              >
                Quality: <span className="text-white font-medium">{graphicsQuality}</span>
              </button>

              <button
                onClick={() => setShowHotspots((v) => !v)}
                className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all duration-300 backdrop-blur-xl shadow-xl hover:scale-[1.02] ${
                  showHotspots
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-black/90 text-white shadow-2xl ring-2'
                }`}
                style={{ borderColor: !showHotspots ? currentTheme.primary : undefined }}
              >
                Pins {showHotspots ? 'On' : 'Off'}
              </button>

              <button
                onClick={() => setIsAutoRotate((v) => !v)}
                className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all duration-300 backdrop-blur-xl shadow-xl hover:scale-[1.02] ${
                  isAutoRotate
                    ? 'bg-white text-black border-white shadow-2xl'
                    : 'bg-black/50 border-white/15 text-neutral-300 hover:text-white'
                }`}
              >
                Orbit {isAutoRotate ? 'Auto' : 'Manual'}
              </button>
            </div>
          </div>
        )}
      </header>

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
