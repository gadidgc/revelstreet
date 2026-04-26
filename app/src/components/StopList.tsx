import { useRouteStore, selectActiveStop } from '../store/routeStore';
import { StopCard } from './StopCard';

export function StopList() {
  const route = useRouteStore((s) => s.route);
  const active = selectActiveStop(route);

  return (
    <ol
      data-testid="stop-list"
      className="flex h-full flex-col gap-3 overflow-y-auto p-4"
    >
      {route.stops.map((stop, i) => (
        <StopCard
          key={stop.id}
          stop={stop}
          index={i}
          isActive={active?.id === stop.id}
        />
      ))}
    </ol>
  );
}
