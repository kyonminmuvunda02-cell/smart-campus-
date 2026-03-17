import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import { useSession } from '../hooks/useSession';

function getSecondsRemaining(expiryValue: string | null) {
  if (!expiryValue) return 0;
  const diff = Math.max(0, Math.floor((new Date(expiryValue).getTime() - Date.now()) / 1000));
  return diff;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default function SessionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useDetail, useSessionRecords, close, refreshQr } = useSession();

  const sessionId = id ? Number(id) : undefined;
  const { data: session, isLoading } = useDetail(sessionId);
  const { data: recordsData } = useSessionRecords(sessionId);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const records = (recordsData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const sessionRecord = session as Record<string, unknown> | undefined;
  const isActive = Boolean(sessionRecord?.is_active);
  const flaggedCount = records.filter((record) => Boolean(record.fraud_flag)).length;
  const sessionMeta = {
    courseId: sessionRecord?.course_id as number | undefined,
    venueId: sessionRecord?.venue_id as number | undefined,
    semester: sessionRecord?.semester as string | undefined,
    academicYear: sessionRecord?.academic_year as string | undefined,
  };

  useEffect(() => {
    const expiryValue = qrExpiry ?? String(sessionRecord?.qr_code_expiry ?? '');
    setSecondsRemaining(getSecondsRemaining(expiryValue));
    const timer = window.setInterval(() => {
      setSecondsRemaining(getSecondsRemaining(expiryValue));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [qrExpiry, sessionRecord?.qr_code_expiry]);

  async function handleClose() {
    try {
      await close.mutateAsync({ path: { session_id: sessionId! } });
      showToast('success', 'Session closed', 'Attendance collection has been stopped.');
      navigate('/sessions');
    } catch (err) {
      showToast('danger', 'Error', getErrorMessage(err));
    }
  }

  async function handleRefreshQr() {
    try {
      const qrData = await refreshQr.mutateAsync({ path: { session_id: sessionId! } });
      setQrImage(qrData.qr_image_base64);
      setQrExpiry(qrData.qr_code_expiry.toString());
      showToast('success', 'QR rotated', 'A fresh attendance QR code is now active.');
    } catch (err) {
      showToast('danger', 'Error', getErrorMessage(err));
    }
  }

  if (isLoading) {
    return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading session...</div></div>;
  }

  if (!sessionRecord) {
    return <div className="empty-panel"><i className="ti ti-mood-empty" /><div>Session not found.</div></div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lecturer session monitor"
        title={`Session #${sessionRecord.session_id}`}
        subtitle={isActive ? 'Attendance window is live and collecting verified check-ins.' : 'This session has been closed.'}
        icon="presentation"
        tone="teal"
      >
        <Link to="/sessions"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        {isActive ? (
          <>
            <Button variant="outline-secondary" onClick={() => void handleRefreshQr()} disabled={refreshQr.isPending}>
              <i className="ti ti-refresh" />
              {qrImage ? 'Rotate QR' : 'Generate QR'}
            </Button>
            <Button variant="danger" onClick={() => void handleClose()} disabled={close.isPending}>
              <i className="ti ti-player-stop" />
              Close session
            </Button>
          </>
        ) : null}
      </PageHeader>

      <div className="session-stat-row" style={{ marginBottom: '1rem' }}>
        <div className="session-stat"><label>Scanned in</label><strong>{records.length}</strong></div>
        <div className="session-stat"><label>Flagged</label><strong>{flaggedCount}</strong></div>
        <div className="session-stat"><label>QR countdown</label><strong>{isActive ? formatCountdown(secondsRemaining) : 'Closed'}</strong></div>
      </div>

      <div className="session-grid">
        <div className="surface-card session-qr-card">
          <div className="session-qr-board">
            <div className="section-title">
              <div>
                <h3>Live QR access</h3>
                <div className="section-subtle">
                  {qrImage
                    ? 'This image is the current active code. Rotating it will invalidate the previous QR immediately.'
                    : 'Generate the QR when you are ready to admit scans into the active attendance window.'}
                </div>
              </div>
              <span className={`status-pill ${isActive ? 'green' : 'red'}`}>
                <i className={`ti ti-${isActive ? 'circle-filled' : 'lock'}`} />
                {isActive ? 'Live' : 'Closed'}
              </span>
            </div>

            <div className="session-qr-frame">
              {qrImage ? (
                <>
                  <img src={`data:image/png;base64,${qrImage}`} alt="Attendance QR code" />
                  <div className="mt-3">
                    <div className="status-pill royal"><i className="ti ti-clock" />Expires in {formatCountdown(secondsRemaining)}</div>
                  </div>
                </>
              ) : (
                <div className="empty-panel">
                  <i className="ti ti-qrcode-off" />
                  <div className="callout-title">No QR generated yet</div>
                  <div className="callout-copy">Generate the current code when students are ready to check in.</div>
                </div>
              )}
            </div>

            <div className="callout-panel teal">
              <i className="ti ti-shield-lock" style={{ color: 'var(--teal)' }} />
              <div>
                <div className="callout-title">Live-session validation remains strict</div>
                <div className="callout-copy">
                  Students must submit the exact QR UUID plus their device binding and location proof for this session.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="surface-card session-feed-card">
            <div className="section-title">
              <div>
                <h3>Session details</h3>
                <div className="section-subtle">Operational metadata for this attendance window</div>
              </div>
            </div>
            <div className="mini-timeline">
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-book" /></div>
                <div className="timeline-text">
                  <strong>Course #{sessionMeta.courseId ?? '-'}</strong>
                  <span>{sessionMeta.semester ?? '-'} / {sessionMeta.academicYear ?? '-'}</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-building" /></div>
                <div className="timeline-text">
                  <strong>Venue #{sessionMeta.venueId ?? '-'}</strong>
                  <span>Attendance is accepted only while the geofenced session remains active.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card session-feed-card">
            <div className="section-title">
              <div>
                <h3>Attendance feed</h3>
                <div className="section-subtle">Live view of accepted records and risk markers</div>
              </div>
              <span className="status-pill royal"><i className="ti ti-users" />{records.length} records</span>
            </div>

            {records.length === 0 ? (
              <div className="empty-panel">
                <i className="ti ti-users-off" />
                <div className="callout-title">No check-ins yet</div>
                <div className="callout-copy">Once students submit valid scans, they will appear here in real time.</div>
              </div>
            ) : (
              <div className="table-shell">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.attendance_id as number}>
                        <td className="fw-semibold">Student #{record.student_id as number}</td>
                        <td className="mono">{record.checked_in_at ? new Date(record.checked_in_at as string).toLocaleTimeString() : '-'}</td>
                        <td>
                          <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                            <i className={`ti ti-${record.fraud_flag ? 'alert-triangle' : 'circle-check'}`} />
                            {record.fraud_flag ? 'Flagged' : 'Verified'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
