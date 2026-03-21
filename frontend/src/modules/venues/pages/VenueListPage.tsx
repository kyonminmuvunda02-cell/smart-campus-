import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Table } from 'react-bootstrap';
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

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

  const totalPages = Math.max(1, Math.ceil(filteredVenues.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedVenues = filteredVenues.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, capacityFilter]);

  const totalCapacity = venues.reduce((sum, venue) => sum + Number(venue.capacity ?? 0), 0);
  const geofencedVenues = venues.filter((venue) => [venue.latitude, venue.longitude, venue.radius_meters].every((value) => value !== null && value !== undefined)).length;

  return (
    <div>
      <PageHeader
        title="Venue Inventory"
        subtitle="Maintain the physical campus footprint to ensure trusted location-based attendance capture."
        icon="building"
        tone="teal"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Venues' }]}
      >
        <Link to="/venues/new">
          <Button variant="primary">
            <i className="ti ti-plus" />
            Add Venue
          </Button>
        </Link>
      </PageHeader>

      <div className="stack gap-4">
        {/* Stat Cards Section */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-teal-lt text-teal p-2 fs-3 rounded-3">
                <i className="ti ti-building" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Total Spaces</span>
                <strong className="h4 mb-0 d-block">{venues.length}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
                <i className="ti ti-users" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Total Capacity</span>
                <strong className="h4 mb-0 d-block">{totalCapacity}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="surface-card p-3 shadow-sm border-0 bg-teal text-white d-flex align-items-center justify-content-between">
              <div>
                <span className="small fw-bold uppercase opacity-75">Geofence Coverage</span>
                <p className="mb-0 small">{geofencedVenues} of {venues.length} venues have active GPS coordinates for verification.</p>
              </div>
              <i className="ti ti-map-pin fs-1 opacity-25" />
            </div>
          </div>
        </div>

        <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
          <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light-subtle">
            <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: '600px' }}>
              <div className="field-shell mb-0 flex-grow-1">
                <div className="field-wrap py-1">
                  <i className="ti ti-search" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search venue or building..."
                    className="form-control-sm border-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="segmented-filter sm">
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
            <div className="text-secondary small fw-medium">
              {filteredVenues.length} Venues Listed
            </div>
          </div>

          {isLoading ? (
            <div className="p-4"><LoadingSkeleton rows={10} columns={5} /></div>
          ) : venues.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="ti-building-off" title="No Venues Yet" message="Add campus buildings and classrooms to enable session scheduling.">
                <Link to="/venues/new"><Button variant="primary">Add Venue</Button></Link>
              </EmptyState>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle">
                  <tr>
                    <th className="ps-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Venue Identity</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Building Context</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider text-center">Capacity</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider text-center">Geofence</th>
                    <th className="text-end pe-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {paginatedVenues.map((v) => {
                    const capacity = Number(v.capacity ?? 0);
                    const band = getCapacityBand(capacity);
                    const isGeofenced = [v.latitude, v.longitude, v.radius_meters].every(val => val !== null && val !== undefined);
                    
                    return (
                      <tr key={v.venue_id as number}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`sb-avatar ${band === 'Large' ? 'bg-amber-lt text-amber' : band === 'Medium' ? 'bg-teal-lt text-teal' : 'bg-royal-lt text-royal'} small fw-bold`}>
                              {String(v.venue_name ?? '??').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="entity-copy">
                              <strong className="text-navy">{String(v.venue_name ?? 'Unnamed')}</strong>
                              <span className="smaller text-muted">ID: {String(v.venue_id ?? '-')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-secondary small fw-medium">{String(v.building ?? 'Main Campus')}</span>
                        </td>
                        <td className="py-3 text-center mono small text-navy fw-bold">
                          {capacity}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`status-pill ${isGeofenced ? 'green' : 'amber'}`}>
                            <i className={`ti ti-${isGeofenced ? 'map-pin-check' : 'map-pin-question'}`} />
                            {isGeofenced ? 'Verified' : 'Incomplete'}
                          </span>
                        </td>
                        <td className="text-end pe-4 py-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <Link to={`/venues/${v.venue_id}`}>
                              <Button variant="outline-secondary" size="sm" className="border-0 shadow-none">
                                <i className="ti ti-eye fs-5" />
                              </Button>
                            </Link>
                            <Link to={`/venues/${v.venue_id}/edit`}>
                              <Button variant="outline-secondary" size="sm" className="border-0 shadow-none">
                                <i className="ti ti-edit fs-5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {filteredVenues.length > pageSize && (
            <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between bg-light-subtle">
              <div className="text-secondary small fw-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="d-flex gap-2">
                <Button variant="white" size="sm" className="border shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <i className="ti ti-chevron-left" />
                </Button>
                <Button variant="white" size="sm" className="border shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <i className="ti ti-chevron-right" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
