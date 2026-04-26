import { beforeEach, describe, expect, it } from 'vitest';
import { useSimStore, SEGMENT_DURATION_MS } from './simStore';
import { sampleRoute } from '../data/routes';

const reset = () => useSimStore.getState().reset();

describe('simStore', () => {
  beforeEach(() => reset());

  it('starts auto-playing at segment 0, t=0, not arrived, position at first stop', () => {
    const s = useSimStore.getState();
    expect(s.isPlaying).toBe(true);
    expect(s.segmentIdx).toBe(0);
    expect(s.t).toBe(0);
    expect(s.arrived).toBe(false);
    expect(s.cameraOpen).toBe(false);
    const [lat, lng] = s.position(sampleRoute);
    expect(lat).toBeCloseTo(sampleRoute.stops[0].lat);
    expect(lng).toBeCloseTo(sampleRoute.stops[0].lng);
  });

  it('pause() clears isPlaying; play() sets it', () => {
    useSimStore.getState().pause();
    expect(useSimStore.getState().isPlaying).toBe(false);
    useSimStore.getState().play();
    expect(useSimStore.getState().isPlaying).toBe(true);
  });

  it('tick advances t while playing and stops once arrived', () => {
    const s = useSimStore.getState();
    s.play();
    s.tick(SEGMENT_DURATION_MS / 2); // half a segment
    expect(useSimStore.getState().t).toBeCloseTo(0.5, 2);
    expect(useSimStore.getState().arrived).toBe(false);

    s.tick(SEGMENT_DURATION_MS); // overshoot — should clamp + latch arrived
    const after = useSimStore.getState();
    expect(after.t).toBe(1);
    expect(after.arrived).toBe(true);

    // Further ticks while arrived do nothing.
    s.tick(SEGMENT_DURATION_MS);
    expect(useSimStore.getState().t).toBe(1);
  });

  it('release() advances segment, resets t, clears arrived', () => {
    const s = useSimStore.getState();
    s.play();
    s.tick(SEGMENT_DURATION_MS);
    expect(useSimStore.getState().arrived).toBe(true);
    s.release();
    const after = useSimStore.getState();
    expect(after.segmentIdx).toBe(1);
    expect(after.t).toBe(0);
    expect(after.arrived).toBe(false);
  });

  it('release() at the last segment latches at the end (no overflow)', () => {
    const s = useSimStore.getState();
    // Walk all segments
    for (let i = 0; i < sampleRoute.stops.length - 1; i++) {
      s.play();
      s.tick(SEGMENT_DURATION_MS);
      s.release();
    }
    const after = useSimStore.getState();
    expect(after.segmentIdx).toBe(sampleRoute.stops.length - 1);
    // Ticking past the end is a no-op.
    s.play();
    s.tick(SEGMENT_DURATION_MS);
    expect(useSimStore.getState().segmentIdx).toBe(sampleRoute.stops.length - 1);
  });

  it('reset() returns to initial state', () => {
    const s = useSimStore.getState();
    s.play();
    s.tick(SEGMENT_DURATION_MS);
    s.release();
    s.openCamera();
    s.reset();
    const after = useSimStore.getState();
    expect(after.segmentIdx).toBe(0);
    expect(after.t).toBe(0);
    expect(after.arrived).toBe(false);
    expect(after.isPlaying).toBe(true);
    expect(after.cameraOpen).toBe(false);
  });

  it('openCamera/closeCamera toggle cameraOpen', () => {
    const s = useSimStore.getState();
    s.openCamera();
    expect(useSimStore.getState().cameraOpen).toBe(true);
    s.closeCamera();
    expect(useSimStore.getState().cameraOpen).toBe(false);
  });

  it('position interpolates linearly mid-segment', () => {
    const s = useSimStore.getState();
    s.play();
    s.tick(SEGMENT_DURATION_MS / 2);
    const [lat, lng] = useSimStore.getState().position(sampleRoute);
    const a = sampleRoute.stops[0];
    const b = sampleRoute.stops[1];
    expect(lat).toBeCloseTo((a.lat + b.lat) / 2, 4);
    expect(lng).toBeCloseTo((a.lng + b.lng) / 2, 4);
  });
});
