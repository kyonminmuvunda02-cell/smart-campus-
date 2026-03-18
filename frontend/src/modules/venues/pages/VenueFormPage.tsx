import { useActionState, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import VenueLocationPicker from '@/modules/venues/components/VenueLocationPicker';

interface ActionState {
  error: string | null;
}

export default function VenueFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useDetail, create, update } = useVenue();

  const { data: venue, isLoading: loadingVenue } = useDetail(id ? Number(id) : undefined);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setLatitude(currentNumber(currentVenueValue(venue, 'latitude')));
    setLongitude(currentNumber(currentVenueValue(venue, 'longitude')));
    setRadiusMeters(currentNumber(currentVenueValue(venue, 'radius_meters')));
  }, [venue]);

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const payload = {
        venue_name: String(formData.get('venue_name')),
        building: String(formData.get('building')),
        capacity: Number(formData.get('capacity')) || 100,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        radius_meters: radiusMeters.trim() ? Number(radiusMeters) : null,
      };

      if (isEditing) {
        await update.mutateAsync({ path: { venue_id: Number(id) }, body: payload });
        showToast('success', 'Venue updated', 'Changes saved successfully.');
      } else {
        await create.mutateAsync({ body: payload });
        showToast('success', 'Venue created', 'New venue has been added.');
      }

      navigate('/venues');
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  if (loadingVenue) {
    return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading venue...</div></div>;
  }

  const currentVenue = venue as Record<string, unknown> | undefined;
  const hasCoordinates = latitude.trim() !== '' && longitude.trim() !== '';
  const mapHref = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=19/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`
    : null;
  const mapEmbedHref = hasCoordinates ? buildMapEmbedHref(Number(latitude), Number(longitude)) : null;

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoMessage('This browser cannot capture the current location for venue setup.');
      return;
    }

    setIsLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        if (!radiusMeters.trim()) {
          setRadiusMeters('45');
        }
        setGeoMessage('Current device coordinates captured. Validate the pin and save the venue.');
        setIsLocating(false);
      },
      (error) => {
        setGeoMessage(error.message || 'Location access was denied for this browser.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleMapSelection(nextLatitude: number, nextLongitude: number) {
    setLatitude(nextLatitude.toFixed(6));
    setLongitude(nextLongitude.toFixed(6));
    if (!radiusMeters.trim()) {
      setRadiusMeters('45');
    }
    setGeoMessage('Map location updated. Confirm the attendance radius and save the venue.');
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={isEditing ? 'Edit venue' : 'Create venue'}
        subtitle={isEditing ? `Refining ${String(currentVenue?.venue_name ?? '')}` : 'Register a physical space for trusted attendance capture.'}
        icon="building"
        tone="teal"
      >
        <Link to="/venues">
          <Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back to venues</Button>
        </Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Venue guidance</h3>
                <div className="section-subtle">Physical spaces must be explicit enough to support geofenced trust and reporting.</div>
              </div>
              <span className="status-pill teal"><i className="ti ti-map-pin" />Approved space</span>
            </div>

            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Venue name</span>
                <span className="detail-value">Classroom or hall identifier</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Building</span>
                <span className="detail-value">Campus location anchor</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Capacity</span>
                <span className="detail-value">Expected attendance limit</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Geofence</span>
                <span className="detail-value">Latitude, longitude, and radius required for attendance trust</span>
              </div>
            </div>
          </div>

          <div className="callout-panel teal">
            <i className="ti ti-shield-check" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Wrong venue data breaks attendance trust</div>
              <div className="callout-copy">
                Sessions depend on these spaces for physical validation. A bad record can block legitimate scans or certify the wrong room.
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Geofence capture</h3>
                <div className="section-subtle">Capture coordinates from the current device, then preview the location before saving the attendance zone.</div>
              </div>
            </div>

            <div className="coordinate-tools">
              <Button variant="outline-secondary" onClick={() => void handleUseCurrentLocation()} disabled={isLocating}>
                {isLocating ? <Spinner animation="border" size="sm" /> : <i className="ti ti-current-location" />}
                Use current location
              </Button>
              {mapHref ? (
                <a href={mapHref} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                  <i className="ti ti-map-2" />Open map preview
                </a>
              ) : null}
            </div>

            <VenueLocationPicker
              latitude={latitude.trim() ? Number(latitude) : null}
              longitude={longitude.trim() ? Number(longitude) : null}
              radiusMeters={radiusMeters.trim() ? Number(radiusMeters) : null}
              onChange={handleMapSelection}
            />

            <div className="coordinate-preview">
              <div className="coordinate-cell">
                <span className="detail-label">Latitude</span>
                <strong>{latitude || '--'}</strong>
              </div>
              <div className="coordinate-cell">
                <span className="detail-label">Longitude</span>
                <strong>{longitude || '--'}</strong>
              </div>
              <div className="coordinate-cell">
                <span className="detail-label">Radius</span>
                <strong>{radiusMeters ? `${radiusMeters} m` : '--'}</strong>
              </div>
            </div>

            {mapEmbedHref ? (
              <div className="map-embed-shell">
                <iframe
                  src={mapEmbedHref}
                  title="Venue map preview"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}

            {geoMessage ? (
              <Alert variant={mapHref ? 'info' : 'warning'} className="mb-0">
                <i className={`ti ti-${mapHref ? 'info-circle' : 'alert-triangle'} me-2`} />
                {geoMessage}
              </Alert>
            ) : null}
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>{isEditing ? 'Update venue record' : 'New venue record'}</h3>
              <div className="section-subtle">Capture the essential physical details before publishing the space.</div>
            </div>
          </div>

          <ErrorAlert error={state.error} dismissible />

          <Form action={formAction}>
            <div className="field-shell">
              <Form.Label className="field-label">Venue name</Form.Label>
              <Form.Control
                name="venue_name"
                defaultValue={currentVenue?.venue_name as string | undefined}
                required
                placeholder="e.g. Lecture Theatre 1"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Building</Form.Label>
              <Form.Control
                name="building"
                defaultValue={currentVenue?.building as string | undefined}
                placeholder="e.g. Science Block A"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Capacity</Form.Label>
              <Form.Control
                type="number"
                name="capacity"
                defaultValue={(currentVenue?.capacity as number | undefined) ?? 100}
                required
                min={1}
              />
            </div>

            <div className="session-stat-row">
              <div className="field-shell">
                <Form.Label className="field-label">Latitude</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  name="latitude"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  placeholder="-15.385"
                />
              </div>
              <div className="field-shell">
                <Form.Label className="field-label">Longitude</Form.Label>
                <Form.Control
                  type="number"
                  step="any"
                  name="longitude"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  placeholder="28.322"
                />
              </div>
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Geofence radius (meters)</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min={1}
                name="radius_meters"
                value={radiusMeters}
                onChange={(event) => setRadiusMeters(event.target.value)}
                placeholder="45"
              />
              <Form.Range
                min={10}
                max={150}
                step={5}
                value={radiusMeters.trim() ? Number(radiusMeters) : 45}
                onChange={(event) => setRadiusMeters(event.target.value)}
                className="mt-3"
              />
            </div>

            <Alert variant="info" className="mb-0">
              <i className="ti ti-map-pin-share me-2" />
              Attendance sessions can only be scheduled against venues with a complete geofence.
            </Alert>

            <div className="ph-actions" style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? <Spinner animation="border" size="sm" /> : <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'}`} />}
                {isEditing ? 'Save changes' : 'Create venue'}
              </Button>
              <Link to="/venues">
                <Button variant="outline-secondary">Cancel</Button>
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

function currentVenueValue(venue: unknown, key: string) {
  return (venue as Record<string, unknown> | undefined)?.[key];
}

function currentNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

function buildMapEmbedHref(latitude: number, longitude: number) {
  const latDelta = 0.0018;
  const lngDelta = 0.0018;
  const bbox = [
    longitude - lngDelta,
    latitude - latDelta,
    longitude + lngDelta,
    latitude + latDelta,
  ].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
}
