import { useEffect, useRef } from 'react';
import { useDroneStore } from '../store/droneStore';
import { useRouteStore } from '../store/routeStore';
import { useSimStore } from '../store/simStore';

// Degrees per second when an arrow is held. ~0.012°/s ≈ crosses the SF view
// (~0.05°) in ~4s at zoom 13. Diagonal movement is normalized below.
const SPEED = 0.012;
// Single-tap nudge (button click).
const TAP_STEP = 0.002;

type Dir = 'up' | 'down' | 'left' | 'right';

const KEY_TO_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function currentDronePosition(): { lat: number; lng: number } {
  const drone = useDroneStore.getState();
  if (drone.manual) return drone.position;
  // Snap from the simulation's current segment+t.
  const route = useRouteStore.getState().route;
  const sim = useSimStore.getState();
  const stops = route.stops;
  const a = stops[Math.min(sim.segmentIdx, stops.length - 1)];
  const b = stops[Math.min(sim.segmentIdx + 1, stops.length - 1)];
  return {
    lat: a.lat + (b.lat - a.lat) * sim.t,
    lng: a.lng + (b.lng - a.lng) * sim.t,
  };
}

function takeManualControl() {
  const drone = useDroneStore.getState();
  if (drone.manual) return;
  const pos = currentDronePosition();
  drone.enableManual(pos.lat, pos.lng);
  useSimStore.getState().pause();
}

export function DevPanel() {
  const position = useDroneStore((s) => s.position);
  const manual = useDroneStore((s) => s.manual);
  const nudge = useDroneStore((s) => s.nudge);
  const disableManual = useDroneStore((s) => s.disableManual);
  const addRandomDelivery = useRouteStore((s) => s.addRandomDelivery);
  const playSim = useSimStore((s) => s.play);

  const heldRef = useRef<Set<Dir>>(new Set());
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      );
    };

    const tick = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const dt = (ts - last) / 1000;
      lastTsRef.current = ts;

      let dLat = 0;
      let dLng = 0;
      const held = heldRef.current;
      if (held.has('up')) dLat += 1;
      if (held.has('down')) dLat -= 1;
      if (held.has('right')) dLng += 1;
      if (held.has('left')) dLng -= 1;

      if (dLat !== 0 || dLng !== 0) {
        const mag = Math.hypot(dLat, dLng);
        const step = SPEED * dt;
        nudge((dLat / mag) * step, (dLng / mag) * step);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        lastTsRef.current = null;
      }
    };

    const startLoop = () => {
      if (rafRef.current == null) {
        lastTsRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;
      e.preventDefault();
      takeManualControl();
      heldRef.current.add(dir);
      startLoop();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key];
      if (!dir) return;
      heldRef.current.delete(dir);
    };

    const onBlur = () => {
      heldRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [nudge]);

  const tapNudge = (dLat: number, dLng: number) => {
    takeManualControl();
    nudge(dLat, dLng);
  };

  const resumeSim = () => {
    disableManual();
    playSim();
  };

  return (
    <div
      data-testid="dev-panel"
      className="fixed bottom-4 right-4 z-[1000] w-64 rounded-lg border border-neutral-700 bg-neutral-900/95 p-3 text-xs text-neutral-200 shadow-xl backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-950">
          DEV
        </span>
        <span className="font-mono text-[10px] text-neutral-400">
          {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
        </span>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-neutral-500">
          <span>Move drone</span>
          {manual && (
            <span className="rounded bg-neutral-800 px-1 py-0.5 text-[9px] font-bold text-amber-400">
              MANUAL
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1 text-center font-mono text-sm">
          <div></div>
          <button
            type="button"
            onClick={() => tapNudge(TAP_STEP, 0)}
            className="rounded bg-neutral-800 py-1 hover:bg-neutral-700"
            aria-label="Move drone north"
          >
            ↑
          </button>
          <div></div>
          <button
            type="button"
            onClick={() => tapNudge(0, -TAP_STEP)}
            className="rounded bg-neutral-800 py-1 hover:bg-neutral-700"
            aria-label="Move drone west"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => tapNudge(-TAP_STEP, 0)}
            className="rounded bg-neutral-800 py-1 hover:bg-neutral-700"
            aria-label="Move drone south"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => tapNudge(0, TAP_STEP)}
            className="rounded bg-neutral-800 py-1 hover:bg-neutral-700"
            aria-label="Move drone east"
          >
            →
          </button>
        </div>
        <div className="mt-1 text-[10px] text-neutral-500">
          Hold arrow keys to fly
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addRandomDelivery}
          className="flex-1 rounded bg-sky-600 px-2 py-1.5 font-medium text-white hover:bg-sky-500"
        >
          + Random Delivery
        </button>
        {manual && (
          <button
            type="button"
            onClick={resumeSim}
            className="rounded bg-neutral-700 px-2 py-1.5 font-medium text-neutral-100 hover:bg-neutral-600"
            title="Resume simulation and release manual control"
          >
            ↻ Sim
          </button>
        )}
      </div>
    </div>
  );
}
