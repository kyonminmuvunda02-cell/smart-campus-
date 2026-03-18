import { useQuery } from '@tanstack/react-query';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import { getActiveDigitalIdOptions } from '@/client/@tanstack/react-query.gen';
import type { GetActiveDigitalIdData, Options } from '@/client';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageHeader from '@/components/common/PageHeader';
import { useAttendanceReview } from '@/modules/attendance/hooks/useAttendanceReview';
import { useAttendance } from '@/modules/attendance/hooks/useAttendance';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useAudit } from '@/modules/audit/hooks/useAudit';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useEnrollment } from '@/modules/enrollment/hooks/useEnrollment';
import { useSession } from '@/modules/sessions/hooks/useSession';
import { useTimetable } from '@/modules/timetable/hooks/useTimetable';
import { useUser } from '@/modules/users/hooks/useUser';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import {
  buildLookupMap,
  getCourseDisplayName,
  getStudentDisplayName,
  getUserDisplayName,
  getVenueDisplayName,
} from '@/utils/entityLabels';

type EntityRecord = Record<string, unknown>;

function formatDateTime(value: unknown) {
  if (!value) return 'No timestamp';
  return new Date(String(value)).toLocaleString();
}

function formatDate(value: unknown) {
  if (!value) return 'Not set';
  return new Date(String(value)).toLocaleDateString();
}

function MetricCard({
  tone,
  icon,
  pill,
  value,
  label,
  meta,
}: {
  tone: 'royal' | 'green' | 'amber' | 'teal' | 'purple';
  icon: string;
  pill: string;
  value: string | number;
  label: string;
  meta: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-head">
        <div className={`metric-icon ${tone}`}><i className={`ti ti-${icon}`} /></div>
        <span className={`status-pill ${tone}`}>{pill}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-meta">{meta}</div>
    </div>
  );
}

