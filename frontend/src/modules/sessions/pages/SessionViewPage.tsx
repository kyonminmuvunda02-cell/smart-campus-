import { useEffect, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useSession } from '../hooks/useSession';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useUser } from '@/modules/users/hooks/useUser';
import {
  buildLookupMap,
  getCourseDisplayName,
  getStudentDisplayName,
  getVenueDisplayName,
} from '@/utils/entityLabels';

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

function getSessionState(session: Record<string, unknown> | undefined) {
  if (!session) return 'unknown';
  if (Boolean(session.is_active)) return 'live';
  const sessionStart = session.session_start ? new Date(session.session_start as string).getTime() : 0;
  return sessionStart > Date.now() ? 'scheduled' : 'closed';
}

export default function SessionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showToast } = useToast();
  const { useDetail, useSessionRecords, start, close, refreshQr, remove } = useSession();
  const { useDetail: useCourseDetail } = useCourse();
  const { useDetail: useVenueDetail } = useVenue();
  const { useList: useUserList } = useUser();

  const sessionId = id ? Number(id) : undefined;
  const { data: session, isLoading } = useDetail(sessionId);
  const { data: recordsData } = useSessionRecords(sessionId);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const records = (recordsData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const sessionRecord = session as Record<string, unknown> | undefined;
  const sessionState = getSessionState(sessionRecord);
  const isLive = sessionState === 'live';
  const isScheduled = sessionState === 'scheduled';
  const showQrImage = Boolean(qrImage);

  const courseId = sessionRecord?.course_id as number | undefined;
  const venueId = sessionRecord?.venue_id as number | undefined;
  const { data: courseData } = useCourseDetail(courseId);
  const { data: venueData } = useVenueDetail(venueId);
  const { data: usersData } = useUserList({ query: { limit: 500 } }, role === 'Admin' || role === 'Lecturer');

  const userItems = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const studentLookup = buildLookupMap(userItems, 'user_id', (user) => getStudentDisplayName(user, user.user_id as number));
  const courseLabel = getCourseDisplayName(courseData as Record<string, unknown> | undefined, courseId);
  const venueLabel = getVenueDisplayName(venueData as Record<string, unknown> | undefined, venueId);

  useEffect(() => {
    const expiryValue = qrExpiry ?? (isLive ? String(sessionRecord?.qr_code_expiry ?? '') : null);
    setSecondsRemaining(getSecondsRemaining(expiryValue));
    if (!expiryValue) return undefined;
    const timer = window.setInterval(() => {
      setSecondsRemaining(getSecondsRemaining(expiryValue));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isLive, qrExpiry, sessionRecord?.qr_code_expiry]);

  async function handleStart() {
    try {
      const qrData = await start.mutateAsync({ path: { session_id: sessionId! } });
      setQrImage(qrData.qr_image_base64);
      setQrExpiry(qrData.qr_code_expiry.toString());
      showToast('success', 'Check-in opened', 'The class is now live for attendance.');
    } catch (err) {
      showToast('danger', 'Error', getErrorMessage(err));
    }
  }

  async function handleClose() {
    try {
      await close.mutateAsync({ path: { session_id: sessionId! } });
      showToast('success', 'Class finished', 'Attendance has been closed for this class.');
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
      showToast('success', 'QR rotated', 'Fresh QR code active.');
    } catch (err) {
      showToast('danger', 'Error', getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this class? This cannot be undone.')) return;
    try {
      await remove.mutateAsync({ path: { session_id: sessionId! } });
      showToast('success', 'Class Deleted', 'The class has been removed.');
      navigate('/sessions');
    } catch (err) {
      showToast('danger', 'Error', getErrorMessage(err));
    }
  }

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  if (!sessionRecord) return <EmptyState title="Class Not Found" message="The class you are looking for does not exist." />;

  return (
    <div>
      <PageHeader
        title={`Class Monitor #${sessionId}`}
        subtitle={`${courseLabel} | ${String(sessionRecord.session_type ?? 'Lecture')}`}
        icon="presentation"
        tone="teal"
        breadcrumbs={[
          { label: 'Teaching Ops', path: '/sessions' },
          { label: 'Classes', path: '/sessions' },
          { label: `Monitor #${sessionId}` },
        ]}
      >
        <Link to="/sessions"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        {isScheduled ? (
          <Link to={`/sessions/${sessionId}/edit`}>
            <Button variant="outline-secondary">
              <i className="ti ti-edit" />
              Edit Class
            </Button>
          </Link>
        ) : null}
        {isScheduled ? (
          <Button variant="outline-danger" onClick={() => void handleDelete()} disabled={remove.isPending}>
            <i className="ti ti-trash" />
            Delete Class
          </Button>
        ) : null}
        {isScheduled ? (
          <Button variant="primary" onClick={() => void handleStart()} disabled={start.isPending}>
            <i className="ti ti-player-play" />
            Open Check-in
          </Button>
        ) : null}
        {isLive ? (
          <Button variant="danger" onClick={() => void handleClose()} disabled={close.isPending}>
            <i className="ti ti-player-stop" />
            Finish Class
          </Button>
        ) : null}
      </PageHeader>

      <div className="stack gap-4">
        <div className="row g-4">
          <div className="col-md-8">
            <div className="surface-card h-100 pb-0 overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 mb-0 fw-bold text-navy">Live Control Room</h3>
                <span className={`status-pill ${isLive ? 'green' : isScheduled ? 'royal' : 'red'}`}>
                  <i className={`ti ti-${isLive ? 'broadcast' : isScheduled ? 'calendar-event' : 'lock'}`} />
                  {isLive ? 'Broadcasting' : isScheduled ? 'On Standby' : 'Closed'}
                </span>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-4 text-center border-end">
                  <div className="text-secondary small fw-bold uppercase mb-1">Check-ins</div>
                  <div className="h3 mb-0 fw-bold text-navy">{records.length}</div>
                </div>
                <div className="col-md-4 text-center border-end">
                  <div className="text-secondary small fw-bold uppercase mb-1">Risk Flags</div>
                  <div className="h3 mb-0 fw-bold text-amber">{records.filter((record) => record.fraud_flag).length}</div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="text-secondary small fw-bold uppercase mb-1">QR Expiry</div>
                  <div className="h3 mb-0 fw-bold text-royal mono">{isLive ? formatCountdown(secondsRemaining) : '--:--'}</div>
                </div>
              </div>

              <div className="bg-light-subtle border-top p-3 d-flex gap-2 justify-content-center flex-wrap">
                {isScheduled ? (
                  <Link to={`/sessions/${sessionId}/edit`}>
                    <Button variant="outline-secondary" size="sm">
                      <i className="ti ti-edit me-1" />
                      Edit Class
                    </Button>
                  </Link>
                ) : null}
                {isScheduled ? (
                  <Button variant="primary" size="sm" onClick={() => void handleStart()} disabled={start.isPending}>
                    <i className="ti ti-player-play me-1" />
                    Open Check-in
                  </Button>
                ) : null}
                {isLive ? (
                  <>
                    <Button variant="outline-secondary" size="sm" onClick={() => void handleRefreshQr()} disabled={refreshQr.isPending}>
                      <i className="ti ti-refresh me-1" />
                      {showQrImage ? 'Regenerate QR Code' : 'Generate QR Code'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void handleClose()} disabled={close.isPending}>
                      <i className="ti ti-player-stop me-1" /> Finish Class
                    </Button>
                  </>
                ) : null}
                {!isScheduled && !isLive ? (
                  <span className="small text-secondary fw-medium">This class is closed. QR broadcast controls are no longer available.</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="surface-card h-100 d-flex flex-column align-items-center justify-content-center bg-navy text-white text-center p-4 shadow-lg border-0" style={{ minHeight: '260px' }}>
              {showQrImage ? (
                <>
                  <div className="bg-white p-2 rounded-3 shadow-sm mb-3">
                    <img src={`data:image/png;base64,${qrImage}`} alt="Attendance QR" style={{ width: '140px', height: '140px' }} />
                  </div>
                  <div className="small text-white opacity-75 fw-medium">Students must scan this code</div>
                </>
              ) : (
                <>
                  <div className="sb-avatar xl bg-white text-navy mb-3 opacity-25">
                    <i className="ti ti-qrcode fs-1" />
                  </div>
                  <h5 className="mb-2 text-white opacity-75">
                    {isScheduled ? 'Open check-in to generate QR' : isLive ? 'Generate the current QR' : 'Class Inactive'}
                  </h5>
                  <div className="small text-white opacity-50">
                    {isScheduled
                      ? 'Attendance broadcast has not started yet for this class.'
                      : isLive
                        ? 'This live class can issue a fresh QR code on demand.'
                        : 'Closed classes do not expose QR broadcast controls.'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="surface-card">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Verified Check-in Stream</h3>
            <span className="text-muted small">{records.length} Records Verified</span>
          </div>

          {records.length === 0 ? (
            <div className="py-5">
              <EmptyState
                icon="ti-users-minus"
                title="No activity recorded"
                message={isLive ? 'The broadcast is active but no students have checked in yet.' : 'This class record has no attendance data.'}
              />
            </div>
          ) : (
            <>
            <div className="d-none d-md-block table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle">
                  <tr>
                    <th className="ps-4 border-0 py-2 small fw-bold text-secondary uppercase">Student Identity</th>
                    <th className="border-0 py-2 small fw-bold text-secondary uppercase text-center">Verification</th>
                    <th className="border-0 py-2 small fw-bold text-secondary uppercase">Check-in Time</th>
                    <th className="text-end pe-4 border-0 py-2 small fw-bold text-secondary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {records.map((record) => (
                    <tr key={String(record.attendance_id)}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="sb-avatar bg-accent-lt text-accent small">
                            {studentLookup.get(record.student_id as number)?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div className="entity-copy">
                            <strong className="text-navy">{studentLookup.get(record.student_id as number) || `Student #${record.student_id}`}</strong>
                            <span className="smaller text-muted">Device Binding: {String(record.device_id ?? 'Unknown').slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                          <i className={`ti ti-${record.fraud_flag ? 'alert-triangle' : 'circle-check'}`} />
                          {record.fraud_flag ? 'Risk Flagged' : 'Verified'}
                        </span>
                      </td>
                      <td className="py-3 mono small text-secondary">
                        {record.checked_in_at ? new Date(record.checked_in_at as string).toLocaleTimeString() : '-'}
                      </td>
                      <td className="text-end pe-4 py-3">
                        <Button variant="outline-secondary" size="sm" className="border-0 shadow-none">
                          <i className="ti ti-dots-vertical" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="d-md-none mobile-record-list">
              {records.map((record) => (
                <div key={String(record.attendance_id)} className="mobile-record-card">
                  <div className="mobile-record-head">
                    <div className="d-flex align-items-center gap-3">
                      <div className="sb-avatar bg-accent-lt text-accent small">
                        {studentLookup.get(record.student_id as number)?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                      <div>
                        <span className="mobile-record-title">{studentLookup.get(record.student_id as number) || `Student #${record.student_id}`}</span>
                        <span className="mobile-record-meta">Device: {String(record.device_id ?? 'Unknown').slice(0, 8)}...</span>
                      </div>
                    </div>
                    <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                      <i className={`ti ti-${record.fraud_flag ? 'alert-triangle' : 'circle-check'}`} />
                      {record.fraud_flag ? 'Risk Flagged' : 'Verified'}
                    </span>
                  </div>

                  <div className="detail-list">
                    <div className="detail-row">
                      <div className="detail-label">Check-in Time</div>
                      <div className="detail-value mono">
                        {record.checked_in_at ? new Date(record.checked_in_at as string).toLocaleTimeString() : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="surface-card">
              <h4 className="h6 fw-bold uppercase tracking-wider text-secondary mb-3 border-bottom pb-2">Location Trust</h4>
              <div className="d-flex align-items-center gap-3">
                <div className="sb-avatar bg-light text-navy">
                  <i className="ti ti-map-pin" />
                </div>
                <div>
                  <div className="fw-bold text-navy">{venueLabel}</div>
                  <div className="small text-muted">Geofence Radius: {venueData ? (venueData as { radius_meters?: number }).radius_meters ?? 'N/A' : 'N/A'} meters</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="surface-card">
              <h4 className="h6 fw-bold uppercase tracking-wider text-secondary mb-3 border-bottom pb-2">Academic Context</h4>
              <div className="d-flex align-items-center gap-3">
                <div className="sb-avatar bg-light text-navy">
                  <i className="ti ti-calendar-time" />
                </div>
                <div>
                  <div className="fw-bold text-navy">{String(sessionRecord.session_type ?? 'Lecture')} class</div>
                  <div className="small text-muted">{String(sessionRecord.semester ?? 'Current Semester')} | {String(sessionRecord.academic_year ?? 'Current Year')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
