import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useVenue } from '../hooks/useVenue';

type CapacityFilter = 'All' | 'Small' | 'Medium' | 'Large';

function getCapacityBand(capacity: number) {
  if (capacity >= 150) return 'Large';
  if (capacity >= 60) return 'Medium';
  return 'Small';
}

export default function VenueListPage() {
  const [search, setSearch] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('All');
  const { useList } = useVenue();
  const { data, isLoading } = useList();

  const venues = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const filteredVenues = venues.filter((venue) => {
    const term = search.trim().toLowerCase();
    const name = String(venue.venue_name ?? '').toLowerCase();
    const building = String(venue.building ?? '').toLowerCase();
    const capacity = Number(venue.capacity ?? 0);
    const matchesSearch = !term || name.includes(term) || building.includes(term) || String(venue.venue_id ?? '').includes(term);
    const matchesCapacity = capacityFilter === 'All' || getCapacityBand(capacity) === capacityFilter;
    return matchesSearch && matchesCapacity;
  });

  const totalCapacity = venues.reduce((sum, venue) => sum + Number(venue.capacity ?? 0), 0);
  const largeVenueCount = venues.filter((venue) => getCapacityBand(Number(venue.capacity ?? 0)) === 'Large').length;
  const largestVenue = venues.reduce((largest, venue) => {
    const capacity = Number(venue.capacity ?? 0);
    if (!largest || capacity > largest.capacity) {
      return { name: String(venue.venue_name ?? '-'), capacity };
    }
    return largest;
  }, null as { name: string; capacity: number } | null);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Venue control"
        subtitle="Maintain the physical spaces where attendance can be legitimately captured and monitored."
        icon="building"
        tone="teal"
      >
        <Link to="/venues/new"><Button variant="primary"><i className="ti ti-plus" />Add venue</Button></Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Venue filters</h3>
                <div className="section-subtle">Find buildings and rooms by name, location, or capacity profile.</div>
              </div>
              <span className="status-pill teal"><i className="ti ti-map-pin" />Physical scope</span>
            </div>

            <div className="field-shell" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="venueSearch" className="field-label">Search venue or building</label>
              <div className="field-wrap">
                <i className="ti ti-search" />
                <input
                  id="venueSearch"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="e.g. LT-1 or Main Building"
                />
              </div>
            </div>

            <div className="field-shell" style={{ marginBottom: 0 }}>
              <label className="field-label">Capacity band</label>
              <div className="segmented-filter">
                {(['All', 'Small', 'Medium', 'Large'] as const).map((band) => (
                  <button
                    key={band}
                    type="button"
                    className={capacityFilter === band ? 'active' : ''}
                    onClick={() => setCapacityFilter(band)}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Venue footprint</h3>
                <div className="section-subtle">Capacity and estate coverage across approved spaces</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Total venues</label>
                <strong>{venues.length}</strong>
              </div>
              <div className="session-stat">
                <label>Total capacity</label>
                <strong>{totalCapacity}</strong>
              </div>
              <div className="session-stat">
                <label>Large venues</label>
                <strong>{largeVenueCount}</strong>
              </div>
            </div>
            <div className="callout-panel teal" style={{ marginTop: '0.9rem' }}>
              <i className="ti ti-building-bank" style={{ color: 'var(--teal)' }} />
              <div>
                <div className="callout-title">Largest space on file</div>
                <div className="callout-copy">
                  {largestVenue ? `${largestVenue.name} holds up to ${largestVenue.capacity} attendees.` : 'No venue capacity data is available yet.'}
                </div>
              </div>
            </div>
          </div>

          <div className="callout-panel teal">
            <i className="ti ti-shield-check" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Venue trust is attendance trust</div>
              <div className="callout-copy">
                If spaces are wrong or outdated, geofenced check-ins will either fail legitimate students or validate the wrong physical context.
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Venue records</h3>
              <div className="section-subtle">Showing {filteredVenues.length} of {venues.length} approved spaces under the current filter scope</div>
            </div>
            <span className="status-pill teal"><i className="ti ti-building" />{capacityFilter}</span>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={6} columns={5} />
          ) : venues.length === 0 ? (
            <EmptyState icon="ti-building-off" title="No venues yet" message="Add approved teaching spaces before sessions start relying on venue validation.">
              <Link to="/venues/new"><Button variant="primary">Add venue</Button></Link>
            </EmptyState>
          ) : filteredVenues.length === 0 ? (
            <EmptyState icon="ti-filter-off" title="No matching venues" message="Try a broader search or a different capacity band." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>Building</th>
                    <th>Capacity</th>
                    <th>Scale</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((venue) => {
                    const capacity = Number(venue.capacity ?? 0);
                    const band = getCapacityBand(capacity);
                    return (
                      <tr key={venue.venue_id as number}>
                        <td>
                          <div className="entity-copy">
                            <strong>{String(venue.venue_name ?? 'Unnamed venue')}</strong>
                            <span>Venue ID #{String(venue.venue_id ?? '-')}</span>
                          </div>
                        </td>
                        <td className="text-secondary">{String(venue.building ?? '-')}</td>
                        <td className="mono">{capacity || '-'}</td>
                        <td>
                          <span className={`status-pill ${band === 'Large' ? 'amber' : band === 'Medium' ? 'teal' : 'royal'}`}>
                            <i className={`ti ti-${band === 'Large' ? 'arrows-maximize' : band === 'Medium' ? 'layout-grid' : 'square-rounded'}`} />
                            {band}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="table-actions">
                            <Link to={`/venues/${venue.venue_id}`}><Button variant="outline-primary" size="sm"><i className="ti ti-eye" />View</Button></Link>
                            <Link to={`/venues/${venue.venue_id}/edit`}><Button variant="outline-secondary" size="sm"><i className="ti ti-edit" />Edit</Button></Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
