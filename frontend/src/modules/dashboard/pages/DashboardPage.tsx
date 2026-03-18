import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useDashboard } from '../hooks/useDashboard';

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'No timestamp';
  return new Date(value).toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString();
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

function StudentDashboard() {
  const { useSummary } = useDashboard();
  const { data, isLoading } = useSummary();
  const summary = data?.student;

  if (isLoading) return <LoadingSkeleton rows={8} columns={4} />;
  if (!summary) return <EmptyState icon="ti-mood-empty" title="Student dashboard unavailable" message="Student summary data could not be loaded." />;

  const coverage = summary.records_count
    ? `${Math.round((summary.verified_count / summary.records_count) * 100)}%`
    : '0%';

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
        <MetricCard tone="royal" icon="clipboard-check" pill="Attendance" value={summary.records_count} label="Attendance records" meta="Every successful classroom submission stored against your identity." />
        <MetricCard tone="green" icon="circle-check" pill={coverage} value={summary.verified_count} label="Verified check-ins" meta="Records that cleared geofence, QR, and device trust checks." />
        <MetricCard tone="amber" icon="alert-triangle" pill={summary.flagged_count ? 'Needs review' : 'Clear'} value={summary.flagged_count} label="Flagged records" meta="Pending or low-confidence scans that still need a lecturer decision." />
        <MetricCard tone="teal" icon="books" pill="Academic load" value={summary.active_enrollments} label="Active enrollments" meta="Courses where you are currently enrolled for attendance tracking." />
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

            {summary.recent_attendance.length === 0 ? (
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
                    {summary.recent_attendance.map((record) => (
                      <tr key={record.attendance_id}>
                        <td className="fw-semibold">{record.session_type} - {record.course_label}</td>
                        <td className="text-secondary small">{formatDateTime(record.checked_in_at)}</td>
                        <td>
                          <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                            <i className={`ti ti-${record.fraud_flag ? 'alert-triangle' : 'circle-check'}`} />
                            {record.fraud_flag ? 'Flagged' : record.verification_status}
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
            {summary.enrollments.length === 0 ? (
              <EmptyState icon="ti-book-off" title="No active enrollments" message="An administrator must enroll you in courses before attendance can be validated." />
            ) : (
              <div className="mini-timeline">
                {summary.enrollments.map((enrollment) => (
                  <div className="timeline-row" key={`${enrollment.course_id}-${enrollment.semester}-${enrollment.academic_year}`}>
                    <div className="timeline-pin"><i className="ti ti-book" /></div>
                    <div className="timeline-text">
                      <strong>{enrollment.course_label}</strong>
                      <span>{enrollment.semester} - {enrollment.academic_year}</span>
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
              <span className={`status-pill ${summary.digital_id_active ? 'green' : 'amber'}`}>
                <i className={`ti ti-${summary.digital_id_active ? 'id-badge-2' : 'id-off'}`} />
                {summary.digital_id_active ? 'Issued' : 'Missing'}
              </span>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Card status</span>
                <span className="detail-value">{summary.digital_id_active ? 'Active and available for attendance' : 'No active digital ID on file'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Card expiry</span>
                <span className="detail-value">{formatDate(summary.digital_id_expires_at)}</span>
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
  const { useSummary } = useDashboard();
  const { data, isLoading } = useSummary();
  const summary = data?.lecturer;

  if (isLoading) return <LoadingSkeleton rows={8} columns={4} />;
  if (!summary) return <EmptyState icon="ti-mood-empty" title="Lecturer dashboard unavailable" message="Lecturer summary data could not be loaded." />;

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
        <MetricCard tone="teal" icon="broadcast" pill={summary.active_session_count ? 'Live now' : 'Idle'} value={summary.active_session_count} label="Active sessions" meta="Attendance windows currently accepting student check-ins." />
        <MetricCard tone="green" icon="users" pill="Capture" value={`${summary.current_verified_rate}%`} label="Current verified rate" meta="Live-session share of records that are already trusted or approved." />
        <MetricCard tone="amber" icon="shield-exclamation" pill={summary.open_review_items ? 'Needs review' : 'Clear'} value={summary.open_review_items} label="Open review items" meta="Flagged or pending scans still waiting on a lecturer decision." />
        <MetricCard tone="royal" icon="calendar-event" pill="Recurring" value={summary.timetable_slots} label="Timetable slots" meta="Recurring teaching slots you can use to generate scheduled attendance sessions." />
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

            {summary.live_session ? (
              <div className="stack">
                <div className="surface-card section-card">
                  <div className="section-title">
                    <div>
                      <h3>{summary.live_session.session_type} - {summary.live_session.course_label}</h3>
                      <div className="section-subtle">{summary.live_session.timetable_slot ?? 'Ad hoc slot'}</div>
                    </div>
                    <span className="status-pill green"><i className="ti ti-circle-filled" />Live</span>
                  </div>
                  <div className="session-stat-row">
                    <div className="session-stat"><label>Scanned</label><strong>{summary.live_session.live_records}</strong></div>
                    <div className="session-stat"><label>Flagged</label><strong>{summary.live_session.pending_reviews}</strong></div>
                    <div className="session-stat"><label>Venue</label><strong>{summary.live_session.venue_label}</strong></div>
                  </div>
                </div>

                {summary.upcoming_sessions.length > 0 ? (
                  <div className="mini-timeline">
                    {summary.upcoming_sessions.map((session) => (
                      <div className="timeline-row" key={session.session_id}>
                        <div className="timeline-pin"><i className="ti ti-calendar-event" /></div>
                        <div className="timeline-text">
                          <strong>{session.course_label}</strong>
                          <span>{formatDateTime(session.session_start)} - {session.timetable_slot ?? 'No timetable slot'}</span>
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

            {summary.review_queue.length === 0 ? (
              <EmptyState icon="ti-shield-check" title="Queue clear" message="No current attendance records are waiting on a lecturer decision." />
            ) : (
              <div className="mini-timeline">
                {summary.review_queue.map((item) => (
                  <div className="timeline-row" key={item.attendance_id}>
                    <div className="timeline-pin"><i className="ti ti-alert-circle" /></div>
                    <div className="timeline-text">
                      <strong>{item.student_name}</strong>
                      <span>{item.course_label} - GPS {item.gps_accuracy ? `${Math.round(item.gps_accuracy)} m` : 'unavailable'}</span>
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
  const { useSummary } = useDashboard();
  const { data, isLoading } = useSummary();
  const summary = data?.admin;

  if (isLoading) return <LoadingSkeleton rows={8} columns={4} />;
  if (!summary) return <EmptyState icon="ti-mood-empty" title="Admin dashboard unavailable" message="Admin summary data could not be loaded." />;

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
        <MetricCard tone="royal" icon="users" pill="Directory" value={summary.active_identities} label="Active identities" meta="User accounts currently active across students, lecturers, and administrators." />
        <MetricCard tone="green" icon="map-pin-check" pill={`${summary.geofenced_venues}/${summary.total_venues || 0}`} value={summary.geofenced_venues} label="Geofenced venues" meta="Approved spaces that are fully ready for trusted attendance capture." />
        <MetricCard tone="amber" icon="alert-triangle" pill={summary.open_exceptions ? 'Needs attention' : 'Clear'} value={summary.open_exceptions} label="Open exceptions" meta="Attendance records still waiting on review before reporting can be trusted." />
        <MetricCard tone="teal" icon="broadcast" pill="Live sessions" value={summary.live_sessions} label="Classes running now" meta="Attendance windows currently active and accepting check-ins." />
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
                  <span style={{ color: 'var(--tx3)' }}>{summary.active_identities} active identities currently under governance.</span>
                </div>
              </Link>
              <Link to="/venues" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--teal-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-building" style={{ color: 'var(--teal)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Venue control</strong>
                  <span style={{ color: 'var(--tx3)' }}>{summary.total_venues - summary.geofenced_venues} venues still need geofence completion.</span>
                </div>
              </Link>
              <Link to="/attendance-review" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--purple-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-shield-search" style={{ color: 'var(--purple)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Attendance review</strong>
                  <span style={{ color: 'var(--tx3)' }}>{summary.open_exceptions} records currently need a compliance decision.</span>
                </div>
              </Link>
              <Link to="/audit" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--amber-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-file-text" style={{ color: 'var(--amber)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Audit evidence</strong>
                  <span style={{ color: 'var(--tx3)' }}>Review the latest operational and identity trace entries.</span>
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
            {summary.latest_audit.length === 0 ? (
              <EmptyState icon="ti-file-off" title="No audit activity" message="Once the system records activity, the latest events will appear here." />
            ) : (
              <div className="mini-timeline">
                {summary.latest_audit.map((log) => (
                  <div className="timeline-row" key={log.log_id}>
                    <div className="timeline-pin"><i className="ti ti-activity" /></div>
                    <div className="timeline-text">
                      <strong>{log.action}</strong>
                      <span>{formatDateTime(log.created_at)}{log.actor_name ? ` - ${log.actor_name}` : ''}</span>
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
  const { role } = useAuth();

  if (!role) {
    return <LoadingSkeleton rows={6} columns={4} />;
  }

  if (role === 'Student') return <StudentDashboard />;
  if (role === 'Lecturer') return <LecturerDashboard />;
  return <AdminDashboard />;
}
