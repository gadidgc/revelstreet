import { useSimStore } from '../store/simStore';
import { useRouteStore, selectActiveStop } from '../store/routeStore';

export function ArrivalBanner() {
  const route = useRouteStore((s) => s.route);
  const arrived = useSimStore((s) => s.arrived);
  const active = selectActiveStop(route);

  if (!arrived || !active || active.status !== 'pending') return null;

  return (
    <div
      data-testid="arrival-banner"
      role="status"
      className="rounded-md border border-amber-500/60 bg-amber-500/15 px-4 py-3 text-amber-100 shadow-[0_0_0_2px_rgba(245,158,11,0.15)]"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">📡</span>
        <span className="font-semibold">Drone has arrived at {active.name}.</span>
        <span className="text-amber-200/80">Confirm arrival to continue.</span>
      </div>
    </div>
  );
}
