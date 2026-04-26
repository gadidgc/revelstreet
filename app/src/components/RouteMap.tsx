import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRouteStore, selectActiveStop } from '../store/routeStore';
import { DroneMarker } from './DroneMarker';
import type { Stop } from '../types';

function pinIcon(stop: Stop, index: number, isActive: boolean): L.DivIcon {
  const baseColor = stop.type === 'pickup' ? '#f43f5e' : '#0ea5e9'; // rose / sky
  const statusColor =
    stop.status === 'completed' || stop.status === 'departed'
      ? '#10b981'
      : stop.status === 'failed'
      ? '#ef4444'
      : stop.status === 'arrived'
      ? '#f59e0b'
      : baseColor;

  const ring = isActive
    ? 'box-shadow: 0 0 0 3px rgba(245,158,11,0.7), 0 0 0 6px rgba(245,158,11,0.25);'
    : 'box-shadow: 0 1px 4px rgba(0,0,0,0.5);';

  const html = `
    <div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${statusColor}; color: #0b0d10;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; font-family: system-ui;
      border: 2px solid #fff; ${ring}
    ">${index + 1}</div>
  `;

  return L.divIcon({
    className: 'stop-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function RouteMap() {
  const route = useRouteStore((s) => s.route);
  const active = selectActiveStop(route);

  const positions = useMemo<[number, number][]>(
    () => route.stops.map((s) => [s.lat, s.lng]),
    [route.stops],
  );

  // Center on the bounding box of all stops.
  const center = useMemo<[number, number]>(() => {
    const lats = route.stops.map((s) => s.lat);
    const lngs = route.stops.map((s) => s.lng);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  }, [route.stops]);

  return (
    <div data-testid="route-map" className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#1a1d22' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          pathOptions={{ color: '#a3a3a3', weight: 3, dashArray: '6 6', opacity: 0.7 }}
        />
        {route.stops.map((stop, i) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={pinIcon(stop, i, active?.id === stop.id)}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>
                  #{i + 1} — {stop.type.toUpperCase()}
                </strong>
                <br />
                {stop.name}
                <br />
                <span style={{ fontSize: 12, color: '#666' }}>{stop.address}</span>
                <br />
                <span style={{ fontSize: 12, color: '#444' }}>
                  Status: {stop.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
        <DroneMarker />
      </MapContainer>
    </div>
  );
}
