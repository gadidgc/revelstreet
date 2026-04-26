import { create } from 'zustand';
import type { Route } from '../types';

export const SEGMENT_DURATION_MS = 6000;

export const CAMERA_VIDEO_URL =
  'https://videos.pexels.com/video-files/2169880/2169880-hd_1280_720_30fps.mp4';

type SimState = {
  isPlaying: boolean;
  segmentIdx: number;
  t: number;
  arrived: boolean;
  cameraOpen: boolean;

  play: () => void;
  pause: () => void;
  reset: () => void;
  tick: (deltaMs: number) => void;
  release: () => void;
  openCamera: () => void;
  closeCamera: () => void;

  position: (route: Route) => [number, number];
};

const INITIAL = {
  isPlaying: true,
  segmentIdx: 0,
  t: 0,
  arrived: false,
  cameraOpen: false,
};

export const useSimStore = create<SimState>()((set, get) => ({
  ...INITIAL,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  reset: () => set({ ...INITIAL }),

  tick: (deltaMs) => {
    const { isPlaying, arrived, t } = get();
    if (!isPlaying || arrived) return;
    const next = t + deltaMs / SEGMENT_DURATION_MS;
    if (next >= 1) {
      set({ t: 1, arrived: true });
    } else {
      set({ t: next });
    }
  },

  release: () => {
    set((s) => ({ segmentIdx: s.segmentIdx + 1, t: 0, arrived: false }));
  },

  openCamera: () => set({ cameraOpen: true }),
  closeCamera: () => set({ cameraOpen: false }),

  position: (route) => {
    const { segmentIdx, t } = get();
    const stops = route.stops;
    const a = stops[Math.min(segmentIdx, stops.length - 1)];
    const b = stops[Math.min(segmentIdx + 1, stops.length - 1)];
    return [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
  },
}));

export const isAtLastStop = (segmentIdx: number, totalStops: number): boolean =>
  segmentIdx >= totalStops - 1;
