import { beforeEach, describe, expect, it } from 'vitest';
import {
  IllegalTransitionError,
  isRouteComplete,
  nextActionFor,
  selectActiveStop,
  selectProgress,
  useRouteStore,
} from './routeStore';

const PICKUP_ID = 'stop-1';
const PICKUP_ID_2 = 'stop-2';
const DELIVERY_ID = 'stop-3';

beforeEach(() => {
  useRouteStore.getState().resetRoute();
  // also clear localStorage between tests
  localStorage.clear();
  useRouteStore.getState().resetRoute();
});

describe('routeStore — pickup transitions', () => {
  it('starts pickup as pending', () => {
    const stop = useRouteStore
      .getState()
      .route.stops.find((s) => s.id === PICKUP_ID);
    expect(stop?.status).toBe('pending');
  });

  it('pending → arrived sets timestamp', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    const stop = useRouteStore
      .getState()
      .route.stops.find((s) => s.id === PICKUP_ID);
    expect(stop?.status).toBe('arrived');
    expect(stop?.arrivedAt).toBeDefined();
  });

  it('arrived → departed sets timestamp', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    useRouteStore.getState().markDeparted(PICKUP_ID);
    const stop = useRouteStore
      .getState()
      .route.stops.find((s) => s.id === PICKUP_ID);
    expect(stop?.status).toBe('departed');
    expect(stop?.departedAt).toBeDefined();
  });

  it('rejects depart before arrive', () => {
    expect(() => useRouteStore.getState().markDeparted(PICKUP_ID)).toThrow(
      IllegalTransitionError,
    );
  });

  it('rejects arrive twice', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    expect(() => useRouteStore.getState().markArrived(PICKUP_ID)).toThrow(
      IllegalTransitionError,
    );
  });

  it('rejects markCompleted on a pickup', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    expect(() => useRouteStore.getState().markCompleted(PICKUP_ID)).toThrow(
      IllegalTransitionError,
    );
  });

  it('rejects markFailed on a pickup', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    expect(() =>
      useRouteStore.getState().markFailed(PICKUP_ID, 'foo'),
    ).toThrow(IllegalTransitionError);
  });
});

describe('routeStore — delivery transitions', () => {
  it('arrived → completed sets timestamp', () => {
    useRouteStore.getState().markArrived(DELIVERY_ID);
    useRouteStore.getState().markCompleted(DELIVERY_ID);
    const stop = useRouteStore
      .getState()
      .route.stops.find((s) => s.id === DELIVERY_ID);
    expect(stop?.status).toBe('completed');
    expect(stop?.completedAt).toBeDefined();
  });

  it('arrived → failed records reason and timestamp', () => {
    useRouteStore.getState().markArrived(DELIVERY_ID);
    useRouteStore.getState().markFailed(DELIVERY_ID, 'No one home');
    const stop = useRouteStore
      .getState()
      .route.stops.find((s) => s.id === DELIVERY_ID);
    expect(stop?.status).toBe('failed');
    expect(stop?.failedAt).toBeDefined();
    expect(stop?.failureReason).toBe('No one home');
  });

  it('rejects markFailed without a reason', () => {
    useRouteStore.getState().markArrived(DELIVERY_ID);
    expect(() => useRouteStore.getState().markFailed(DELIVERY_ID, '   ')).toThrow(
      IllegalTransitionError,
    );
  });

  it('rejects markCompleted before arrived', () => {
    expect(() => useRouteStore.getState().markCompleted(DELIVERY_ID)).toThrow(
      IllegalTransitionError,
    );
  });

  it('rejects markDeparted on a delivery', () => {
    useRouteStore.getState().markArrived(DELIVERY_ID);
    expect(() => useRouteStore.getState().markDeparted(DELIVERY_ID)).toThrow(
      IllegalTransitionError,
    );
  });
});

describe('routeStore — unknown stop', () => {
  it('throws for unknown stopId', () => {
    expect(() => useRouteStore.getState().markArrived('nonexistent')).toThrow(
      IllegalTransitionError,
    );
  });
});

describe('selectors', () => {
  it('selectActiveStop returns first pending stop initially', () => {
    const active = selectActiveStop(useRouteStore.getState().route);
    expect(active?.id).toBe(PICKUP_ID);
  });

  it('selectActiveStop advances to next stop after departure', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    useRouteStore.getState().markDeparted(PICKUP_ID);
    const active = selectActiveStop(useRouteStore.getState().route);
    expect(active?.id).toBe(PICKUP_ID_2);
  });

  it('selectProgress counts only completed stops', () => {
    expect(selectProgress(useRouteStore.getState().route)).toEqual({
      done: 0,
      total: 5,
    });
    useRouteStore.getState().markArrived(PICKUP_ID);
    expect(selectProgress(useRouteStore.getState().route).done).toBe(0);
    useRouteStore.getState().markDeparted(PICKUP_ID);
    expect(selectProgress(useRouteStore.getState().route).done).toBe(1);
  });

  it('isRouteComplete is true when every stop is finalized', () => {
    const s = useRouteStore.getState();
    s.markArrived('stop-1'); s.markDeparted('stop-1');
    s.markArrived('stop-2'); s.markDeparted('stop-2');
    s.markArrived('stop-3'); s.markCompleted('stop-3');
    s.markArrived('stop-4'); s.markFailed('stop-4', 'No one home');
    s.markArrived('stop-5'); s.markCompleted('stop-5');
    expect(isRouteComplete(useRouteStore.getState().route)).toBe(true);
  });

  it('nextActionFor returns the right next action', () => {
    const route = useRouteStore.getState().route;
    expect(nextActionFor(route.stops[0])).toBe('arrived');
    useRouteStore.getState().markArrived('stop-1');
    expect(nextActionFor(useRouteStore.getState().route.stops[0])).toBe('departed');
    useRouteStore.getState().markArrived('stop-3');
    expect(nextActionFor(useRouteStore.getState().route.stops[2])).toBe(
      'completed-or-failed',
    );
  });
});

describe('resetRoute', () => {
  it('returns all stops to pending and clears timestamps', () => {
    useRouteStore.getState().markArrived(PICKUP_ID);
    useRouteStore.getState().markDeparted(PICKUP_ID);
    useRouteStore.getState().resetRoute();
    const stop = useRouteStore
      .getState()
      .route.stops.find((s) => s.id === PICKUP_ID);
    expect(stop?.status).toBe('pending');
    expect(stop?.arrivedAt).toBeUndefined();
    expect(stop?.departedAt).toBeUndefined();
  });
});
