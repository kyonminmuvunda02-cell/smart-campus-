import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Table } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useSession } from '../hooks/useSession';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { buildLookupMap, getCourseDisplayName, getVenueDisplayName } from '@/utils/entityLabels';

function getSessionState(session: Record<string, unknown>) {
  const isActive = Boolean(session.is_active);
  if (isActive) return { label: 'Live', tone: 'green', icon: 'broadcast' };

  const sessionStart = session.session_start ? new Date(session.session_start as string).getTime() : 0;
  if (sessionStart > Date.now()) return { label: 'Scheduled', tone: 'royal', icon: 'calendar-event' };

  return { label: 'Closed', tone: 'red', icon: 'lock' };
}

export default function SessionListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { useList } = useSession();
  const { useList: useCourseList } = useCourse();
  const { useList: useVenueList } = useVenue();
  
  const { data, isLoading } = useList();
  const { data: coursesData } = useCourseList({ query: { limit: 500 } });
  const { data: venuesData } = useVenueList({ query: { limit: 500 } });
  
  const sessions = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const courseItems = (coursesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const venueItems = (venuesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  
  const courseLookup = buildLookupMap(courseItems, 'course_id', (course) => getCourseDisplayName(course, course.course_id as number));
  const venueLookup = buildLookupMap(venueItems, 'venue_id', (venue) => getVenueDisplayName(venue, venue.venue_id as number));

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedSessions = sessions.slice(pageStart, pageStart + pageSize);

  const liveCount = sessions.filter(s => s.is_active).length;

  return (
    <div>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Manage live teaching windows and historical attendance data for all academic units."
        icon="calendar-event"
        tone="teal"
        breadcrumbs={[{ label: 'Teaching Ops' }, { label: 'Sessions' }]}
      >
        <Link to="/sessions/new">
          <Button variant="primary">
            <i className="ti ti-plus" />
            Schedule Session
          </Button>
        </Link>
      </PageHeader>

      <div className="stack gap-4">
        {/* Stat Cards Section */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-teal-lt text-teal p-2 fs-3 rounded-3">
                <i className="ti ti-broadcast" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Live Now</span>
                <strong className="h4 mb-0 d-block">{liveCount}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
                <i className="ti ti-calendar-event" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Scheduled</span>
                <strong className="h4 mb-0 d-block">{sessions.filter(s => getSessionState(s).label === 'Scheduled').length}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="surface-card p-3 shadow-sm border-0 bg-teal text-white d-flex align-items-center justify-content-between">
              <div>
                <span className="small fw-bold uppercase opacity-75">Operational Integrity</span>
                <p className="mb-0 small">Attendance data is cryptographically bound to the session QR and your venue's geofence.</p>
              </div>
              <i className="ti ti-shield-check fs-1 opacity-25" />
            </div>
          </div>
        </div>

        <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
          <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light-subtle">
            <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Session Registry</h3>
            <div className="text-secondary small fw-medium">
              {sessions.length} Total Sessions
            </div>
          </div>

          {isLoading ? (
            <div className="p-4"><LoadingSkeleton rows={10} columns={6} /></div>
          ) : sessions.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="ti-calendar-off" title="No Sessions Found" message="Schedule your first session to begin tracking attendance.">
                <Link to="/sessions/new"><Button variant="primary">Schedule Session</Button></Link>
              </EmptyState>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle">
                  <tr>
                    <th className="ps-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Session</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Course & Venue</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Academic Period</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Status</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Start Time</th>
                    <th className="text-end pe-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {paginatedSessions.map((s) => {
                    const state = getSessionState(s);
                    const courseName = String(courseLookup.get(s.course_id as number) ?? `Course #${String(s.course_id)}`);
                    const venueName = String(venueLookup.get(s.venue_id as number) ?? `Venue #${String(s.venue_id)}`);
                    
                    return (
                      <tr key={s.session_id as number}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`sb-avatar ${state.label === 'Live' ? 'bg-green-lt text-green' : 'bg-light text-secondary'} small fw-bold`}>
                              #{String(s.session_id)}
                            </div>
                            <div className="entity-copy">
                              <strong className="text-navy">{String(s.session_type ?? 'Lecture')}</strong>
                              <span className="smaller text-muted">ID: {String(s.session_id)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="entity-copy">
                            <strong className="small text-navy">{courseName}</strong>
                            <span className="smaller text-secondary"><i className="ti ti-map-pin me-1" />{venueName}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="entity-copy">
                            <strong className="small text-navy">{String(s.semester ?? 'Current Semester')}</strong>
                            <span className="smaller text-secondary">{String(s.academic_year ?? 'Current Year')}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`status-pill ${state.tone}`}>
                            <i className={`ti ti-${state.icon}`} />
                            {state.label}
                          </span>
                        </td>
                        <td className="py-3 text-secondary smaller">
                          {s.session_start ? new Date(s.session_start as string).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </td>
                        <td className="text-end pe-4 py-3">
                          <Link to={`/sessions/${s.session_id}`}>
                            <Button variant="outline-secondary" size="sm" className="border-0 shadow-none">
                              <i className="ti ti-eye fs-5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {sessions.length > pageSize && (
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