function StudentDashboard({ userId }: { userId: number }) {
  const { useStudentRecords } = useAttendance();
  const { useStudentEnrollments } = useEnrollment();
  const { useList: useCourseList } = useCourse();
  const { useList: useSessionList } = useSession();
  const { data: recordsData, isLoading: recordsLoading } = useStudentRecords(userId);
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useStudentEnrollments(userId);
  const { data: coursesData, isLoading: coursesLoading } = useCourseList({ query: { limit: 500 } });
  const { data: sessionsData, isLoading: sessionsLoading } = useSessionList({ query: { limit: 200 } });
  const { data: digitalId, isLoading: digitalIdLoading } = useQuery({
    ...getActiveDigitalIdOptions({ path: { student_id: userId } } as Options<GetActiveDigitalIdData>),
    enabled: !!userId,
  });

  const records = (recordsData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const enrollments = (enrollmentsData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const courses = (coursesData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const sessions = (sessionsData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const courseLookup = buildLookupMap(courses, 'course_id', (course) => getCourseDisplayName(course, course.course_id as number));
  const sessionLookup = new Map<number, EntityRecord>();
  sessions.forEach((session) => {
    sessionLookup.set(Number(session.session_id), session);
  });
  const verifiedRecords = records.filter((record) => !Boolean(record.fraud_flag) && String(record.verification_status ?? '') === 'Verified');
  const flaggedRecords = records.filter((record) => Boolean(record.fraud_flag) || String(record.verification_status ?? '') !== 'Verified');
  const enrolledCourses = enrollments.filter((enrollment) => String(enrollment.enrollment_status ?? '') === 'Enrolled');
  const recordCoverage = records.length ? `${Math.round((verifiedRecords.length / records.length) * 100)}%` : '0%';
  const latestRecords = [...records].sort((a, b) => {
    const aTime = new Date(String(a.checked_in_at ?? 0)).getTime();
    const bTime = new Date(String(b.checked_in_at ?? 0)).getTime();
    return bTime - aTime;
  }).slice(0, 4);

  if (recordsLoading || enrollmentsLoading || coursesLoading || sessionsLoading || digitalIdLoading) {
    return <LoadingSkeleton rows={8} columns={4} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Student workspace"
        title="Attendance at a glance"
        subtitle="Track verified check-ins, digital identity status, and active course registrations from one surface."
        icon="layout-dashboard"
        tone="royal"
      >
        <Link to="/checkin"><Button variant="primary"><i className="ti ti-qrcode" />Scan QR</Button></Link>
        <Link to="/my-attendance"><Button variant="outline-secondary"><i className="ti ti-calendar-check" />History</Button></Link>
      </PageHeader>

      <div className="stat-grid">
        <MetricCard tone="royal" icon="clipboard-check" pill="Attendance" value={records.length} label="Attendance records" meta="Every successful classroom submission stored against your identity." />
        <MetricCard tone="green" icon="circle-check" pill={recordCoverage} value={verifiedRecords.length} label="Verified check-ins" meta="Records that cleared geofence, QR, and device trust checks." />
        <MetricCard tone="amber" icon="alert-triangle" pill={flaggedRecords.length ? 'Needs review' : 'Clear'} value={flaggedRecords.length} label="Flagged records" meta="Pending or low-confidence scans that still need a lecturer decision." />
        <MetricCard tone="teal" icon="books" pill="Academic load" value={enrolledCourses.length} label="Active enrollments" meta="Courses where you are currently enrolled for attendance tracking." />
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Recent attendance evidence</h3>
                <div className="section-subtle">Latest recorded check-ins tied to your student account</div>
              </div>
              <span className="status-pill green"><i className="ti ti-history" />Live history</span>
            </div>

            {latestRecords.length === 0 ? (
              <EmptyState icon="ti-calendar-off" title="No attendance records yet" message="Once you scan a live classroom QR, the result will appear here immediately." />
            ) : (
              <div className="table-shell">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Checked in</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestRecords.map((record) => (
                      <tr key={Number(record.attendance_id)}>
                        <td className="fw-semibold">
                          {(() => {
                            const session = sessionLookup.get(Number(record.session_id));
                            if (!session) return `Session #${String(record.session_id ?? '-')}`;
                            return `${String(session.session_type ?? 'Session')} - ${courseLookup.get(Number(session.course_id)) ?? `Course #${String(session.course_id ?? '-')}`}`;
                          })()}
                        </td>
                        <td className="text-secondary small">{formatDateTime(record.checked_in_at)}</td>
                        <td>
                          <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                            <i className={`ti ti-${record.fraud_flag ? 'alert-triangle' : 'circle-check'}`} />
                            {record.fraud_flag ? 'Flagged' : 'Verified'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Current enrollments</h3>
                <div className="section-subtle">Academic periods your attendance currently depends on</div>
              </div>
            </div>
            {enrolledCourses.length === 0 ? (
              <EmptyState icon="ti-book-off" title="No active enrollments" message="An administrator must enroll you in courses before attendance can be validated." />
            ) : (
              <div className="mini-timeline">
                {enrolledCourses.slice(0, 4).map((enrollment) => (
                  <div className="timeline-row" key={`${enrollment.course_id}-${enrollment.semester}-${enrollment.academic_year}`}>
                    <div className="timeline-pin"><i className="ti ti-book" /></div>
                    <div className="timeline-text">
                      <strong>{courseLookup.get(Number(enrollment.course_id)) ?? `Course #${String(enrollment.course_id ?? '-')}`}</strong>
                      <span>{String(enrollment.semester ?? '-')} - {String(enrollment.academic_year ?? '-')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Digital identity</h3>
                <div className="section-subtle">Campus identity status used during every attendance check</div>
              </div>
              <span className={`status-pill ${digitalId ? 'green' : 'amber'}`}>
                <i className={`ti ti-${digitalId ? 'id-badge-2' : 'id-off'}`} />
                {digitalId ? 'Issued' : 'Missing'}
              </span>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Card status</span>
                <span className="detail-value">{digitalId ? 'Active and available for attendance' : 'No active digital ID on file'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Card expiry</span>
                <span className="detail-value">{formatDate((digitalId as EntityRecord | undefined)?.expires_at)}</span>
              </div>
            </div>
          </div>

          <div className="callout-panel teal">
            <i className="ti ti-shield-check" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Every scan still binds identity and location</div>
              <div className="callout-copy">
                Attendance is only accepted when your device fingerprint, QR code, enrollment, and classroom location align.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LecturerDashboard() {
  const { useList, useSessionRecords } = useSession();
  const { useQueue } = useAttendanceReview();
  const { useList: useTimetableList } = useTimetable();
  const { useList: useCourseList } = useCourse();
  const { useList: useVenueList } = useVenue();
  const { useList: useUserList } = useUser();
  const { data: sessionsData, isLoading: sessionsLoading } = useList({ query: { limit: 200 } });
  const { data: reviewData, isLoading: reviewLoading } = useQueue({ limit: 200 });
  const { data: timetableData, isLoading: timetableLoading } = useTimetableList({ limit: 200 });
  const { data: coursesData, isLoading: coursesLoading } = useCourseList({ query: { limit: 500 } });
  const { data: venuesData, isLoading: venuesLoading } = useVenueList({ query: { limit: 500 } });
  const { data: usersData, isLoading: usersLoading } = useUserList({ query: { limit: 500 } });

  const sessions = (sessionsData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const reviewItems = (reviewData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const timetableEntries = (timetableData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const courses = (coursesData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const venues = (venuesData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const users = (usersData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const courseLookup = buildLookupMap(courses, 'course_id', (course) => getCourseDisplayName(course, course.course_id as number));
  const venueLookup = buildLookupMap(venues, 'venue_id', (venue) => getVenueDisplayName(venue, venue.venue_id as number));
  const studentLookup = buildLookupMap(users, 'user_id', (user) => getStudentDisplayName(user, user.user_id as number));
  const now = Date.now();
  const liveSessions = sessions.filter((session) => Boolean(session.is_active));
  const nextSessions = sessions
    .filter((session) => new Date(String(session.session_start ?? 0)).getTime() > now)
    .sort((a, b) => new Date(String(a.session_start ?? 0)).getTime() - new Date(String(b.session_start ?? 0)).getTime());
  const liveSession = liveSessions[0];
  const liveSessionId = liveSession ? Number(liveSession.session_id) : undefined;
  const { data: liveRecordsData, isLoading: liveRecordsLoading } = useSessionRecords(liveSessionId);
  const liveRecords = (liveRecordsData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const pendingReview = reviewItems.filter((item) => String(item.verification_status ?? '') === 'Pending');
  const currentCaptureRate = liveRecords.length ? `${Math.round(((liveRecords.length - pendingReview.filter((item) => Number(item.session_id) === liveSessionId).length) / liveRecords.length) * 100)}%` : '0%';

  if (sessionsLoading || reviewLoading || timetableLoading || coursesLoading || venuesLoading || usersLoading || (liveSessionId ? liveRecordsLoading : false)) {
    return <LoadingSkeleton rows={8} columns={4} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lecturer workspace"
        title="Live session control"
        subtitle="Monitor active attendance windows, recurring timetable coverage, and scans that still need a decision."
        icon="presentation"
        tone="teal"
      >
        <Link to="/sessions/new"><Button variant="primary"><i className="ti ti-plus" />Start Session</Button></Link>
        <Link to="/timetable"><Button variant="outline-secondary"><i className="ti ti-calendar-time" />Timetable</Button></Link>
      </PageHeader>

      <div className="stat-grid">
        <MetricCard tone="teal" icon="broadcast" pill={liveSessions.length ? 'Live now' : 'Idle'} value={liveSessions.length} label="Active sessions" meta="Attendance windows currently accepting student check-ins." />
        <MetricCard tone="green" icon="users" pill="Capture" value={currentCaptureRate} label="Current verified rate" meta="Live-session share of records that are already trusted or approved." />
        <MetricCard tone="amber" icon="shield-exclamation" pill={pendingReview.length ? 'Needs review' : 'Clear'} value={pendingReview.length} label="Open review items" meta="Flagged or pending scans still waiting on a lecturer decision." />
        <MetricCard tone="royal" icon="calendar-event" pill="Recurring" value={timetableEntries.filter((entry) => Boolean(entry.is_active)).length} label="Timetable slots" meta="Recurring teaching slots you can use to generate scheduled attendance sessions." />
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Session board</h3>
                <div className="section-subtle">Current live window and the next scheduled classes you own</div>
              </div>
            </div>

            {liveSession ? (
              <div className="stack">
                <div className="surface-card section-card">
                  <div className="section-title">
                    <div>
                      <h3>{String(liveSession.session_type ?? 'Session')} - {courseLookup.get(Number(liveSession.course_id)) ?? `Course #${String(liveSession.course_id ?? '-')}`}</h3>
                      <div className="section-subtle">{String(liveSession.timetable_slot ?? 'Ad hoc slot')}</div>
                    </div>
                    <span className="status-pill green"><i className="ti ti-circle-filled" />Live</span>
                  </div>
                  <div className="session-stat-row">
                    <div className="session-stat"><label>Scanned</label><strong>{liveRecords.length}</strong></div>
                    <div className="session-stat"><label>Flagged</label><strong>{pendingReview.filter((item) => Number(item.session_id) === liveSessionId).length}</strong></div>
                    <div className="session-stat"><label>Venue</label><strong>{venueLookup.get(Number(liveSession.venue_id)) ?? `Venue #${String(liveSession.venue_id ?? '-')}`}</strong></div>
                  </div>
                </div>

                {nextSessions.length > 0 ? (
                  <div className="mini-timeline">
                    {nextSessions.slice(0, 3).map((session) => (
                      <div className="timeline-row" key={Number(session.session_id)}>
                        <div className="timeline-pin"><i className="ti ti-calendar-event" /></div>
                        <div className="timeline-text">
                          <strong>{courseLookup.get(Number(session.course_id)) ?? `Course #${String(session.course_id ?? '-')}`}</strong>
                          <span>{formatDateTime(session.session_start)} - {String(session.timetable_slot ?? 'No timetable slot')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState icon="ti-calendar-off" title="No live attendance window" message="Start a scheduled session when class begins or generate sessions from the timetable first." />
            )}
          </div>
        </div>

        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Review queue snapshot</h3>
                <div className="section-subtle">Highest-risk attendance evidence still waiting on lecturer action</div>
              </div>
              <Link to="/attendance-review"><Button variant="outline-secondary"><i className="ti ti-shield-search" />Open queue</Button></Link>
            </div>

            {pendingReview.length === 0 ? (
              <EmptyState icon="ti-shield-check" title="Queue clear" message="No current attendance records are waiting on a lecturer decision." />
            ) : (
              <div className="mini-timeline">
                {pendingReview.slice(0, 4).map((item) => (
                  <div className="timeline-row" key={Number(item.attendance_id)}>
                    <div className="timeline-pin"><i className="ti ti-alert-circle" /></div>
                    <div className="timeline-text">
                      <strong>{studentLookup.get(Number(item.student_id)) ?? `Student #${String(item.student_id ?? '-')}`}</strong>
                      <span>{courseLookup.get(Number(item.course_id)) ?? `Course #${String(item.course_id ?? '-')}`} - GPS {item.gps_accuracy ? `${Math.round(Number(item.gps_accuracy))} m` : 'unavailable'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="callout-panel amber">
            <i className="ti ti-alert-circle" style={{ color: 'var(--amber)' }} />
            <div>
              <div className="callout-title">Live QR rotation should remain deliberate</div>
              <div className="callout-copy">
                Only rotate a QR after you are sure the room needs a fresh code, because every earlier image becomes invalid immediately.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { useList: useUserList } = useUser();
  const { useList: useVenueList } = useVenue();
  const { useList: useCourseList } = useCourse();
  const { useList: useSessionList } = useSession();
  const { useQueue } = useAttendanceReview();
  const { useList: useAuditList } = useAudit();

  const { data: usersData, isLoading: usersLoading } = useUserList({ query: { limit: 500 } });
  const { data: venuesData, isLoading: venuesLoading } = useVenueList({ query: { limit: 500 } });
  const { data: coursesData, isLoading: coursesLoading } = useCourseList({ query: { limit: 500 } });
  const { data: sessionsData, isLoading: sessionsLoading } = useSessionList({ query: { limit: 200 } });
  const { data: reviewData, isLoading: reviewLoading } = useQueue({ limit: 200 });
  const { data: auditData, isLoading: auditLoading } = useAuditList({ query: { limit: 20 } });

  const users = (usersData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const venues = (venuesData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const courses = (coursesData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const sessions = (sessionsData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const reviewItems = (reviewData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];
  const auditLogs = (auditData as { items?: Array<EntityRecord> } | undefined)?.items ?? [];

  const geofencedVenues = venues.filter((venue) => [venue.latitude, venue.longitude, venue.radius_meters].every((value) => value !== null && value !== undefined));
  const liveSessions = sessions.filter((session) => Boolean(session.is_active));
  const pendingReview = reviewItems.filter((item) => String(item.verification_status ?? '') === 'Pending');
  const latestAudit = auditLogs.slice(0, 4);
  const userLookup = buildLookupMap(users, 'user_id', (user) => getUserDisplayName(user, user.user_id as number));

  if (usersLoading || venuesLoading || coursesLoading || sessionsLoading || reviewLoading || auditLoading) {
    return <LoadingSkeleton rows={8} columns={4} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin workspace"
        title="System operations overview"
        subtitle="Watch the real academic directory, venue compliance, and attendance exception load across the platform."
        icon="shield"
        tone="purple"
      >
        <Link to="/users"><Button variant="primary"><i className="ti ti-users" />Manage users</Button></Link>
        <Link to="/audit"><Button variant="outline-secondary"><i className="ti ti-file-text" />View audit log</Button></Link>
      </PageHeader>

      <div className="stat-grid">
        <MetricCard tone="royal" icon="users" pill="Directory" value={users.length} label="Active identities" meta="User accounts currently active across students, lecturers, and administrators." />
        <MetricCard tone="green" icon="map-pin-check" pill={`${geofencedVenues.length}/${venues.length || 0}`} value={geofencedVenues.length} label="Geofenced venues" meta="Approved spaces that are fully ready for trusted attendance capture." />
        <MetricCard tone="amber" icon="alert-triangle" pill={pendingReview.length ? 'Needs attention' : 'Clear'} value={pendingReview.length} label="Open exceptions" meta="Attendance records still waiting on review before reporting can be trusted." />
        <MetricCard tone="teal" icon="broadcast" pill="Live sessions" value={liveSessions.length} label="Classes running now" meta="Attendance windows currently active and accepting check-ins." />
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Control surfaces</h3>
                <div className="section-subtle">The areas administrators should touch first based on live platform state</div>
              </div>
            </div>
            <div className="hero-grid">
              <Link to="/users" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--royal-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-users" style={{ color: 'var(--royal)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Identity management</strong>
                  <span style={{ color: 'var(--tx3)' }}>{users.length} active identities currently under governance.</span>
                </div>
              </Link>
              <Link to="/courses" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--green-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-books" style={{ color: 'var(--green)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Academic catalog</strong>
                  <span style={{ color: 'var(--tx3)' }}>{courses.length} courses currently exposed to enrollment and teaching workflows.</span>
                </div>
              </Link>
              <Link to="/venues" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--teal-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-building" style={{ color: 'var(--teal)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Venue control</strong>
                  <span style={{ color: 'var(--tx3)' }}>{venues.length - geofencedVenues.length} venues still need geofence completion.</span>
                </div>
              </Link>
              <Link to="/attendance-review" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--purple-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-shield-search" style={{ color: 'var(--purple)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Attendance review</strong>
                  <span style={{ color: 'var(--tx3)' }}>{pendingReview.length} records currently need a compliance decision.</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="callout-panel amber">
            <i className="ti ti-shield-exclamation" style={{ color: 'var(--amber)' }} />
            <div>
              <div className="callout-title">Current operations focus</div>
              <div className="callout-copy">
                Keep venue geofences complete and review pending attendance evidence before it feeds downstream reporting.
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Latest audit activity</h3>
                <div className="section-subtle">Most recent platform events recorded in the immutable audit trail</div>
              </div>
            </div>
            {latestAudit.length === 0 ? (
              <EmptyState icon="ti-file-off" title="No audit activity" message="Once the system records activity, the latest events will appear here." />
            ) : (
              <div className="mini-timeline">
                {latestAudit.map((log) => (
                  <div className="timeline-row" key={Number(log.log_id ?? log.audit_id)}>
                    <div className="timeline-pin"><i className="ti ti-activity" /></div>
                    <div className="timeline-text">
                      <strong>{String(log.action ?? 'Unknown action')}</strong>
                      <span>{formatDateTime(log.created_at)}{log.user_id ? ` - ${userLookup.get(Number(log.user_id)) ?? `User #${String(log.user_id)}`}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { role, userId } = useAuth();

  if (!role) {
    return <LoadingSkeleton rows={6} columns={4} />;
  }

  if (role === 'Student' && userId) {
    return <StudentDashboard userId={userId} />;
  }

  if (role === 'Lecturer' && userId) {
    return <LecturerDashboard />;
  }

  return <AdminDashboard />;
}
