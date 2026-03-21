import { useParams, Link } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useVenue } from '../hooks/useVenue';

export default function VenueViewPage() {
  const { id } = useParams<{ id: string }>();
  const { useDetail } = useVenue();
  const { data: venue, isLoading } = useDetail(id ? Number(id) : undefined);

  if (isLoading) return <div className="p-4">Loading venue...</div>;
  if (!venue) return <div className="p-5">Venue not found.</div>;

  const v = venue as Record<string, any>;
  const hasGeofence = [v.latitude, v.longitude, v.radius_meters].every(val => val !== null && val !== undefined);
  
  const mapEmbedHref = hasGeofence ? buildMapEmbedHref(Number(v.latitude), Number(v.longitude)) : null;

  return (
    <div>
      <PageHeader
        title={String(v.venue_name ?? 'Physical Space')}
        subtitle={`${v.building ?? 'Main Campus'} • Capacity: ${v.capacity ?? 'Unknown'}`}
        icon="building"
        tone="teal"
        breadcrumbs={[
          { label: 'Administration', path: '/venues' },
          { label: 'Venues', path: '/venues' },
          { label: String(v.venue_name ?? 'Detail') }
        ]}
      >
        <Link to="/venues"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        <Link to={`/venues/${id}/edit`}><Button variant="primary"><i className="ti ti-edit" />Edit Space</Button></Link>
      </PageHeader>

      <div className="stack gap-4">
        {/* Stat Cards Section */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-teal-lt text-teal p-2 fs-3 rounded-3">
                <i className="ti ti-users" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Max Occupancy</span>
                <strong className="h4 mb-0 d-block">{v.capacity || '???'}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
                <i className="ti ti-map-pin" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Geofence</span>
                <strong className="h4 mb-0 d-block">{hasGeofence ? `${v.radius_meters}m` : 'Unset'}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="surface-card p-3 shadow-sm border-0 bg-navy text-white d-flex align-items-center justify-content-between">
              <div>
                <span className="small fw-bold uppercase opacity-75">Spatial Trust</span>
                <p className="mb-0 small">This venue is an approved teaching space with {hasGeofence ? 'active geofence protection.' : 'pending location data.'}</p>
              </div>
              <i className="ti ti-shield-check fs-1 opacity-25" />
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-7">
            <div className="surface-card pb-1">
              <h3 className="h6 mb-4 fw-bold uppercase tracking-wider text-secondary border-bottom pb-2">Space Configuration</h3>
              
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary small fw-bold">Venue Name</span>
                  <span className="text-navy fw-bold">{v.venue_name}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary small fw-bold">Building / Block</span>
                  <span className="text-navy fw-bold">{v.building || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary small fw-bold">System ID</span>
                  <span className="mono small text-secondary">VEN-{String(v.venue_id).padStart(4, '0')}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary small fw-bold">Latitude</span>
                  <span className="mono small text-secondary">{v.latitude || '-'}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary small fw-bold">Longitude</span>
                  <span className="mono small text-secondary">{v.longitude || '-'}</span>
                </div>
              </div>

              <div className="callout-panel teal mt-4">
                <i className="ti ti-info-circle fs-4" />
                <div className="small">
                  Attendance records are automatically flagged if student location falls outside the {v.radius_meters || 45}m radius of this center point.
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-5">
            <div className="surface-card h-100 p-0 overflow-hidden shadow-sm border-0 bg-light">
              {mapEmbedHref ? (
                <iframe
                  src={mapEmbedHref}
                  title="Venue location map"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  loading="lazy"
                />
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-center opacity-50">
                  <i className="ti ti-map-off fs-1 mb-3" />
                  <p className="mb-0 small fw-bold">No Geofence Data</p>
                  <p className="smaller text-secondary">Add coordinates to enable map view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildMapEmbedHref(latitude: number, longitude: number) {
  const delta = 0.0015;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`;
}
