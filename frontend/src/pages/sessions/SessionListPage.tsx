import { useQuery } from '@tanstack/react-query';
import { Alert, Pagination, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import { AttendanceSessions } from '../../client/sdk.gen';
import { getErrorMessage } from '../../utils/errors';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';
import { useRole } from '../../hooks/useRole';

export default function SessionListPage() {
  const { isLecturer } = useRole();
  const { skip, limit, page, totalPages, goToPage, setTotal } = usePagination(20);

  const { data, isPending, error } = useQuery({
    queryKey: ['sessions', skip, limit],
    queryFn: async () => {
      const { data } = await AttendanceSessions.listAttendanceSessions({ query: { skip, limit } });
      if (data) setTotal(data.total);
      return data;
    },
  });

  const sessions = data?.items ?? [];
  const activeCount = sessions.filter((session) => session.is_active).length;

  return (
    <div>
      <PageHeader
        eyebrow="Lecturer and admin tools"
        title="Attendance sessions"
        subtitle={`${data?.total ?? 0} session${data?.total === 1 ? '' : 's'} in view.`}
        icon="timeline"
        tone="teal"
        action={
          isLecturer ? (
            <Link className="btn-soft btn-soft-primary" to="/sessions/new">
              <i className="ti ti-player-play" />
              <span>New session</span>
            </Link>
          ) : undefined
        }
      />

      <div className="stat-grid">
        <MetricCard label="Visible sessions" value={String(data?.total ?? 0)} tone="royal" footnote="Current page set" />
        <MetricCard label="Active now" value={String(activeCount)} tone="green" footnote="Live attendance windows" />
        <MetricCard label="Closed" value={String(Math.max(sessions.length - activeCount, 0))} tone="amber" footnote="Already ended" />
        <MetricCard label="View mode" value={isLecturer ? 'Own' : 'All'} tone="teal" footnote="Role-based scope" />
      </div>

      {isPending && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="ti ti-loader-2" />
          </div>
          <h3 style={{ fontWeight: 800 }}>Loading sessions</h3>
          <p className="text-muted mb-0">Fetching attendance windows and their current status.</p>
        </div>
      )}

      {error && <Alert variant="danger">{getErrorMessage(error)}</Alert>}

      {!isPending && !error && (
        <>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="ti ti-calendar-off" />
              </div>
              <h3 style={{ fontWeight: 800 }}>No sessions found</h3>
              <p className="text-muted mb-0">
                Once a lecturer opens attendance, the session list and live monitoring tools will
                appear here.
              </p>
            </div>
          ) : (
            <div className="smart-table table-scroll">
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Start</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.session_id}>
                      <td className="mono">{session.session_id}</td>
                      <td className="mono">{session.course_id}</td>
                      <td>{session.semester}</td>
                      <td>{session.session_start.toLocaleString()}</td>
                      <td>
                        {session.is_active ? (
                          <span className="pill green">
                            <i className="ti ti-circle-check" />
                            Active
                          </span>
                        ) : (
                          <span className="pill amber">
                            <i className="ti ti-lock" />
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <Link className="btn-soft btn-soft-outline" to={`/sessions/${session.session_id}`}>
                          <span>Inspect</span>
                          <i className="ti ti-arrow-right" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="mt-3">
              <Pagination.Prev onClick={() => goToPage(page - 1)} disabled={page === 1} />
              {Array.from({ length: totalPages }, (_, index) => (
                <Pagination.Item
                  key={index + 1}
                  active={index + 1 === page}
                  onClick={() => goToPage(index + 1)}
                >
                  {index + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => goToPage(page + 1)} disabled={page === totalPages} />
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  footnote,
}: {
  label: string;
  value: string;
  tone: 'royal' | 'green' | 'teal' | 'amber';
  footnote: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-footnote">{footnote}</div>
    </div>
  );
}
