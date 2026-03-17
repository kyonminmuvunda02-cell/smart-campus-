import { Link } from 'react-router';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';

type Metric = {
  label: string;
  value: string;
  footnote: string;
  tone: 'royal' | 'green' | 'teal' | 'amber';
};

type ActionCardProps = {
  icon: string;
  title: string;
  copy: string;
  to: string;
  cta: string;
};

export default function DashboardPage() {
  const { role } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Project workspace"
        title="Dashboard"
        subtitle={`Signed in as ${role ?? 'User'}. Your smart-campus tools are ready.`}
        icon="layout-dashboard"
        action={
          <Link className="btn-soft btn-soft-primary" to={primaryRoute(role)}>
            <i className={`ti ti-${primaryIcon(role)}`} />
            <span>{primaryLabel(role)}</span>
          </Link>
        }
      />

      {role === 'Student' && <StudentDashboard />}
      {role === 'Lecturer' && <LecturerDashboard />}
      {role === 'Admin' && <AdminDashboard />}
    </div>
  );
}

function StudentDashboard() {
  const metrics: Metric[] = [
    { label: 'Attendance rate', value: '92%', footnote: 'Above faculty target', tone: 'royal' },
    { label: 'Classes attended', value: '38', footnote: 'This semester', tone: 'green' },
    { label: 'GPS verified', value: '12', footnote: 'Last 14 days', tone: 'teal' },
    { label: 'Risk alerts', value: '01', footnote: 'One module near threshold', tone: 'amber' },
  ];

  const actions: ActionCardProps[] = [
    {
      icon: 'qrcode',
      title: 'Scan attendance',
      copy: 'Open the student check-in flow with GPS verification and session validation.',
      to: '/checkin',
      cta: 'Open scanner',
    },
    {
      icon: 'calendar-check',
      title: 'Review attendance',
      copy: 'Track your verified, pending, and flagged attendance records in one place.',
      to: '/my-attendance',
      cta: 'View records',
    },
    {
      icon: 'id-badge-2',
      title: 'Digital identity',
      copy: 'Access your active digital ID and confirm its validity before scanning.',
      to: '/my-digital-id',
      cta: 'Open ID card',
    },
  ];

  return (
    <>
      <div className="hero-card mb-4">
        <span className="pill teal mb-3">
          <i className="ti ti-map-pin" />
          GPS-aware attendance
        </span>
        <h3>Proxy attendance is blocked by design.</h3>
        <p>
          Every check-in combines your digital ID, enrollment status, session freshness, and
          browser GPS signal before a record is accepted.
        </p>
      </div>

      <MetricGrid metrics={metrics} />

      <div className="dashboard-grid">
        <div>
          <div className="section-title">
            <div>
              <h3>Student workflow</h3>
              <p>Core actions aligned to the dissertation MVP scope.</p>
            </div>
          </div>
          <div className="action-grid">
            {actions.map((action) => (
              <ActionCard key={action.to} {...action} />
            ))}
          </div>
        </div>

        <div className="surface-card">
          <div className="section-title">
            <div>
              <h3>Today&apos;s timeline</h3>
              <p>Key attendance checkpoints for a student.</p>
            </div>
            <span className="pill green">
              <i className="ti ti-circle-check" />
              On campus
            </span>
          </div>

          <div className="info-callout teal">
            <i className="ti ti-shield-check" />
            <div>
              <div className="info-callout-title">Smart verification is active</div>
              <div className="info-callout-copy">
                Keep location services enabled before scanning so your record is verified instead
                of sent for review.
              </div>
            </div>
          </div>

          <div className="timeline-list">
            <TimelineItem
              icon="id-badge-2"
              title="Digital ID validated"
              time="07:42"
              copy="Your active card is still valid for the semester."
            />
            <TimelineItem
              icon="map-pin"
              title="GPS signal available"
              time="07:44"
              copy="Browser accuracy is within the expected campus radius."
            />
            <TimelineItem
              icon="qrcode"
              title="Upcoming attendance window"
              time="08:00"
              copy="Database Systems lecture starts in 16 minutes."
            />
          </div>
        </div>
      </div>
    </>
  );
}

