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
      className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-ink shadow-[0_0_0_3px_rgba(200,85,61,0.08)]"
    >
      <div className="flex items-center gap-2 text-[14px]">
        <span className="text-base">📡</span>
        <span className="font-serif italic text-accent">Drone has arrived at {active.name}.</span>
        <span className="text-ink-soft">Confirm arrival to continue.</span>
      </div>
    </div>
  );
}
