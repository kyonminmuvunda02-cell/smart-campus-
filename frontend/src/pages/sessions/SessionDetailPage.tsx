import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Row, Col, Card, Alert, Spinner, Button, Badge, Table } from 'react-bootstrap';
import { AttendanceSessions, AttendanceRecords } from '../../client/sdk.gen';
import type { QrCodeResponse } from '../../client/types.gen';
import { getErrorMessage } from '../../utils/errors';
import QRDisplay from '../../components/qr/QRDisplay';
import PageHeader from '../../components/common/PageHeader';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const qc = useQueryClient();
  const [closeError, setCloseError] = useState<string | null>(null);

  const sessionQ = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data } = await AttendanceSessions.getAttendanceSession({ path: { session_id: id } });
      return data ?? null;
    },
  });

  const qrQ = useQuery({
    queryKey: ['session-qr', id],
    queryFn: async () => {
      const { data } = await AttendanceSessions.refreshQrCode({ path: { session_id: id } });
      return data ?? null;
    },
    // Refresh QR every 55s to stay ahead of the 60s TTL
    refetchInterval: 55_000,
    enabled: sessionQ.data?.is_active === true,
  });

  const recordsQ = useQuery({
    queryKey: ['session-records', id],
    queryFn: async () => {
      const { data } = await AttendanceRecords.listSessionRecords({ path: { session_id: id } });
      return data?.items ?? [];
    },
    // Poll every 15s while active so new check-ins appear automatically
    refetchInterval: sessionQ.data?.is_active ? 15_000 : false,
  });

  const closeMutation = useMutation({
    mutationFn: () => AttendanceSessions.closeAttendanceSession({ path: { session_id: id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['session-qr', id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (err) => setCloseError(getErrorMessage(err)),
  });

  if (sessionQ.isPending) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (sessionQ.error) return <Alert variant="danger" className="m-4">{getErrorMessage(sessionQ.error)}</Alert>;
  if (!sessionQ.data) return null;

  const session = sessionQ.data;
  const records = recordsQ.data ?? [];
  const fraudCount = records.filter((r) => r.fraud_flag).length;

  return (
    <Container fluid>
      <PageHeader
        title={`Session #${session.session_id}`}
        subtitle={`Course ${session.course_id} · ${session.semester} ${session.academic_year}`}
        action={
          session.is_active ? (
            <Button variant="danger" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              {closeMutation.isPending ? 'Closing…' : '🔒 Close Session'}
            </Button>
          ) : (
            <Badge bg="secondary" className="fs-6 px-3 py-2">Closed</Badge>
          )
        }
      />

      {closeError && <Alert variant="danger" className="mb-3">{closeError}</Alert>}

      <Row className="g-4">
        <Col md={5}>
          {session.is_active ? (
            qrQ.data ? (
              <QRCodePanel
                qr={qrQ.data}
                onExpire={() => qc.invalidateQueries({ queryKey: ['session-qr', id] })}
              />
            ) : (
              <Spinner animation="border" />
            )
          ) : (
            <Card className="border-0 shadow-sm text-center p-4">
              <p className="text-muted mb-0">Session is closed. QR code is no longer active.</p>
            </Card>
          )}
        </Col>

        <Col md={7}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Session Details</Card.Title>
              <dl className="row mb-0">
                <dt className="col-5 text-muted">Status</dt>
                <dd className="col-7">
                  <Badge bg={session.is_active ? 'success' : 'secondary'}>
                    {session.is_active ? 'Active' : 'Closed'}
                  </Badge>
                </dd>
                <dt className="col-5 text-muted">Start</dt>
                <dd className="col-7">{session.session_start.toLocaleString()}</dd>
                <dt className="col-5 text-muted">End</dt>
                <dd className="col-7">{session.session_end.toLocaleString()}</dd>
                <dt className="col-5 text-muted">Venue ID</dt>
                <dd className="col-7">{session.venue_id}</dd>
                <dt className="col-5 text-muted">Check-ins</dt>
                <dd className="col-7">
                  <strong>{records.length}</strong>
                  {fraudCount > 0 && <Badge bg="danger" className="ms-2">🚩 {fraudCount} flagged</Badge>}
                </dd>
              </dl>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">
                Check-ins ({records.length})
                {session.is_active && (
                  <small className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>auto-refreshing</small>
                )}
              </Card.Title>
              {recordsQ.isPending ? (
                <Spinner animation="border" size="sm" />
              ) : records.length === 0 ? (
                <Alert variant="warning" className="mb-0">No students have checked in yet.</Alert>
              ) : (
                <Table striped hover responsive size="sm">
                  <thead>
                    <tr><th>Student ID</th><th>Time</th><th>Status</th><th>Fraud</th></tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.attendance_id}>
                        <td>{r.student_id}</td>
                        <td>{r.checked_in_at.toLocaleTimeString()}</td>
                        <td>
                          <Badge bg={r.verification_status === 'Verified' ? 'success' : r.verification_status === 'Failed' ? 'danger' : 'warning'}>
                            {r.verification_status}
                          </Badge>
                        </td>
                        <td>{r.fraud_flag && <Badge bg="danger">🚩</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <Link to="/sessions" className="btn btn-outline-secondary btn-sm">← Back to Sessions</Link>
      </div>
    </Container>
  );
}

// Thin wrapper to adapt QrCodeResponse to QRDisplay's base64Image prop
function QRCodePanel({ qr, onExpire }: { qr: QrCodeResponse; onExpire: () => void }) {
  return <QRDisplay base64Image={qr.qr_image_base64} onExpire={onExpire} />;
}
