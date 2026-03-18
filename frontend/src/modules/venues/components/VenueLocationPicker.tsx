import { useEffect, useRef } from 'react';
import L from 'leaflet';

const CAMPUS_CENTER: [number, number] = [-15.3875, 28.3228];

interface VenueLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

export default function VenueLocationPicker({
  latitude,
  longitude,
  radiusMeters,
  onChange,
}: VenueLocationPickerProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerCircleRef = useRef<L.Circle | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const center: [number, number] =
      latitude !== null && longitude !== null ? [latitude, longitude] : CAMPUS_CENTER;
    const map = L.map(mapElementRef.current, {
      center,
      zoom: 18,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      onChange(event.latlng.lat, event.latlng.lng);
    });

    mapInstanceRef.current = map;

    window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerCircleRef.current = null;
      radiusCircleRef.current = null;
    };
  }, [latitude, longitude, onChange]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const effectiveCenter: [number, number] =
      latitude !== null && longitude !== null ? [latitude, longitude] : CAMPUS_CENTER;
    const effectiveRadius = radiusMeters && radiusMeters > 0 ? radiusMeters : 45;

    map.setView(effectiveCenter, map.getZoom(), { animate: false });

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }
    if (markerCircleRef.current) {
      markerCircleRef.current.remove();
    }

    if (latitude !== null && longitude !== null) {
      radiusCircleRef.current = L.circle(effectiveCenter, {
        radius: effectiveRadius,
        color: '#0f9ed5',
        weight: 2,
        fillColor: '#84d9ff',
        fillOpacity: 0.28,
      }).addTo(map);

      markerCircleRef.current = L.circle(effectiveCenter, {
        radius: 4,
        color: '#0f3f88',
        weight: 3,
        fillColor: '#ffffff',
        fillOpacity: 1,
      }).addTo(map);
    }
  }, [latitude, longitude, radiusMeters]);

  return (
    <div className="venue-map-picker">
      <div ref={mapElementRef} className="venue-map-canvas" />
      <div className="venue-map-caption">
        Tap the map to place the venue center. The shaded circle shows the current attendance radius.
      </div>
    </div>
  );
}
