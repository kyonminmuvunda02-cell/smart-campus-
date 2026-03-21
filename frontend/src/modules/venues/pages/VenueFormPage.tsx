import { useActionState, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Button, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import VenueLocationPicker from '@/modules/venues/components/VenueLocationPicker';

interface ActionState {
  error: string | null;
}

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="field-label mb-1 d-flex align-items-center gap-1">
      <span>{label}</span>
      <OverlayTrigger placement="top" overlay={<Tooltip>{tooltip}</Tooltip>}>
        <i className="ti ti-info-circle text-royal small" style={{ cursor: 'pointer' }} />
      </OverlayTrigger>
    </div>
  );
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
    if (venue) {
      setLatitude(String((venue as any).latitude ?? ''));
      setLongitude(String((venue as any).longitude ?? ''));
      setRadiusMeters(String((venue as any).radius_meters ?? ''));
    }
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
        showToast('success', 'Venue Updated', 'Physical footprint record has been updated.');
      } else {
        await create.mutateAsync({ body: payload });
        showToast('success', 'Venue Created', 'A new teaching space has been registered.');
      }

      navigate('/venues');
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  if (loadingVenue) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;

  const currentVenue = venue as Record<string, any> | undefined;

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation not supported.');
      return;
    }
    setIsLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        if (!radiusMeters) setRadiusMeters('45');
        setGeoMessage('Coordinates captured from your device.');
        setIsLocating(false);
      },
      (err) => {
        setGeoMessage(err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="stack gap-4">
      <PageHeader
        title={isEditing ? 'Edit Venue Record' : 'Register New Venue'}
        subtitle="Establish physical campus coordinates to anchor trusted attendance scan events."
        icon="building"
        tone="teal"
        breadcrumbs={[
          { label: 'Administration', path: '/venues' },
          { label: 'Venues', path: '/venues' },
          { label: isEditing ? 'Edit' : 'Create' }
        ]}
      >
        <Link to="/venues"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
      </PageHeader>

      <div className="surface-card p-4 shadow-sm border-0">
            <ErrorAlert error={state.error} dismissible />
            
            <Form action={formAction}>
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="field-shell">
                    <LabelWithTooltip label="Venue Name" tooltip="Room identifier recognized by staff/students." />
                    <Form.Control name="venue_name" defaultValue={currentVenue?.venue_name} required placeholder="e.g. LT-1" className="py-2" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="field-shell">
                    <LabelWithTooltip label="Building Context" tooltip="Campus building or block name." />
                    <Form.Control name="building" defaultValue={currentVenue?.building} placeholder="e.g. Science Block" className="py-2" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="field-shell">
                    <LabelWithTooltip label="Venue Capacity" tooltip="Max occupancy for room scale reporting." />
                    <Form.Control type="number" name="capacity" defaultValue={currentVenue?.capacity || 100} required className="py-2" />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="field-shell h-100 d-flex align-items-end">
                    <Button variant="outline-teal" className="w-100 py-2 border-dashed" onClick={() => void handleUseCurrentLocation()} disabled={isLocating}>
                      {isLocating ? <Spinner size="sm" /> : <i className="ti ti-current-location me-2" />}
                      Capture Device Coordinates
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-light-subtle rounded-3 p-3 border mb-4">
                <h4 className="h6 fw-bold uppercase tracking-wider text-secondary mb-3"><i className="ti ti-map-pin me-2 text-teal" />Geofence Definition</h4>
                
                <VenueLocationPicker
                  latitude={latitude ? Number(latitude) : null}
                  longitude={longitude ? Number(longitude) : null}
                  radiusMeters={radiusMeters ? Number(radiusMeters) : null}
                  onChange={(lat, lng) => {
                    setLatitude(lat.toFixed(6));
                    setLongitude(lng.toFixed(6));
                    if (!radiusMeters) setRadiusMeters('45');
                  }}
                />

                <div className="row g-3 mt-3">
                  <div className="col-md-4">
                    <div className="field-shell">
                      <label className="small fw-bold text-secondary">Latitude</label>
                      <Form.Control value={latitude} onChange={e => setLatitude(e.target.value)} step="any" type="number" className="mono small h-auto py-2" />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="field-shell">
                      <label className="small fw-bold text-secondary">Longitude</label>
                      <Form.Control value={longitude} onChange={e => setLongitude(e.target.value)} step="any" type="number" className="mono small h-auto py-2" />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="field-shell">
                      <label className="small fw-bold text-secondary">Radius (m)</label>
                      <Form.Control value={radiusMeters} onChange={e => setRadiusMeters(e.target.value)} step="any" type="number" className="mono small h-auto py-2" />
                    </div>
                  </div>
                </div>

                {geoMessage && <div className="mt-3 small text-amber fw-bold"><i className="ti ti-alert-circle me-1" />{geoMessage}</div>}
              </div>

              <div className="callout-panel teal mb-4">
               <i className="ti ti-shield-check fs-4" />
                <div className="small">
                  Ensure the map pin is centered on the actual teaching space. Geofence radius affects attendance trust thresholds.
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={isPending} className="px-4 fw-bold">
                  {isPending ? <Spinner size="sm" /> : <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'} me-2`} />}
                  {isEditing ? 'Save Configuration' : 'Establish Venue'}
                </Button>
                <Link to="/venues"><Button variant="outline-secondary">Discard</Button></Link>
              </div>
            </Form>
      </div>
    </div>
  );
}
