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

function StatCard({ tone, icon, value, label, subtitle }: { tone: string; icon: string; value: string | number; label: string; subtitle: string }) {
  return (
    <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
      <div className={`sb-avatar bg-${tone}-lt text-${tone} p-2 fs-3 rounded-3`}>
        <i className={`ti ti-${icon}`} />
      </div>
      <div className="entity-copy">
        <span className="text-secondary small fw-bold uppercase">{label}</span>
        <strong className="h4 mb-0 d-block text-navy">{value}</strong>
        <span className="smaller text-muted d-block mt-1">{subtitle}</span>
      </div>
    </div>
  );
}

function StudentEnrolledCoursesPanel({ enrollments }: { enrollments: Array<{ course_id: number; course_label: string; semester: string; academic_year: string }> }) {
  return (
    <div className="surface-card">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Enrolled Courses</h3>
        <Link to="/my-courses" className="small text-royal fw-bold text-decoration-none">Open Courses</Link>
      </div>
      {enrollments.length === 0 ? (
        <EmptyState title="No courses assigned" message="Your course enrollments will appear here once they are registered." />
      ) : (
        <div className="row g-3">
          {enrollments.map((enrollment) => (
            <div key={`${enrollment.course_id}-${enrollment.semester}-${enrollment.academic_year}`} className="col-md-6">
              <div className="surface-card h-100 border-0 shadow-sm bg-light-subtle">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <strong className="text-navy d-block mb-1">{enrollment.course_label}</strong>
                    <span className="smaller text-muted">{enrollment.semester}</span>
                  </div>
                  <span className="status-pill green">
                    <i className="ti ti-circle-check" />
                    Enrolled
                  </span>
                </div>
                <div className="smaller text-secondary mt-3">{enrollment.academic_year}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentDashboard() {
  const { useSummary } = useDashboard();
  const { data, isLoading } = useSummary();
  const summary = data?.student;

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  if (!summary) return <EmptyState icon="ti-mood-empty" title="Student Dashboard Unavailable" message="We couldn't load your summary. Contact support if this persists." />;

  const coverage = summary.records_count ? Math.round((summary.verified_count / summary.records_count) * 100) : 0;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Student Workspace"
        subtitle="Operational overview of your attendance compliance and academic records."
        icon="device-desktop-analytics"
        tone="royal"
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      >
        <div className="student-dashboard-actions">
          <Link to="/checkin"><Button variant="primary"><i className="ti ti-qrcode" />Scan QR</Button></Link>
          <Link to="/my-courses"><Button variant="outline-secondary"><i className="ti ti-books" />Courses</Button></Link>
        </div>
      </PageHeader>

      <div className="row g-4">
        <div className="col-md-3">
          <StatCard tone="royal" icon="clipboard-check" label="Total Scans" value={summary.records_count} subtitle="Historical records on file" />
        </div>
        <div className="col-md-3">
          <StatCard tone="green" icon="circle-check" label="Verified Rate" value={`${coverage}%`} subtitle="Cleared all trust checks" />
        </div>
        <div className="col-md-3">
          <StatCard tone="amber" icon="alert-triangle" label="Risk Flags" value={summary.flagged_count} subtitle="Scans requiring review" />
        </div>
        <div className="col-md-3">
          <StatCard tone="teal" icon="books" label="Enrollments" value={summary.active_enrollments} subtitle="Active academic courses" />
        </div>
      </div>

      <StudentEnrolledCoursesPanel enrollments={summary.enrollments} />

      <div className="surface-card">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Recent Attendance Activity</h3>
          <Link to="/my-attendance" className="small text-royal fw-bold text-decoration-none">View Full History</Link>
        </div>
        {summary.recent_attendance.length === 0 ? (
          <EmptyState title="No Records Found" message="Scans will appear here as soon as they are captured." />
        ) : (
          <>
            <div className="d-none d-md-block table-responsive">
              <table className="table table-hover align-middle mb-0">
              <thead className="bg-light-subtle">
                <tr>
                  <th className="ps-4 border-0 py-2 small fw-bold text-secondary uppercase">Class Details</th>
                  <th className="border-0 py-2 small fw-bold text-secondary uppercase">Timestamp</th>
                  <th className="text-end pe-4 border-0 py-2 small fw-bold text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {summary.recent_attendance.map((record) => (
                  <tr key={record.attendance_id}>
                    <td className="ps-4 py-3">
                      <strong className="text-navy d-block">{record.course_label}</strong>
                      <span className="smaller text-muted">{record.session_type}</span>
                    </td>
                    <td className="py-3 text-secondary smaller">{formatDateTime(record.checked_in_at)}</td>
                    <td className="text-end pe-4 py-3">
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
            <div className="d-md-none mobile-record-list">
              {summary.recent_attendance.map((record) => (
                <div key={record.attendance_id} className="mobile-record-card">
                  <div className="mobile-record-head">
                    <div>
                      <span className="mobile-record-title">{record.course_label}</span>
                      <span className="mobile-record-meta">{record.session_type}</span>
                    </div>
                    <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                      <i className={`ti ti-${record.fraud_flag ? 'alert-triangle' : 'circle-check'}`} />
                      {record.fraud_flag ? 'Flagged' : record.verification_status}
                    </span>
                  </div>

                  <div className="detail-list">
                    <div className="detail-row">
                      <div className="detail-label">Checked In</div>
                      <div className="detail-value">{formatDateTime(record.checked_in_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LecturerDashboard() {
  const { useSummary } = useDashboard();
  const { data, isLoading } = useSummary();
  const summary = data?.lecturer;

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  if (!summary) return <EmptyState icon="ti-mood-empty" title="Lecturer Workspace Unavailable" message="Could not load class data." />;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Class Control"
        subtitle="Manage live classes and review pending attendance exceptions."
        icon="broadcast"
        tone="teal"
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      >
        <Link to="/sessions/new"><Button variant="primary"><i className="ti ti-plus" />Start Class</Button></Link>
      </PageHeader>

      <div className="row g-4">
        <div className="col-md-3">
          <StatCard tone="teal" icon="broadcast" label="Active Now" value={summary.active_session_count} subtitle="Broadcasting live QR" />
        </div>
        <div className="col-md-3">
          <StatCard tone="green" icon="users" label="Verification" value={`${summary.current_verified_rate}%`} subtitle="Trusted room check-ins" />
        </div>
        <div className="col-md-3">
          <StatCard tone="amber" icon="shield-exclamation" label="Queue" value={summary.open_review_items} subtitle="High-risk scans pending" />
        </div>
        <div className="col-md-3">
          <StatCard tone="royal" icon="calendar-event" label="Scheduled" value={summary.upcoming_sessions.length} subtitle="Upcoming classes" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-7">
          <div className="surface-card h-100">
            <h3 className="h6 mb-4 fw-bold uppercase tracking-wider text-secondary border-bottom pb-2">Active Classes</h3>
            {summary.live_session ? (
              <div className="bg-teal-lt p-4 rounded-3 border border-teal-subtle">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <strong className="h5 text-navy d-block mb-1">{summary.live_session.course_label}</strong>
                    <span className="badge bg-teal">{summary.live_session.session_type}</span>
                  </div>
                  <Link to={`/sessions/${summary.live_session.session_id}`}>
                    <Button variant="teal" size="sm">Open Class</Button>
                  </Link>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="small text-secondary fw-bold uppercase">Scanned</div>
                    <div className="h4 text-navy mb-0">{summary.live_session.live_records}</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary fw-bold uppercase">Flags</div>
                    <div className="h4 text-amber mb-0">{summary.live_session.pending_reviews}</div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No Live Classes" message="No attendance windows are currently active." />
            )}
          </div>
        </div>
        <div className="col-md-5">
          <div className="surface-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
              <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Upcoming Classes</h3>
              <Link to="/sessions" className="smaller text-royal fw-bold">View Full</Link>
            </div>
            {summary.upcoming_sessions.length === 0 ? (
              <div className="text-center py-4 text-muted small">No scheduled classes found.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {summary.upcoming_sessions.map((session) => (
                  <Link
                    key={session.session_id}
                    to={`/sessions/${session.session_id}`}
                    className="d-flex align-items-center gap-3 border-bottom pb-2 text-decoration-none"
                  >
                    <div className="sb-avatar sm bg-light text-secondary"><i className="ti ti-calendar-event" /></div>
                    <div className="flex-grow-1">
                      <strong className="small text-navy d-block">{session.course_label}</strong>
                      <span className="smaller text-muted">{formatDateTime(session.session_start)}</span>
                    </div>
                    <i className="ti ti-chevron-right text-secondary smaller" />
                  </Link>
                ))}
              </div>
            )}
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

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  if (!summary) return <EmptyState icon="ti-mood-empty" title="Admin Oversight Unavailable" message="System integrity data could not be retrieved." />;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Admin Command"
        subtitle="Estate footprint, identity governance, and platform integrity status."
        icon="shield-lock"
        tone="purple"
        breadcrumbs={[{ label: 'Home' }, { label: 'Oversight' }]}
      >
        <Link to="/users"><Button variant="primary"><i className="ti ti-users" />Users</Button></Link>
        <Link to="/audit"><Button variant="outline-secondary"><i className="ti ti-file-text" />Audit</Button></Link>
      </PageHeader>

      <div className="row g-4">
        <div className="col-md-3">
          <StatCard tone="purple" icon="users" label="Identities" value={summary.active_identities} subtitle="Across all campus roles" />
        </div>
        <div className="col-md-3">
          <StatCard tone="teal" icon="map-pin-check" label="Venues" value={`${summary.geofenced_venues}/${summary.total_venues}`} subtitle="Fully geofenced spaces" />
        </div>
        <div className="col-md-3">
          <StatCard tone="amber" icon="shield-search" label="Exceptions" value={summary.open_exceptions} subtitle="Pending compliance decisions" />
        </div>
        <div className="col-md-3">
          <StatCard tone="royal" icon="broadcast" label="Live Load" value={summary.live_sessions} subtitle="Active classrooms now" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="surface-card">
            <h3 className="h6 mb-4 fw-bold uppercase tracking-wider text-secondary border-bottom pb-2">Platform Surfaces</h3>
            <div className="row g-3">
              <div className="col-6">
                <Link to="/users" className="text-decoration-none">
                  <div className="p-3 bg-purple-lt rounded-3 border border-purple-subtle h-100">
                    <i className="ti ti-users text-purple mb-2 fs-4" />
                    <strong className="d-block text-navy smaller">Identities</strong>
                    <span className="smaller text-muted">Manage directory & access.</span>
                  </div>
                </Link>
              </div>
              <div className="col-6">
                <Link to="/venues" className="text-decoration-none">
                  <div className="p-3 bg-teal-lt rounded-3 border border-teal-subtle h-100">
                    <i className="ti ti-building text-teal mb-2 fs-4" />
                    <strong className="d-block text-navy smaller">Infrastructure</strong>
                    <span className="smaller text-muted">Geofence compliance & venues.</span>
                  </div>
                </Link>
              </div>
              <div className="col-6">
                <Link to="/courses" className="text-decoration-none">
                  <div className="p-3 bg-amber-lt rounded-3 border border-amber-subtle h-100">
                    <i className="ti ti-books text-amber mb-2 fs-4" />
                    <strong className="d-block text-navy smaller">Course Registry</strong>
                    <span className="smaller text-muted">Govern attendance policy and course ownership.</span>
                  </div>
                </Link>
              </div>
              <div className="col-6">
                <Link to="/audit" className="text-decoration-none">
                  <div className="p-3 bg-navy text-white rounded-3 h-100">
                    <i className="ti ti-file-text opacity-75 mb-2 fs-4" />
                    <strong className="d-block smaller">Audit Trail</strong>
                    <span className="smaller opacity-75">View immutable trace logs.</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="surface-card">
            <h3 className="h6 mb-4 fw-bold uppercase tracking-wider text-secondary border-bottom pb-2">Operational Pulse</h3>
            {summary.latest_audit.length === 0 ? (
              <div className="text-center py-5 text-muted small">No recent activity.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {summary.latest_audit.map((log) => (
                  <div key={log.log_id} className="d-flex align-items-center gap-3 border-bottom pb-2">
                    <div className="sb-avatar sm bg-light text-secondary"><i className="ti ti-activity" /></div>
                    <div className="flex-grow-1">
                      <strong className="small text-navy d-block">{log.action}</strong>
                      <span className="smaller text-muted">{log.actor_name || 'System'}</span>
                    </div>
                    <span className="smaller text-muted mono">{new Date(log.created_at).toLocaleTimeString()}</span>
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
  if (!role) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  if (role === 'Student') return <StudentDashboard />;
  if (role === 'Lecturer') return <LecturerDashboard />;
  return <AdminDashboard />;
}
