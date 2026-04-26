import { create } from 'zustand';

type DroneState = {
  // When `manual` is true, the rendered drone position uses `position`
  // (controlled by DevPanel arrow keys). Otherwise the simulation's computed
  // position is used.
  manual: boolean;
  position: { lat: number; lng: number };
  enableManual: (lat: number, lng: number) => void;
  disableManual: () => void;
  nudge: (dLat: number, dLng: number) => void;
  setPosition: (lat: number, lng: number) => void;
};

export const useDroneStore = create<DroneState>((set) => ({
  manual: false,
  position: { lat: 37.7749, lng: -122.4194 },
  enableManual: (lat, lng) => set({ manual: true, position: { lat, lng } }),
  disableManual: () => set({ manual: false }),
  nudge: (dLat, dLng) =>
    set((s) => ({
      position: { lat: s.position.lat + dLat, lng: s.position.lng + dLng },
    })),
  setPosition: (lat, lng) => set({ position: { lat, lng } }),
}));
