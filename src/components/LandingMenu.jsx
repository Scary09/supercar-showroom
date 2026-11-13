import React, { useState, useEffect, useRef } from 'react';

const BOOK_STYLES = [
  {
    kicker: 'Volume · I',
    subtitle: 'HY-KERS V12 Flagship',
    footer: 'Aero · Powertrain · Telemetry',
    x: '23.5%',
    y: '41%',
    w: 'min(29vw, 410px)',
    r: -8,
    yaw: -9,
    zIndex: 1,
    delay: 120
  },
  {
    kicker: 'Volume · II',
    subtitle: 'Twin-Turbo Hybrid',
    footer: 'MonoCage · DRS · Balance',
    x: '50%',
    y: '33%',
    w: 'min(31.5vw, 445px)',
    r: 0.6,
    yaw: -2,
    zIndex: 3,
    delay: 40
  },
  {
    kicker: 'Volume · III',
    subtitle: 'Plug-In Hybrid Spyder',
    footer: 'Weissach · Exhaust · Torque',
    x: '76.5%',
    y: '42%',
    w: 'min(29vw, 410px)',
    r: 8,
    yaw: 9,
    zIndex: 2,
    delay: 200
  }
];

export default function LandingMenu({ cars, currentTheme, onEnterShowroom, isExiting }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [openingIdx, setOpeningIdx] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const cardRefs = useRef([]);
  const hoveredIdxRef = useRef(null);
  hoveredIdxRef.current = hoveredIdx;

  useEffect(() => {
    const timer = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;

    const tick = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;

      if (heroRef.current) {
        heroRef.current.style.transform = `translate3d(calc(-50% + ${currentX * -24}px), ${currentY * -16}px, 0)`;
      }

      cardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const cfg = BOOK_STYLES[idx] || BOOK_STYLES[0];
        const depth = idx === 1 ? 1.15 : 0.7;
        const isHovered = hoveredIdxRef.current === idx;

        let localTiltX = 0;
        let localTiltY = 0;
        if (isHovered) {
          const rect = el.getBoundingClientRect();
          const relX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const relY = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
          localTiltY = Math.max(-1, Math.min(1, relX)) * 12;
          localTiltX = Math.max(-1, Math.min(1, relY)) * -8;
        }

        const tx = currentX * 26 * depth;
        const ty = currentY * 16 * depth + (isHovered ? -28 : 0);
        const rotZ = isHovered ? cfg.r * 0.35 : cfg.r;
        const rotY = (isHovered ? 0 : cfg.yaw) + localTiltY;

        el.style.transform = `translate3d(calc(-50% + ${tx}px), ${ty}px, 0) rotateZ(${rotZ}deg) rotateX(${localTiltX}deg) rotateY(${rotY}deg)`;
      });

      rafId = requestAnimationFrame(tick);
    };

    const onPointerMove = (e) => {
      clientX = e.clientX;
      clientY = e.clientY;
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  const handleSelectBook = (car, index) => {
    if (openingIdx !== null) return;
    setOpeningIdx(index);
    setTimeout(() => {
      onEnterShowroom(car);
    }, 320);
  };

  return (
    <div
      ref={stageRef}
      style={{
        fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, serif',
        background: `radial-gradient(circle at 50% 25%, ${currentTheme.glow}, transparent 55%), radial-gradient(circle at 80% 85%, rgba(255,255,255,0.04), transparent 45%), #07080c`
      }}
      className={`fixed inset-0 z-50 overflow-hidden text-neutral-100 select-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isExiting ? 'opacity-0 scale-105 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-0'
      }`}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />

      <header
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="fixed top-0 left-0 z-50 flex items-center justify-between w-full px-8 md:px-12 py-7 pointer-events-none"
      >
        <div className="flex items-center gap-3.5 pointer-events-auto">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: currentTheme.primary,
              boxShadow: `0 0 14px ${currentTheme.primary}`
            }}
          />
          <span className="text-xs font-mono uppercase tracking-[0.28em] text-neutral-300">
            Atelier Field Manuals
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close index' : 'Open index'}
          className="pointer-events-auto group flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-black/40 backdrop-blur-xl text-neutral-200 hover:text-white hover:border-white/35 transition-all duration-300 shadow-xl"
        >
          <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Index</span>
          <span className="relative w-3.5 h-2.5 block">
            <span
              className={`absolute left-0 w-3.5 h-[1.5px] rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'top-[4.5px] rotate-45' : 'top-[1px]'
              }`}
            />
            <span
              className={`absolute left-0 w-3.5 h-[1.5px] rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'top-[4.5px] -rotate-45' : 'top-[7px]'
              }`}
            />
          </span>
        </button>
      </header>

      <div
        ref={heroRef}
        className="absolute z-[1] top-[10vh] left-1/2 -translate-x-1/2 pointer-events-none will-change-transform"
      >
        <h1
          style={{
            opacity: entered ? 1 : 0,
            filter: entered ? 'blur(0px)' : 'blur(18px)',
            transform: entered ? 'scale(1)' : 'scale(0.92)',
            transition: 'opacity 1000ms cubic-bezier(0.16, 1, 0.3, 1), filter 1000ms ease, transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="m-0 text-[clamp(110px,18vw,270px)] italic font-light tracking-[-0.07em] leading-[0.82] whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-white/25 via-white/[0.08] to-transparent"
        >
          Hypercars
        </h1>
      </div>

      <section
        aria-label="Hypercar volumes"
        style={{ perspective: '1600px' }}
        className="absolute inset-0 z-[5]"
      >
        {cars.slice(0, 3).map((car, index) => {
          const cfg = BOOK_STYLES[index] || BOOK_STYLES[0];
          const isHovered = hoveredIdx === index;
          const isOpening = openingIdx === index;
          const isOtherDimmed = hoveredIdx !== null && !isHovered;

          return (
            <button
              key={car.id}
              ref={(el) => (cardRefs.current[index] = el)}
              type="button"
              onClick={() => handleSelectBook(car, index)}
              onPointerEnter={() => setHoveredIdx(index)}
              onPointerLeave={() => setHoveredIdx(null)}
              aria-label={`Inspect ${car.brand} ${car.name}`}
              style={{
                left: cfg.x,
                top: entered ? cfg.y : '70%',
                width: cfg.w,
                zIndex: isOpening ? 20 : isHovered ? 10 : cfg.zIndex,
                opacity: entered ? (isOtherDimmed ? 0.5 : 1) : 0,
                transformStyle: 'preserve-3d',
                transition: `top 950ms cubic-bezier(0.16, 1, 0.3, 1) ${cfg.delay}ms, opacity 500ms ease ${entered ? 0 : cfg.delay}ms`
              }}
              className="absolute aspect-[0.68/1] p-0 bg-transparent border-0 outline-none cursor-pointer will-change-transform group"
            >
              <span
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isOpening
                    ? 'scale(1.12)'
                    : isHovered
                    ? 'scale(1.04)'
                    : 'scale(1)',
                  transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="relative block w-full h-full"
              >
                <span
                  style={{
                    transform: 'translate3d(16px, 26px, -60px)',
                    filter: 'blur(26px)',
                    background: isHovered ? currentTheme.glow : 'rgba(0, 0, 0, 0.85)',
                    transition: 'background 450ms ease'
                  }}
                  className="absolute inset-[6%_-4%_-4%_4%] rounded-2xl -z-10"
                />

                <span
                  style={{ transform: 'translate3d(6px, 1px, -24px)' }}
                  className="absolute inset-0 rounded-[4px_10px_10px_4px] bg-[#0b0c12] border border-white/10"
                />

                <span
                  style={{
                    transform: 'translate3d(6px, 1px, -11px)',
                    background:
                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px), linear-gradient(90deg, #161822 0%, #262938 18%, #1c1e2b 88%, #10121a 100%)'
                  }}
                  className="absolute inset-[2%_1.6%_2%_4%] rounded-[2px_7px_7px_2px] border border-white/10"
                />

                <span
                  style={{
                    transform: isOpening
                      ? 'translate3d(0, 0, 14px) rotateY(-38deg)'
                      : 'translate3d(0, 0, 12px) rotateY(0deg)',
                    transformOrigin: '2% center',
                    transition: 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1), border-color 350ms ease',
                    borderColor: isHovered ? currentTheme.primary : 'rgba(255, 255, 255, 0.14)',
                    background:
                      'radial-gradient(circle at 80% 15%, rgba(255,255,255,0.12), transparent 50%), linear-gradient(160deg, #13151f 0%, #0a0b10 100%)'
                  }}
                  className="absolute inset-0 rounded-[4px_10px_10px_4px] overflow-hidden border backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.65),inset_4px_0_12px_rgba(255,255,255,0.06)]"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-[2px] opacity-90"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${currentTheme.primary}, transparent)`
                    }}
                  />

                  <span
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.25) 75%, transparent)'
                    }}
                    className="absolute top-0 bottom-0 left-0 w-[5.5%]"
                  />

                  <span className="absolute inset-[7%_8.5%_6.5%] grid grid-rows-[auto_auto_auto_1fr_auto] content-start text-center text-neutral-100">
                    <span
                      style={{ color: currentTheme.primary }}
                      className="text-[clamp(9px,0.75vw,12px)] font-mono font-medium tracking-[0.24em] uppercase"
                    >
                      {cfg.kicker}
                    </span>
                    <span className="mt-[4%] text-[clamp(28px,3.6vw,52px)] italic font-light tracking-[-0.04em] leading-[0.94] text-white">
                      {car.name}
                    </span>
                    <span className="mt-[3.5%] text-[clamp(10px,0.95vw,13px)] font-mono tracking-[0.14em] uppercase text-neutral-400">
                      {car.brand} · {car.year}
                    </span>
                    <span className="self-center flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-neutral-300">
                        {car.specs.hp} · {car.specs.zeroSixty}
                      </span>
                    </span>
                    <span className="self-end pt-[4%] border-t border-white/10 text-[clamp(7px,0.62vw,9px)] font-mono tracking-[0.2em] uppercase text-neutral-400">
                      {cfg.footer}
                    </span>
                  </span>
                </span>

                <span
                  style={{
                    backgroundColor: currentTheme.primary,
                    boxShadow: `0 10px 28px ${currentTheme.glow}`,
                    transform: isHovered
                      ? 'translate(-50%, -50%) scale(1)'
                      : 'translate(-50%, -50%) scale(0.75)',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 260ms ease, transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  className="absolute z-[6] top-[52%] left-1/2 px-5 py-2 rounded-full text-black text-[10px] font-mono font-semibold tracking-[0.2em] uppercase pointer-events-none"
                >
                  Enter Showroom
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <div
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translate(-50%, 0)' : 'translate(-50%, 14px)',
          transition: 'opacity 800ms ease 400ms, transform 800ms cubic-bezier(0.16, 1, 0.3, 1) 400ms'
        }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-400 pointer-events-none"
      >
        Select a Volume to Enter Showroom
      </div>

      <nav
        aria-label="Vehicle index"
        className={`fixed inset-0 z-40 grid place-items-center bg-[#07080c]/92 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ul className="flex flex-col items-center gap-4 m-0 p-0 list-none">
          {cars.map((car, idx) => (
            <li
              key={car.id}
              style={{
                transform: menuOpen ? 'translateY(0)' : 'translateY(24px)',
                opacity: menuOpen ? 1 : 0,
                transition: `transform 550ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, opacity 450ms ease ${idx * 70}ms`
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleSelectBook(car, idx);
                }}
                className="group flex items-baseline gap-4 text-neutral-300 hover:text-white transition-colors"
              >
                <span
                  style={{ color: currentTheme.primary }}
                  className="text-xs font-mono tracking-widest uppercase"
                >
                  0{idx + 1}
                </span>
                <span className="text-[clamp(36px,5.5vw,76px)] italic font-light tracking-[-0.04em] leading-tight">
                  {car.brand} <span className="font-normal">{car.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}