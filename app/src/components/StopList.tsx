import {
  useRouteStore,
  selectActiveStop,
  selectVisibleStops,
} from '../store/routeStore';
import { StopCard } from './StopCard';
import { ArrivalBanner } from './ArrivalBanner';

export function StopList() {
  const route = useRouteStore((s) => s.route);
  const active = selectActiveStop(route);
  const visibleStops = selectVisibleStops(route);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <ArrivalBanner />
      <ol data-testid="stop-list" className="flex flex-col gap-3">
        {visibleStops.map((stop, i) => (
          <StopCard
            key={stop.id}
            stop={stop}
            index={i}
            isActive={active?.id === stop.id}
          />
        ))}
      </ol>
    </div>
  );
}
