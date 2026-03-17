import { useParams, Link } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useVenue } from '../hooks/useVenue';

export default function VenueViewPage() {
  const { id } = useParams<{ id: string }>();
  const { useDetail } = useVenue();
  const { data: venue, isLoading } = useDetail(id ? Number(id) : undefined);

  if (isLoading) return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading venue...</div></div>;
  if (!venue) return <div className="empty-panel"><i className="ti ti-mood-empty" /><div>Venue not found.</div></div>;

  const currentVenue = venue as Record<string, unknown>;
  const capacity = Number(currentVenue.capacity ?? 0);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={String(currentVenue.venue_name ?? 'Venue')}
        subtitle="Physical attendance zone metadata"
        icon="building"
        tone="teal"
      >
        <Link to="/venues"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        <Link to={`/venues/${id}/edit`}><Button variant="primary"><i className="ti ti-edit" />Edit</Button></Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Venue snapshot</h3>
                <div className="section-subtle">Operational details for the approved teaching space</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Venue ID</label>
                <strong>{String(currentVenue.venue_id ?? '-')}</strong>
              </div>
              <div className="session-stat">
                <label>Capacity</label>
                <strong>{capacity || '-'}</strong>
              </div>
              <div className="session-stat">
                <label>Status</label>
                <strong>Approved</strong>
              </div>
            </div>
          </div>

          <div className="callout-panel teal">
            <i className="ti ti-map-pin" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Space quality affects scan confidence</div>
              <div className="callout-copy">
                Accurate building and capacity data helps lecturers and administrators trust attendance events tied to this room.
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Venue details</h3>
              <div className="section-subtle">Physical context stored for this attendance-enabled space</div>
            </div>
          </div>

          <div className="detail-list">
            <div className="detail-row">
              <span className="detail-label">Venue name</span>
              <span className="detail-value">{String(currentVenue.venue_name ?? '-')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Building</span>
              <span className="detail-value">{String(currentVenue.building ?? '-')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Capacity</span>
              <span className="detail-value mono">{capacity || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
