import { useEffect, useRef } from 'react';
import { useSimStore } from '../store/simStore';
import { useRouteStore, selectActiveStop } from '../store/routeStore';

/**
 * One rAF loop, mounted at app root. Drives simStore.tick(dt). Watches the
 * active stop's status — when it becomes terminal while the drone is arrived
 * at that stop, releases the drone to the next segment.
 */
export function useSimTick() {
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      if (last != null) {
        const dt = Math.min(ts - last, 100); // clamp big tab-switch deltas
        useSimStore.getState().tick(dt);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, []);

  // Release drone when the operator confirms the arrived stop.
  useEffect(() => {
    const unsub = useRouteStore.subscribe((state, prev) => {
      const sim = useSimStore.getState();
      if (!sim.arrived) return;
      const active = selectActiveStop(state.route);
      const prevActive = selectActiveStop(prev.route);
      // Active stop changed (prev one became terminal) -> release.
      if (prevActive?.id !== active?.id) {
        sim.release();
      }
    });
    return unsub;
  }, []);
}
