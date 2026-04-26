import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useSimStore } from '../store/simStore';
import { useRouteStore } from '../store/routeStore';

function droneIcon(arrived: boolean): L.DivIcon {
  const ring = arrived
    ? 'box-shadow: 0 0 0 4px rgba(245,158,11,0.85), 0 0 0 10px rgba(245,158,11,0.35), 0 0 16px rgba(245,158,11,0.6); animation: drone-pulse 1.4s ease-in-out infinite;'
    : 'box-shadow: 0 0 0 2px rgba(56,189,248,0.7), 0 2px 8px rgba(0,0,0,0.6);';

  const html = `
    <div
      data-testid="drone-marker"
      data-arrived="${arrived}"
      style="
        width: 28px; height: 28px; border-radius: 50%;
        background: #0b0d10; color: #38bdf8;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; font-family: system-ui;
        border: 2px solid #38bdf8; ${ring}
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

  const position = useMemo<[number, number]>(() => {
    const stops = route.stops;
    const a = stops[Math.min(segmentIdx, stops.length - 1)];
    const b = stops[Math.min(segmentIdx + 1, stops.length - 1)];
    return [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
  }, [route.stops, segmentIdx, t]);

  const icon = useMemo(() => droneIcon(arrived), [arrived]);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: () => openCamera() }}
    />
  );
}
