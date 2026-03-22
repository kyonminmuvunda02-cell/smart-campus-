import { FormEvent, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const CAMPUS_CENTER: [number, number] = [-15.3875, 28.3228];
const DEFAULT_RADIUS = 45;

interface LocationSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerCircleRef = useRef<L.Circle | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const center: [number, number] =
      latitude !== null && longitude !== null ? [latitude, longitude] : CAMPUS_CENTER;
    // Initialize Leaflet once, then drive marker/radius updates from the separate effect below.
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
      abortControllerRef.current?.abort();
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
    const effectiveRadius = radiusMeters && radiusMeters > 0 ? radiusMeters : DEFAULT_RADIUS;

    map.setView(effectiveCenter, map.getZoom(), { animate: false });

    // Redraw the circles instead of mutating them in place so radius/position changes stay in sync.
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

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError('Enter a place, building, or address to search.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        limit: '5',
        addressdetails: '1',
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error('Location search failed. Try again in a moment.');
      }

      const results = (await response.json()) as LocationSearchResult[];
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('No matching locations found. Try a broader search term.');
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setSearchResults([]);
      setSearchError(error instanceof Error ? error.message : 'Location search failed.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsSearching(false);
    }
  }

  function handleSelectResult(result: LocationSearchResult) {
    const nextLatitude = Number(result.lat);
    const nextLongitude = Number(result.lon);
    onChange(nextLatitude, nextLongitude);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setSearchError(null);
  }

  return (
    <div className="venue-map-picker">
      <div className="venue-map-search-shell">
        <form className="venue-map-search-form" onSubmit={(event) => void handleSearch(event)}>
          <div className="venue-map-search-input-wrap">
            <i className="ti ti-search" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for a campus building, landmark, or address"
              aria-label="Search for venue location"
            />
          </div>
          <button type="submit" className="btn btn-outline-secondary" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search location'}
          </button>
        </form>

        {searchResults.length > 0 ? (
          <div className="venue-map-search-results">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="venue-map-search-result"
                onClick={() => handleSelectResult(result)}
              >
                <span className="venue-map-search-result-title">{result.display_name}</span>
                <span className="venue-map-search-result-meta">
                  {result.type ? result.type.replaceAll('_', ' ') : 'OpenStreetMap match'}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {searchError ? (
          <div className="venue-map-search-feedback error">
            <i className="ti ti-alert-circle" />
            <span>{searchError}</span>
          </div>
        ) : null}

        <div className="venue-map-search-feedback muted">
          <i className="ti ti-map-search" />
          <span>Search is manual, then click a result to move the pin and geofence.</span>
        </div>
      </div>

      <div ref={mapElementRef} className="venue-map-canvas" />
      <div className="venue-map-caption">
        Search for a place or tap the map to place the venue center. The shaded circle shows the current attendance radius.
      </div>
    </div>
  );
}
