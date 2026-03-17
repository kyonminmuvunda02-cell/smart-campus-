import { useQuery } from '@tanstack/react-query';
import { Container, Table, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { Audit } from '../../client/sdk.gen';
import { getErrorMessage } from '../../utils/errors';
import PageHeader from '../../components/common/PageHeader';
import { usePagination } from '../../hooks/usePagination';

export default function AuditLogPage() {
  const { skip, limit, page, totalPages, goToPage, setTotal } = usePagination(25);

  const { data, isPending, error } = useQuery({
    queryKey: ['audit-logs', skip, limit],
    queryFn: async () => {
      const { data } = await Audit.listAuditLogs({ query: { skip, limit } });
      if (data) setTotal(data.total);
      return data;
    },
  });

  const logs = data?.items ?? [];

  if (isPending && logs.length === 0) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger" className="m-4">{getErrorMessage(error)}</Alert>;

  return (
    <Container fluid className="py-4">
      <PageHeader title="Audit Logs" subtitle={`${data?.total ?? 0} entries — most recent first`} />

      {logs.length === 0 && <Alert variant="warning">No audit log entries found.</Alert>}

      <Table striped hover responsive className="small">
        <thead>
          <tr>
            <th>#</th><th>Timestamp</th><th>User ID</th>
            <th>Action</th><th>Table</th><th>Record ID</th><th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.log_id}>
              <td className="text-muted">{log.log_id}</td>
              {/* created_at is a Date object */}
              <td style={{ whiteSpace: 'nowrap' }}>{log.created_at.toLocaleString()}</td>
              <td>{log.user_id ?? '—'}</td>
              <td>
                <Badge bg={actionBg(log.action)}>{log.action}</Badge>
              </td>
              <td><code>{log.table_name ?? '—'}</code></td>
              <td>{log.record_id ?? '—'}</td>
              <td className="text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {log.detail ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="mt-3">
          <Pagination.Prev onClick={() => goToPage(page - 1)} disabled={page === 1} />
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <Pagination.Item key={i + 1} active={i + 1 === page} onClick={() => goToPage(i + 1)}>
              {i + 1}
            </Pagination.Item>
          ))}
          {totalPages > 10 && <Pagination.Ellipsis />}
          <Pagination.Next onClick={() => goToPage(page + 1)} disabled={page === totalPages} />
        </Pagination>
      )}
    </Container>
  );
}

function actionBg(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('remove') || a.includes('revoke')) return 'danger';
  if (a.includes('create') || a.includes('insert') || a.includes('issue')) return 'success';
  if (a.includes('update') || a.includes('patch') || a.includes('close')) return 'warning';
  if (a.includes('login') || a.includes('logout')) return 'info';
  return 'secondary';
}
