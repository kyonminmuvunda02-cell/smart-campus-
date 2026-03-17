import { Link } from 'react-router';
import { Button, Table, Card } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useSession } from '../hooks/useSession';

function getSessionState(session: Record<string, unknown>) {
  const isActive = Boolean(session.is_active);
  if (isActive) return { label: 'Live', tone: 'green' };

  const sessionStart = session.session_start ? new Date(session.session_start as string).getTime() : 0;
  if (sessionStart > Date.now()) return { label: 'Scheduled', tone: 'royal' };

  return { label: 'Closed', tone: 'red' };
}

export default function SessionListPage() {
  const { useList } = useSession();
  const { data, isLoading } = useList();
  const sessions = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];

  return (
    <div>
      <PageHeader title="Attendance Sessions" subtitle="Plan classes in advance, then start the live attendance window when the session begins.">
        <Link to="/sessions/new"><Button variant="primary"><i className="ti ti-plus me-2" />Schedule Session</Button></Link>
      </PageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={6} columns={5} />
      ) : sessions.length === 0 ? (
        <EmptyState icon="ti-calendar-off" title="No sessions yet" message="Schedule the first class session to build the teaching timetable.">
          <Link to="/sessions/new"><Button variant="primary">Schedule Session</Button></Link>
        </EmptyState>
      ) : (
        <Card className="border-0 shadow-sm">
          <Table responsive hover className="table-vcenter card-table mb-0">
            <thead><tr><th>Session</th><th>Course</th><th>Venue</th><th>Status</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {sessions.map((s: Record<string, unknown>) => {
                const state = getSessionState(s);
                return (
                  <tr key={s.session_id as number}>
                    <td className="fw-semibold">#{s.session_id as number}</td>
                    <td className="text-secondary">Course #{s.course_id as number}</td>
                    <td className="text-secondary">Venue #{s.venue_id as number}</td>
                    <td>
                      <span className={`status-pill ${state.tone}`}>
                        <i className={`ti ti-${state.label === 'Live' ? 'broadcast' : state.label === 'Scheduled' ? 'calendar-event' : 'lock'}`} />
                        {state.label}
                      </span>
                    </td>
                    <td className="text-secondary small">{s.session_start ? new Date(s.session_start as string).toLocaleString() : '-'}</td>
                    <td className="text-end">
                      <div className="table-actions">
                        <Link to={`/sessions/${s.session_id}`}>
                          <Button variant="outline-primary" size="sm"><i className="ti ti-eye" />View</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
