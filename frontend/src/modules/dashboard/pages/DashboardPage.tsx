import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/modules/auth/context/AuthProvider';

export default function DashboardPage() {
  const { role } = useAuth();

  if (role === 'Student') {
    return (
      <div>
        <PageHeader
          eyebrow="Student workspace"
          title="Attendance at a glance"
          subtitle="Track live attendance status, on-campus verification, and upcoming classes from one surface."
          icon="layout-dashboard"
          tone="royal"
        >
          <Link to="/checkin"><Button variant="primary"><i className="ti ti-qrcode" />Scan QR</Button></Link>
          <Link to="/my-attendance"><Button variant="outline-secondary"><i className="ti ti-calendar-check" />History</Button></Link>
        </PageHeader>

        <div className="stat-grid">
          <div className="metric-card royal">
            <div className="metric-head">
              <div className="metric-icon royal"><i className="ti ti-chart-bar" /></div>
              <span className="status-pill royal">Stable</span>
            </div>
            <div className="metric-value">92%</div>
            <div className="metric-label">Attendance rate</div>
            <div className="metric-meta">Above the exam eligibility threshold</div>
          </div>
          <div className="metric-card green">
            <div className="metric-head">
              <div className="metric-icon green"><i className="ti ti-circle-check" /></div>
              <span className="status-pill green">24 records</span>
            </div>
            <div className="metric-value">18</div>
            <div className="metric-label">Verified check-ins</div>
            <div className="metric-meta">No unresolved verification disputes</div>
          </div>
          <div className="metric-card amber">
            <div className="metric-head">
              <div className="metric-icon amber"><i className="ti ti-alert-triangle" /></div>
              <span className="status-pill amber">Needs review</span>
            </div>
            <div className="metric-value">01</div>
            <div className="metric-label">Flagged record</div>
            <div className="metric-meta">One low-confidence scan is awaiting lecturer review</div>
          </div>
          <div className="metric-card teal">
            <div className="metric-head">
              <div className="metric-icon teal"><i className="ti ti-book" /></div>
              <span className="status-pill teal">This term</span>
            </div>
            <div className="metric-value">06</div>
            <div className="metric-label">Active modules</div>
            <div className="metric-meta">Your weekly attendance coverage is healthy</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="stack">
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Attendance snapshot</h3>
                  <div className="section-subtle">Recent module performance and compliance trend</div>
                </div>
                <span className="status-pill green"><i className="ti ti-trending-up" />Healthy trend</span>
              </div>
              <div className="table-shell">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Rate</th>
                      <th>Latest</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-semibold">CS301 Web Development</td>
                      <td className="mono">95%</td>
                      <td className="mono">08:03</td>
                      <td><span className="status-pill green">Present</span></td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">CS315 Data Security</td>
                      <td className="mono">90%</td>
                      <td className="mono">Tue 11:00</td>
                      <td><span className="status-pill green">Present</span></td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">CS325 Networks</td>
                      <td className="mono">78%</td>
                      <td className="mono">Mon 14:00</td>
                      <td><span className="status-pill amber">Watch</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="callout-panel teal">
              <i className="ti ti-shield-check" style={{ color: 'var(--teal)' }} />
              <div>
                <div className="callout-title">Identity and location remain linked</div>
                <div className="callout-copy">
                  Every attendance scan is tied to the device fingerprint generated at sign-in and checked against live geolocation.
                </div>
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="gps-widget-shell">
              <div className="gps-map">
                <div className="gps-ring" />
                <div className="gps-dot" />
              </div>
              <div className="gps-body">
                <div className="section-title" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <h3>Campus location</h3>
                    <div className="section-subtle">Ready for geofenced attendance capture</div>
                  </div>
                </div>
                <div className="gps-row">
                  <div className="gps-status">On campus</div>
                  <div className="gps-coords">-15.4166, 28.2827</div>
                </div>
              </div>
            </div>

            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Today&apos;s timeline</h3>
                  <div className="section-subtle">What matters next in your academic day</div>
                </div>
              </div>
              <div className="mini-timeline">
                <div className="timeline-row">
                  <div className="timeline-pin"><i className="ti ti-presentation" /></div>
                  <div className="timeline-text">
                    <strong>CS301 Web Development</strong>
                    <span>08:00 - 10:00, LT-1, attendance window currently open</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-pin"><i className="ti ti-book" /></div>
                  <div className="timeline-text">
                    <strong>CS315 Data Security</strong>
                    <span>11:00 - 13:00, QR access opens 15 minutes before class</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-pin"><i className="ti ti-bell" /></div>
                  <div className="timeline-text">
                    <strong>Compliance reminder</strong>
                    <span>Keep attendance above 85% to remain in good standing.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'Lecturer') {
    return (
      <div>
        <PageHeader
          eyebrow="Lecturer workspace"
          title="Live session control"
          subtitle="Open attendance windows, rotate QR access, and monitor fraud signals while class is in progress."
          icon="presentation"
          tone="teal"
        >
          <Link to="/sessions/new"><Button variant="primary"><i className="ti ti-plus" />Start Session</Button></Link>
          <Link to="/sessions"><Button variant="outline-secondary"><i className="ti ti-list" />All Sessions</Button></Link>
        </PageHeader>

        <div className="stat-grid">
          <div className="metric-card teal">
            <div className="metric-head">
              <div className="metric-icon teal"><i className="ti ti-broadcast" /></div>
              <span className="status-pill green">Live now</span>
            </div>
            <div className="metric-value">01</div>
            <div className="metric-label">Active session</div>
            <div className="metric-meta">CS301 is currently collecting attendance</div>
          </div>
          <div className="metric-card green">
            <div className="metric-head">
              <div className="metric-icon green"><i className="ti ti-users" /></div>
              <span className="status-pill green">34 scanned</span>
            </div>
            <div className="metric-value">87%</div>
            <div className="metric-label">Current capture rate</div>
            <div className="metric-meta">High turnout before the first hour closes</div>
          </div>
          <div className="metric-card amber">
            <div className="metric-head">
              <div className="metric-icon amber"><i className="ti ti-shield-exclamation" /></div>
              <span className="status-pill amber">2 alerts</span>
            </div>
            <div className="metric-value">02</div>
            <div className="metric-label">Flagged scans</div>
            <div className="metric-meta">Shared-device and missing-GPS events need review</div>
          </div>
          <div className="metric-card royal">
            <div className="metric-head">
              <div className="metric-icon royal"><i className="ti ti-calendar-event" /></div>
              <span className="status-pill royal">This week</span>
            </div>
            <div className="metric-value">08</div>
            <div className="metric-label">Scheduled classes</div>
            <div className="metric-meta">Three sessions remain before Friday close</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="stack">
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Session board</h3>
                  <div className="section-subtle">Operational snapshot of attendance windows you control</div>
                </div>
              </div>
              <div className="stack">
                <div className="surface-card section-card">
                  <div className="section-title">
                    <div>
                      <h3>CS301 Web Development</h3>
                      <div className="section-subtle">LT-1 • expires in 00:24</div>
                    </div>
                    <span className="status-pill green"><i className="ti ti-circle-filled" />Live</span>
                  </div>
                  <div className="session-stat-row">
                    <div className="session-stat"><label>Scanned</label><strong>34</strong></div>
                    <div className="session-stat"><label>Absent</label><strong>06</strong></div>
                    <div className="session-stat"><label>Flagged</label><strong>02</strong></div>
                  </div>
                </div>
                <div className="callout-panel amber">
                  <i className="ti ti-alert-circle" style={{ color: 'var(--amber)' }} />
                  <div>
                    <div className="callout-title">Two submissions need lecturer attention</div>
                    <div className="callout-copy">
                      One device-sharing alert and one GPS-accuracy exception were recorded in the current session.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Operational guidance</h3>
                  <div className="section-subtle">Best-practice reminders for live attendance capture</div>
                </div>
              </div>
              <div className="mini-timeline">
                <div className="timeline-row">
                  <div className="timeline-pin"><i className="ti ti-qrcode" /></div>
                  <div className="timeline-text">
                    <strong>Rotate the QR only when necessary</strong>
                    <span>Refreshing a live code invalidates the last one immediately for students still scanning.</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-pin"><i className="ti ti-map-pin" /></div>
                  <div className="timeline-text">
                    <strong>Watch geofence exceptions</strong>
                    <span>Low-confidence scans usually signal permission issues or attempted remote attendance.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin workspace"
        title="System operations overview"
        subtitle="Manage the academic directory, review platform health, and watch compliance indicators across the campus."
        icon="shield"
        tone="purple"
      >
        <Link to="/users"><Button variant="primary"><i className="ti ti-users" />Manage users</Button></Link>
        <Link to="/audit"><Button variant="outline-secondary"><i className="ti ti-file-text" />View audit log</Button></Link>
      </PageHeader>

      <div className="stat-grid">
        <div className="metric-card royal">
          <div className="metric-head">
            <div className="metric-icon royal"><i className="ti ti-users" /></div>
            <span className="status-pill royal">Directory</span>
          </div>
          <div className="metric-value">526</div>
          <div className="metric-label">Active identities</div>
          <div className="metric-meta">Students, lecturers, and administrators under governance</div>
        </div>
        <div className="metric-card green">
          <div className="metric-head">
            <div className="metric-icon green"><i className="ti ti-shield-check" /></div>
            <span className="status-pill green">Healthy</span>
          </div>
          <div className="metric-value">99.4%</div>
          <div className="metric-label">Platform integrity</div>
          <div className="metric-meta">Attendance capture is stable across the reporting window</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-head">
            <div className="metric-icon amber"><i className="ti ti-alert-triangle" /></div>
            <span className="status-pill amber">Requires attention</span>
          </div>
          <div className="metric-value">07</div>
          <div className="metric-label">Open exceptions</div>
          <div className="metric-meta">Low-confidence scans and enrollment mismatches still need action</div>
        </div>
        <div className="metric-card teal">
          <div className="metric-head">
            <div className="metric-icon teal"><i className="ti ti-broadcast" /></div>
            <span className="status-pill teal">Live sessions</span>
          </div>
          <div className="metric-value">03</div>
          <div className="metric-label">Classes running now</div>
          <div className="metric-meta">Real-time attendance events are flowing into the audit stream</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Control surfaces</h3>
                <div className="section-subtle">The areas administrators touch most often</div>
              </div>
            </div>
            <div className="hero-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <Link to="/users" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--royal-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-users" style={{ color: 'var(--royal)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Identity management</strong>
                  <span style={{ color: 'var(--tx3)' }}>Create and govern student and lecturer accounts.</span>
                </div>
              </Link>
              <Link to="/courses" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--green-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-books" style={{ color: 'var(--green)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Academic catalog</strong>
                  <span style={{ color: 'var(--tx3)' }}>Keep courses and teaching structure consistent.</span>
                </div>
              </Link>
              <Link to="/venues" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--teal-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-building" style={{ color: 'var(--teal)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Venue control</strong>
                  <span style={{ color: 'var(--tx3)' }}>Maintain where attendance can legally be captured.</span>
                </div>
              </Link>
              <Link to="/audit" className="text-decoration-none">
                <div className="hero-feature" style={{ background: 'var(--purple-lt)', color: 'var(--tx1)' }}>
                  <i className="ti ti-file-text" style={{ color: 'var(--purple)' }} />
                  <strong style={{ color: 'var(--tx1)' }}>Audit evidence</strong>
                  <span style={{ color: 'var(--tx3)' }}>Inspect disputed scans and system-side events.</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="callout-panel amber">
            <i className="ti ti-shield-exclamation" style={{ color: 'var(--amber)' }} />
            <div>
              <div className="callout-title">Policy reminder</div>
              <div className="callout-copy">
                Avoid rotating QR sessions from read-only views unless the classroom needs a fresh attendance window.
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Recent focus areas</h3>
                <div className="section-subtle">Where admin effort is currently best spent</div>
              </div>
            </div>
            <div className="mini-timeline">
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-alert-circle" /></div>
                <div className="timeline-text">
                  <strong>Review open attendance exceptions</strong>
                  <span>Seven records still require a compliance decision before closeout.</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-building-bank" /></div>
                <div className="timeline-text">
                  <strong>Validate venue inventory</strong>
                  <span>Ensure live attendance sessions are only tied to approved physical spaces.</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-users-group" /></div>
                <div className="timeline-text">
                  <strong>Complete enrollment hygiene</strong>
                  <span>Incomplete enrollment workflows will undermine trust in attendance reports.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
