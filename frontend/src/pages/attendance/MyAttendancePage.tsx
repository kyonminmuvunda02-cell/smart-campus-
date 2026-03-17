import { useQuery } from '@tanstack/react-query';
import { Alert, Pagination, Spinner, Table } from 'react-bootstrap';
import { AttendanceRecords } from '../../client/sdk.gen';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errors';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/common/PageHeader';

export default function MyAttendancePage() {
  const { userId } = useAuth();
  const { skip, limit, page, totalPages, goToPage, setTotal } = usePagination(20);

  const { data, isPending, error } = useQuery({
    queryKey: ['my-attendance', userId, skip, limit],
    queryFn: async () => {
      const { data } = await AttendanceRecords.listStudentRecords({
        path: { student_id: userId! },
        query: { skip, limit },
      });
      if (data) setTotal(data.total);
      return data;
    },
    enabled: !!userId,
  });

  const records = data?.items ?? [];
  const verified = records.filter((record) => record.verification_status === 'Verified').length;
  const pending = records.filter((record) => record.verification_status === 'Pending').length;
  const failed = records.filter((record) => record.verification_status === 'Failed').length;
  const flagged = records.filter((record) => record.fraud_flag).length;
  const rate = records.length === 0 ? 0 : Math.round((verified / records.length) * 100);

  return (
    <div>
      <PageHeader
        eyebrow="Student analytics"
        title="My attendance"
        subtitle={`${data?.total ?? 0} attendance records captured across your sessions.`}
        icon="calendar-check"
        tone="royal"
      />

      <div className="stat-grid">
        <MetricCard label="Verified" value={String(verified)} tone="green" footnote="Accepted records" />
        <MetricCard label="Pending" value={String(pending)} tone="amber" footnote="Awaiting review" />
        <MetricCard label="Failed" value={String(failed)} tone="royal" footnote="Rejected check-ins" />
        <MetricCard label="Overall rate" value={`${rate}%`} tone="teal" footnote="Verified on this page" />
      </div>

      {flagged > 0 && (
        <div className="info-callout amber">
          <i className="ti ti-alert-triangle" />
          <div>
            <div className="info-callout-title">{flagged} record(s) flagged for review</div>
            <div className="info-callout-copy">
              These records were captured with missing GPS accuracy or another verification issue.
            </div>
          </div>
        </div>
      )}

      {isPending && <Spinner animation="border" className="d-block mx-auto mt-5" />}
      {error && <Alert variant="danger">{getErrorMessage(error)}</Alert>}

      {!isPending && !error && (
        <>
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="ti ti-calendar-off" />
              </div>
              <h3 style={{ fontWeight: 800 }}>No attendance records yet</h3>
              <p className="text-muted mb-0">
                Once you start scanning active sessions, your history and verification results will
                appear here.
              </p>
            </div>
          ) : (
            <div className="smart-table table-scroll">
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Attendance ID</th>
                    <th>Session</th>
                    <th>Checked in</th>
                    <th>Status</th>
                    <th>Fraud flag</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.attendance_id}>
                      <td className="mono">{record.attendance_id}</td>
                      <td className="mono">{record.session_id}</td>
                      <td>{record.checked_in_at.toLocaleString()}</td>
                      <td>
                        <StatusBadge status={record.verification_status} />
                      </td>
                      <td>
                        {record.fraud_flag ? (
                          <span className="pill red">
                            <i className="ti ti-flag-3" />
                            Flagged
                          </span>
                        ) : (
                          <span className="pill green">
                            <i className="ti ti-shield-check" />
                            Clear
                          </span>
                        )}
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'Verified') {
    return (
      <span className="pill green">
        <i className="ti ti-circle-check" />
        Verified
      </span>
    );
  }

  if (status === 'Pending') {
    return (
      <span className="pill amber">
        <i className="ti ti-clock-hour-4" />
        Pending
      </span>
    );
  }

  return (
    <span className="pill red">
      <i className="ti ti-circle-x" />
      {status}
    </span>
  );
}
