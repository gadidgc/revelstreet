import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useSimStore } from '../store/simStore';
import { useRouteStore } from '../store/routeStore';
import { useDroneStore } from '../store/droneStore';

function droneIcon(arrived: boolean): L.DivIcon {
  // Editorial palette: terracotta when arrived, deep navy in transit
  const ring = arrived
    ? 'box-shadow: 0 0 0 4px rgba(200,85,61,0.85), 0 0 0 10px rgba(200,85,61,0.28), 0 0 16px rgba(200,85,61,0.5); animation: drone-pulse 1.4s ease-in-out infinite;'
    : 'box-shadow: 0 0 0 2px rgba(15,23,41,0.55), 0 2px 8px rgba(15,23,41,0.25);';

  const fill = arrived ? '#c8553d' : '#0f1729';
  const ink = '#faf6ef';

  const html = `
    <div
      data-testid="drone-marker"
      data-arrived="${arrived}"
      style="
        width: 28px; height: 28px; border-radius: 50%;
        background: ${fill}; color: ${ink};
        display: flex; align-items: center; justify-content: center;
        font-size: 15px; font-family: system-ui;
        border: 2px solid ${ink}; ${ring}
        cursor: pointer;
      "
      title="Click to open drone camera"
    >🛸</div>
  `;

  return L.divIcon({
    className: 'drone-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function DroneMarker() {
  const route = useRouteStore((s) => s.route);
  const arrived = useSimStore((s) => s.arrived);
  const segmentIdx = useSimStore((s) => s.segmentIdx);
  const t = useSimStore((s) => s.t);
  const openCamera = useSimStore((s) => s.openCamera);
  const manual = useDroneStore((s) => s.manual);
  const manualPos = useDroneStore((s) => s.position);

  const position = useMemo<[number, number]>(() => {
    if (manual) return [manualPos.lat, manualPos.lng];
    const stops = route.stops;
    const a = stops[Math.min(segmentIdx, stops.length - 1)];
    const b = stops[Math.min(segmentIdx + 1, stops.length - 1)];
    return [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
  }, [manual, manualPos.lat, manualPos.lng, route.stops, segmentIdx, t]);

  const icon = useMemo(() => droneIcon(arrived && !manual), [arrived, manual]);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: () => openCamera() }}
    />
  );
}
