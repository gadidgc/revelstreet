import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  useRouteStore,
  selectActiveStop,
  selectVisibleStops,
} from '../store/routeStore';
import { DroneMarker } from './DroneMarker';
import type { Stop } from '../types';

type MapStyle = 'map' | 'satellite';

function pinIcon(
  stop: Stop,
  index: number,
  isActive: boolean,
  mapStyle: MapStyle,
): L.DivIcon {
  const navy = '#0f1729';
  const cream = '#faf6ef';
  const accent = '#c8553d';
  const sage = '#7a8c6f';
  const danger = '#a63a2c';

  const fill = isActive
    ? accent
    : stop.status === 'completed' || stop.status === 'departed'
    ? sage
    : stop.status === 'failed'
    ? danger
    : navy;

  const borderWidth = mapStyle === 'satellite' ? 2 : 1;
  const borderColor = mapStyle === 'satellite' ? '#ffffff' : 'rgba(15,23,41,0.15)';

  const ring = isActive
    ? `box-shadow: 0 0 0 6px rgba(200,85,61,0.18);`
    : `box-shadow: 0 1px 2px rgba(15,23,41,0.25);`;

  const html = `
    <div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${fill}; color: ${cream};
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 13px;
      font-family: 'Fraunces', ui-serif, Georgia, serif;
      border: ${borderWidth}px solid ${borderColor};
      ${ring}
    ">${index + 1}</div>
  `;

  return L.divIcon({
    className: 'stop-pin',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function RouteMap() {
  const route = useRouteStore((s) => s.route);
  const active = selectActiveStop(route);
  const visibleStops = useMemo(() => selectVisibleStops(route), [route]);
  const [mapStyle, setMapStyle] = useState<MapStyle>('map');

  const positions = useMemo<[number, number][]>(
    () => visibleStops.map((s) => [s.lat, s.lng]),
    [visibleStops],
  );

  const bounds = useMemo(() => {
    if (positions.length === 0) return undefined;
    return L.latLngBounds(positions).pad(0.15);
  }, [positions]);

  const center = useMemo<[number, number]>(() => {
    const lats = route.stops.map((s) => s.lat);
    const lngs = route.stops.map((s) => s.lng);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  }, [route.stops]);

  const polylineColor = mapStyle === 'satellite' ? '#c8553d' : '#7a8c6f';
  const polylineWeight = mapStyle === 'satellite' ? 3 : 2.5;

  return (
    <div
      data-testid="route-map"
      className="relative h-full w-full overflow-hidden rounded-md shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_rgba(15,23,41,0.06)]"
    >
      <MapContainer
        center={center}
        zoom={13}
        bounds={bounds}
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#f0ebe0' }}
      >
        {mapStyle === 'map' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <>
            <TileLayer
              attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            />
          </>
        )}
        <Polyline
          positions={positions}
          pathOptions={{
            color: polylineColor,
            weight: polylineWeight,
            opacity: 0.85,
          }}
        />
        {visibleStops.map((stop, i) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={pinIcon(stop, i, active?.id === stop.id, mapStyle)}
          >
            <Popup>
              <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: stop.type === 'pickup' ? '#c8553d' : '#5a6478',
                    marginBottom: 4,
                  }}
                >
                  #{i + 1} · {stop.type}
                </div>
                <div style={{ fontWeight: 500, fontSize: 15, color: '#0f1729' }}>
                  {stop.name}
                </div>
                <div style={{ fontSize: 13, color: '#5a6478', marginTop: 2 }}>
                  {stop.address}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#8b94a3',
                    marginTop: 6,
                  }}
                >
                  {stop.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <DroneMarker />
      </MapContainer>

      <div
        data-testid="map-style-toggle"
        className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-md border border-hairline bg-card shadow-[0_1px_2px_rgba(15,23,41,0.08)]"
      >
        <button
          type="button"
          data-testid="map-style-map"
          onClick={() => setMapStyle('map')}
          aria-pressed={mapStyle === 'map'}
          className={
            'px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ' +
            (mapStyle === 'map'
              ? 'bg-accent text-canvas'
              : 'bg-card text-ink-soft hover:bg-card-active')
          }
        >
          Map
        </button>
        <button
          type="button"
          data-testid="map-style-satellite"
          onClick={() => setMapStyle('satellite')}
          aria-pressed={mapStyle === 'satellite'}
          className={
            'px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ' +
            (mapStyle === 'satellite'
              ? 'bg-accent text-canvas'
              : 'bg-card text-ink-soft hover:bg-card-active')
          }
        >
          Satellite
        </button>
      </div>
    </div>
  );
}
