import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
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

function formatDateTime(value: unknown) {
  return value ? new Date(String(value)).toLocaleString() : '-';
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
  const { showToast } = useToast();
  const { useDetail, useSessionRecords, start, update, close, refreshQr } = useSession();
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
  const flaggedCount = records.filter((record) => Boolean(record.fraud_flag)).length;
  const courseId = sessionRecord?.course_id as number | undefined;
  const venueId = sessionRecord?.venue_id as number | undefined;
  const { data: courseData } = useCourseDetail(courseId);
  const { data: venueData } = useVenueDetail(venueId);
  const { data: usersData } = useUserList({ query: { limit: 500 } });
  const userItems = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const studentLookup = buildLookupMap(userItems, 'user_id', (user) => getStudentDisplayName(user, user.user_id as number));
  const courseLabel = getCourseDisplayName(courseData as Record<string, unknown> | undefined, courseId);
  const venueLabel = getVenueDisplayName(venueData as Record<string, unknown> | undefined, venueId);
  const sessionMeta = {
    sessionType: sessionRecord?.session_type as string | undefined,
    timetableSlot: sessionRecord?.timetable_slot as string | undefined,
    semester: sessionRecord?.semester as string | undefined,
    academicYear: sessionRecord?.academic_year as string | undefined,
  };
  const venueRecord = venueData as Record<string, unknown> | undefined;
  const geofenceReady = [venueRecord?.latitude, venueRecord?.longitude, venueRecord?.radius_meters].every(
    (value) => value !== null && value !== undefined
  );
  const sessionEnd = sessionRecord?.session_end ? new Date(sessionRecord.session_end as string) : null;
  const minutesRemaining = sessionEnd ? Math.max(0, Math.round((sessionEnd.getTime() - Date.now()) / 60000)) : 0;

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
      showToast('success', 'Attendance started', 'The scheduled session is now live and students can begin checking in.');
    } catch (err) {
      showToast('danger', 'Error', getErrorMessage(err));
    }
  }

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

  async function handleExtendSession(minutes: number) {
    if (!sessionRecord?.session_end) return;
    try {
      const nextEnd = new Date(sessionRecord.session_end as string);
      nextEnd.setMinutes(nextEnd.getMinutes() + minutes);
      await update.mutateAsync({
        path: { session_id: sessionId! },
        body: { session_end: nextEnd },
      });
      showToast('success', 'Session extended', `Attendance will now remain open until ${nextEnd.toLocaleTimeString()}.`);
    } catch (err) {
      showToast('danger', 'Extension failed', getErrorMessage(err));
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
        subtitle={
          isLive
            ? 'Attendance window is live and collecting verified check-ins.'
            : isScheduled
              ? 'This session is scheduled and waiting for the lecturer to start attendance.'
              : 'This session has been closed.'
        }
        icon="presentation"
        tone="teal"
      >
        <Link to="/sessions"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        {isScheduled ? (
          <Button variant="primary" onClick={() => void handleStart()} disabled={start.isPending}>
            <i className="ti ti-player-play" />
            Start attendance
          </Button>
        ) : null}
        {isLive ? (
          <>
            <Button variant="outline-secondary" onClick={() => void handleExtendSession(10)} disabled={update.isPending}>
              <i className="ti ti-clock-plus" />
              Extend 10 min
            </Button>
            <Button variant="outline-secondary" onClick={() => void handleExtendSession(20)} disabled={update.isPending}>
              <i className="ti ti-calendar-time" />
              Extend 20 min
            </Button>
            <Button variant="outline-secondary" onClick={() => void handleRefreshQr()} disabled={refreshQr.isPending}>
              <i className="ti ti-refresh" />
              {qrImage ? 'Rotate QR' : 'Load QR'}
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
        <div className="session-stat">
          <label>Session state</label>
          <strong>{isLive ? 'Live' : isScheduled ? 'Scheduled' : 'Closed'}</strong>
        </div>
        <div className="session-stat"><label>QR countdown</label><strong>{isLive ? formatCountdown(secondsRemaining) : '--'}</strong></div>
      </div>

      <div className="session-grid">
        <div className="surface-card session-qr-card">
          <div className="session-qr-board">
            <div className="section-title">
              <div>
                <h3>Attendance QR</h3>
                <div className="section-subtle">
                  {isScheduled
                    ? 'The QR is not available until the lecturer starts the attendance window.'
                    : qrImage
                      ? 'This image is the current active code. Rotating it will invalidate the previous QR immediately.'
                      : 'Load or rotate the live QR once the attendance window is active.'}
                </div>
              </div>
              <span className={`status-pill ${isLive ? 'green' : isScheduled ? 'royal' : 'red'}`}>
                <i className={`ti ti-${isLive ? 'broadcast' : isScheduled ? 'calendar-event' : 'lock'}`} />
                {isLive ? 'Live' : isScheduled ? 'Scheduled' : 'Closed'}
              </span>
            </div>

            <div className="session-qr-frame">
              {isScheduled ? (
                <div className="empty-panel">
                  <i className="ti ti-calendar-time" />
                  <div className="callout-title">Waiting to start</div>
                  <div className="callout-copy">Start attendance when the class actually begins and the QR will be issued immediately.</div>
                </div>
              ) : qrImage ? (
                <>
                  <img src={`data:image/png;base64,${qrImage}`} alt="Attendance QR code" />
                  <div className="mt-3">
                    <div className="status-pill royal"><i className="ti ti-clock" />Expires in {formatCountdown(secondsRemaining)}</div>
                  </div>
                </>
              ) : (
                <div className="empty-panel">
                  <i className="ti ti-qrcode-off" />
                  <div className="callout-title">{isLive ? 'QR not loaded yet' : 'Session closed'}</div>
                  <div className="callout-copy">
                    {isLive ? 'Load or rotate the current QR when students are ready to check in.' : 'Closed sessions no longer expose an attendance QR.'}
                  </div>
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
                  <strong>{sessionMeta.sessionType ?? 'Lecture'} for {courseLabel}</strong>
                  <span>{sessionMeta.semester ?? '-'} / {sessionMeta.academicYear ?? '-'}</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-building" /></div>
                <div className="timeline-text">
                  <strong>{venueLabel}</strong>
                  <span>{sessionMeta.timetableSlot ?? 'No timetable slot captured'}.</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-calendar-event" /></div>
                <div className="timeline-text">
                  <strong>{formatDateTime(sessionRecord.session_start)}</strong>
                  <span>Scheduled class start</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-clock-hour-4" /></div>
                <div className="timeline-text">
                  <strong>{formatDateTime(sessionRecord.session_end)}</strong>
                  <span>{isLive ? `${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} remaining in the live window` : 'Scheduled class end'}</span>
                </div>
              </div>
              <div className="timeline-row">
                <div className="timeline-pin"><i className="ti ti-map-pin-check" /></div>
                <div className="timeline-text">
                  <strong>{geofenceReady ? `${String(venueRecord?.radius_meters)} m radius` : 'Geofence incomplete'}</strong>
                  <span>
                    {geofenceReady
                      ? `${String(venueRecord?.latitude)}, ${String(venueRecord?.longitude)}`
                      : 'Attendance trust depends on completing venue coordinates.'}
                  </span>
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
                <div className="callout-title">{isScheduled ? 'No attendance yet' : 'No check-ins yet'}</div>
                <div className="callout-copy">
                  {isScheduled
                    ? 'This session has not started, so no one can check in yet.'
                    : 'Once students submit valid scans, they will appear here in real time.'}
                </div>
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
                        <td className="fw-semibold">{studentLookup.get(record.student_id as number) ?? `Student #${record.student_id as number}`}</td>
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

          <div className="callout-panel teal">
            <i className="ti ti-pulse" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Operational controls</div>
              <div className="callout-copy">
                Extend the session only when the room genuinely needs more time. QR rotation and time extensions both change the trust conditions students must satisfy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
