import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Route, Stop, StopStatus } from '../types';
import { sampleRoute } from '../data/routes';

type RouteState = {
  route: Route;
  markArrived: (stopId: string) => void;
  markDeparted: (stopId: string) => void;
  markCompleted: (stopId: string) => void;
  markFailed: (stopId: string, reason: string) => void;
  resetRoute: () => void;
  addRandomDelivery: () => void;
};

const cloneRoute = (r: Route): Route => ({
  ...r,
  stops: r.stops.map((s) => ({ ...s, status: 'pending' as StopStatus,
    arrivedAt: undefined, departedAt: undefined, completedAt: undefined,
    failedAt: undefined, failureReason: undefined })),
});

const updateStop = (route: Route, stopId: string, patch: Partial<Stop>): Route => ({
  ...route,
  stops: route.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)),
});

const findStop = (route: Route, stopId: string): Stop | undefined =>
  route.stops.find((s) => s.id === stopId);

export class IllegalTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalTransitionError';
  }
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      route: cloneRoute(sampleRoute),

      markArrived: (stopId) => {
        const stop = findStop(get().route, stopId);
        if (!stop) throw new IllegalTransitionError(`stop ${stopId} not found`);
        if (stop.status !== 'pending') {
          throw new IllegalTransitionError(
            `cannot mark arrived from status "${stop.status}"`,
          );
        }
        set({
          route: updateStop(get().route, stopId, {
            status: 'arrived',
            arrivedAt: new Date().toISOString(),
          }),
        });
      },

      markDeparted: (stopId) => {
        const stop = findStop(get().route, stopId);
        if (!stop) throw new IllegalTransitionError(`stop ${stopId} not found`);
        if (stop.type !== 'pickup') {
          throw new IllegalTransitionError(
            `markDeparted only valid for pickup stops`,
          );
        }
        if (stop.status !== 'arrived') {
          throw new IllegalTransitionError(
            `cannot mark departed from status "${stop.status}"`,
          );
        }
        set({
          route: updateStop(get().route, stopId, {
            status: 'departed',
            departedAt: new Date().toISOString(),
          }),
        });
      },

      markCompleted: (stopId) => {
        const stop = findStop(get().route, stopId);
        if (!stop) throw new IllegalTransitionError(`stop ${stopId} not found`);
        if (stop.type !== 'delivery') {
          throw new IllegalTransitionError(
            `markCompleted only valid for delivery stops`,
          );
        }
        if (stop.status !== 'arrived') {
          throw new IllegalTransitionError(
            `cannot mark completed from status "${stop.status}"`,
          );
        }
        set({
          route: updateStop(get().route, stopId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
          }),
        });
      },

      markFailed: (stopId, reason) => {
        const stop = findStop(get().route, stopId);
        if (!stop) throw new IllegalTransitionError(`stop ${stopId} not found`);
        if (stop.type !== 'delivery') {
          throw new IllegalTransitionError(
            `markFailed only valid for delivery stops`,
          );
        }
        if (stop.status !== 'arrived') {
          throw new IllegalTransitionError(
            `cannot mark failed from status "${stop.status}"`,
          );
        }
        if (!reason || !reason.trim()) {
          throw new IllegalTransitionError(`failure reason is required`);
        }
        set({
          route: updateStop(get().route, stopId, {
            status: 'failed',
            failedAt: new Date().toISOString(),
            failureReason: reason.trim(),
          }),
        });
      },

      resetRoute: () => {
        set({ route: cloneRoute(sampleRoute) });
      },

      addRandomDelivery: () => {
        const route = get().route;
        const lats = route.stops.map((s) => s.lat);
        const lngs = route.stops.map((s) => s.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const padLat = (maxLat - minLat) * 0.2 || 0.01;
        const padLng = (maxLng - minLng) * 0.2 || 0.01;
        const lat =
          minLat - padLat + Math.random() * (maxLat - minLat + 2 * padLat);
        const lng =
          minLng - padLng + Math.random() * (maxLng - minLng + 2 * padLng);
        const deliveryCount = route.stops.filter(
          (s) => s.type === 'delivery',
        ).length;
        const newStop: Stop = {
          id: `stop-${Date.now()}`,
          type: 'delivery',
          name: `Random Drop #${deliveryCount + 1}`,
          address: 'Auto-generated',
          lat,
          lng,
          status: 'pending',
        };
        set({ route: { ...route, stops: [...route.stops, newStop] } });
      },
    }),
    { name: 'revelstreet-route' },
  ),
);

// Selectors

export const selectVisibleStops = (route: Route): Stop[] =>
  route.stops.filter((s) => {
    if (s.type === 'pickup') return s.status !== 'departed';
    return s.status !== 'completed' && s.status !== 'failed';
  });

export const selectActiveStop = (route: Route): Stop | undefined => {
  // active = first stop that isn't completed/failed/departed
  return route.stops.find((s) => {
    if (s.type === 'pickup') return s.status !== 'departed';
    return s.status !== 'completed' && s.status !== 'failed';
  });
};

export const selectProgress = (route: Route): { done: number; total: number } => {
  const total = route.stops.length;
  const done = route.stops.filter((s) =>
    s.type === 'pickup'
      ? s.status === 'departed'
      : s.status === 'completed' || s.status === 'failed',
  ).length;
  return { done, total };
};

export const isRouteComplete = (route: Route): boolean => {
  const { done, total } = selectProgress(route);
  return done === total;
};

export const nextActionFor = (
  stop: Stop,
): 'arrived' | 'departed' | 'completed-or-failed' | 'done' => {
  if (stop.status === 'pending') return 'arrived';
  if (stop.type === 'pickup' && stop.status === 'arrived') return 'departed';
  if (stop.type === 'delivery' && stop.status === 'arrived')
    return 'completed-or-failed';
  return 'done';
};
