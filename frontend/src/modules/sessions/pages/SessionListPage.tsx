import { Link } from 'react-router';
import { Button, Table, Card, Badge } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useSession } from '../hooks/useSession';

export default function SessionListPage() {
  const { useList } = useSession();
  const { data, isLoading } = useList();
  const sessions = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];

  return (
    <div>
      <PageHeader title="Attendance Sessions" subtitle="Manage QR-based attendance sessions">
        <Link to="/sessions/new"><Button variant="primary"><i className="ti ti-plus me-2" />New Session</Button></Link>
      </PageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={6} columns={5} />
      ) : sessions.length === 0 ? (
        <EmptyState icon="ti-presentation-off" title="No sessions yet" message="Start your first attendance session.">
          <Link to="/sessions/new"><Button variant="primary">Start Session</Button></Link>
        </EmptyState>
      ) : (
        <Card className="border-0 shadow-sm">
          <Table responsive hover className="table-vcenter card-table mb-0">
            <thead><tr><th>Session</th><th>Course</th><th>Venue</th><th>Status</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {sessions.map((s: Record<string, unknown>) => (
                <tr key={s.session_id as number}>
                  <td className="fw-semibold">#{s.session_id as number}</td>
                  <td className="text-secondary">Course #{s.course_id as number}</td>
                  <td className="text-secondary">Venue #{s.venue_id as number}</td>
                  <td><Badge bg={s.is_active ? 'success' : 'secondary'}>{s.is_active ? 'Active' : 'Closed'}</Badge></td>
                  <td className="text-secondary small">{s.session_start ? new Date(s.session_start as string).toLocaleDateString() : '-'}</td>
                  <td className="text-end">
                    <div className="table-actions">
                      <Link to={`/sessions/${s.session_id}`}>
                        <Button variant="outline-primary" size="sm"><i className="ti ti-eye" />View</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