function LecturerDashboard() {
  const metrics: Metric[] = [
    { label: 'Active sessions', value: '02', footnote: 'One session closes soon', tone: 'green' },
    { label: 'Students scanned', value: '74', footnote: 'Across live sessions', tone: 'royal' },
    { label: 'Flagged scans', value: '03', footnote: 'Require manual review', tone: 'amber' },
    { label: 'Courses today', value: '04', footnote: 'Teaching load overview', tone: 'teal' },
  ];

  return (
    <>
      <div className="hero-card mb-4">
        <span className="pill royal mb-3">
          <i className="ti ti-wifi" />
          Live monitoring
        </span>
        <h3>Run attendance sessions with live visibility.</h3>
        <p>
          Generate fresh QR codes, watch scans arrive in real time, and close the session without
          leaving the lecturer workspace.
        </p>
      </div>

      <MetricGrid metrics={metrics} />

      <div className="dashboard-grid">
        <div>
          <div className="action-grid">
            <ActionCard
              icon="player-play"
              title="Start new session"
              copy="Open a new attendance session and issue a time-limited QR code."
              to="/sessions/new"
              cta="Create session"
            />
            <ActionCard
              icon="list-details"
              title="Manage sessions"
              copy="Review active and past sessions with attendance progress and flagged scans."
              to="/sessions"
              cta="View sessions"
            />
            <ActionCard
              icon="report-analytics"
              title="Monitor engagement"
              copy="Track how attendance is trending before it becomes an academic problem."
              to="/sessions"
              cta="Open monitoring"
            />
          </div>
        </div>

        <div className="surface-card">
          <div className="section-title">
            <div>
              <h3>Session readiness</h3>
              <p>What a lecturer needs before a class starts.</p>
            </div>
          </div>

          <div className="timeline-list">
            <TimelineItem
              icon="book-2"
              title="Course selected"
              time="Before class"
              copy="Use the assigned course and current semester for the session."
            />
            <TimelineItem
              icon="building-community"
              title="Venue confirmed"
              time="Before class"
              copy="Attach the correct lecture room for cleaner attendance auditing."
            />
            <TimelineItem
              icon="refresh"
              title="QR refresh cycle"
              time="Every 60s"
              copy="The QR code rotates automatically to reduce screenshots and sharing."
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AdminDashboard() {
  const metrics: Metric[] = [
    { label: 'Registered users', value: '526', footnote: 'Students, lecturers, admins', tone: 'royal' },
    { label: 'Courses active', value: '47', footnote: 'Current academic year', tone: 'green' },
    { label: 'Live sessions', value: '06', footnote: 'Across the campus', tone: 'teal' },
    { label: 'Audit events', value: '124', footnote: 'Last 24 hours', tone: 'amber' },
  ];

  const actions: ActionCardProps[] = [
    {
      icon: 'users',
      title: 'User management',
      copy: 'Provision student and lecturer accounts and control who can access the system.',
      to: '/admin/users',
      cta: 'Manage users',
    },
    {
      icon: 'book-2',
      title: 'Course registry',
      copy: 'Maintain course metadata so attendance sessions map cleanly to the curriculum.',
      to: '/admin/courses',
      cta: 'Manage courses',
    },
    {
      icon: 'shield-search',
      title: 'Audit oversight',
      copy: 'Review system activity and confirm sensitive actions are recorded immutably.',
      to: '/admin/audit',
      cta: 'Open audit',
    },
  ];

  return (
    <>
      <div className="hero-card mb-4">
        <span className="pill royal mb-3">
          <i className="ti ti-lock-access" />
          Governance and controls
        </span>
        <h3>Admin oversight is built into the product.</h3>
        <p>
          Users, courses, sessions, and audit evidence are all visible from a single admin
          workspace, which is what a final-year delivery needs to demonstrate clearly.
        </p>
      </div>

      <MetricGrid metrics={metrics} />

      <div className="dashboard-grid">
        <div className="action-grid">
          {actions.map((action) => (
            <ActionCard key={action.to} {...action} />
          ))}
        </div>

        <div className="surface-card">
          <div className="section-title">
            <div>
              <h3>Control posture</h3>
              <p>How the system supports compliance and fraud prevention.</p>
            </div>
          </div>

          <div className="info-callout amber">
            <i className="ti ti-alert-triangle" />
            <div>
              <div className="info-callout-title">Three scans flagged today</div>
              <div className="info-callout-copy">
                These were accepted as pending because GPS accuracy was unavailable. Review them in
                the audit trail and session history.
              </div>
            </div>
          </div>

          <div className="timeline-list">
            <TimelineItem
              icon="shield-check"
              title="RBAC enforced"
              time="Continuous"
              copy="Students, lecturers, and admins each see only the tools they need."
            />
            <TimelineItem
              icon="map-pin"
              title="Location-aware check-ins"
              time="At scan time"
              copy="GPS metadata is recorded so remote fraud is harder to execute."
            />
            <TimelineItem
              icon="file-search"
              title="Immutable audit logs"
              time="After write actions"
              copy="Administrative and security-sensitive events can be reviewed later."
            />
          </div>
        </div>
      </div>
    </>
  );
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="stat-grid">
      {metrics.map((metric) => (
        <div key={metric.label} className={`metric-card ${metric.tone}`}>
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value">{metric.value}</div>
          <div className="metric-footnote">{metric.footnote}</div>
        </div>
      ))}
    </div>
  );
}

function ActionCard({ icon, title, copy, to, cta }: ActionCardProps) {
  return (
    <div className="action-card surface-card">
      <div className="action-card-icon">
        <i className={`ti ti-${icon}`} />
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <Link className="btn-soft btn-soft-outline" to={to}>
        <span>{cta}</span>
        <i className="ti ti-arrow-right" />
      </Link>
    </div>
  );
}

function TimelineItem({
  icon,
  title,
  time,
  copy,
}: {
  icon: string;
  title: string;
  time: string;
  copy: string;
}) {
  return (
    <div className="timeline-item">
      <div className="timeline-dot">
        <i className={`ti ti-${icon}`} />
      </div>
      <div>
        <h4>{title}</h4>
        <div className="timeline-time">{time}</div>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function primaryRoute(role: string | null) {
  if (role === 'Student') return '/checkin';
  if (role === 'Lecturer') return '/sessions/new';
  return '/admin/users';
}

function primaryLabel(role: string | null) {
  if (role === 'Student') return 'Scan attendance';
  if (role === 'Lecturer') return 'Start session';
  return 'Open admin tools';
}

function primaryIcon(role: string | null) {
  if (role === 'Student') return 'qrcode';
  if (role === 'Lecturer') return 'player-play';
  return 'shield-cog';
}
