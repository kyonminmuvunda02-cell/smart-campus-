import { useActionState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { AttendanceRecords } from '../../client/sdk.gen';
import { getErrorMessage, getErrorStatus } from '../../utils/errors';
import { getCurrentPosition } from '../../utils/gps';
import PageHeader from '../../components/common/PageHeader';

interface State {
  error: string | null;
  success: boolean;
}

export default function CheckInPage() {
  async function checkInAction(_prev: State, formData: FormData): Promise<State> {
    const sessionId = Number(formData.get('session_id'));
    if (!sessionId) return { error: 'Please enter a valid session ID.', success: false };

    const gps = await getCurrentPosition(10_000);

    try {
      await AttendanceRecords.studentCheckin({
        body: {
          session_id: sessionId,
          gps_latitude: gps?.latitude ?? 0,
          gps_longitude: gps?.longitude ?? 0,
          gps_accuracy: gps?.accuracy ?? null,
        },
      });
      return { error: null, success: true };
    } catch (err: unknown) {
      const status = getErrorStatus(err);
      if (status === 409) return { error: 'You have already checked in to this session.', success: false };
      if (status === 404) return { error: 'Session not found or the QR code has expired.', success: false };
      return { error: getErrorMessage(err), success: false };
    }
  }

  const [state, formAction, isPending] = useActionState(checkInAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <div>
        <PageHeader
          eyebrow="Student check-in"
          title="Attendance confirmed"
          subtitle="Your record has been written and the verification workflow completed."
          icon="circle-check"
          tone="green"
        />

        <div className="surface-card text-center" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="empty-state-icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            <i className="ti ti-check" />
          </div>
          <h3 style={{ fontWeight: 800 }}>Check-in successful</h3>
          <p className="text-muted mb-4">
            Your attendance was recorded for this session. If GPS accuracy was unavailable, the
            record may still be reviewed manually by your lecturer or an administrator.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <span className="pill green">
              <i className="ti ti-circle-check" />
              Attendance saved
            </span>
            <span className="pill teal">
              <i className="ti ti-map-pin" />
              GPS processed
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Student workflow"
        title="Mark attendance"
        subtitle="Enter the session ID shown with the lecturer QR code and allow GPS access."
        icon="qrcode"
        tone="teal"
      />

      <div className="checkin-layout">
        <Card className="surface-card">
          <Card.Body className="p-0">
            {!('geolocation' in navigator) && (
              <Alert variant="warning" className="mb-4">
                This device does not expose browser geolocation. Your check-in may be accepted as
                pending for manual review.
              </Alert>
            )}

            {state.error && <Alert variant="danger">{state.error}</Alert>}

            <form action={formAction}>
              <div className="mb-4">
                <label htmlFor="session_id" className="form-label fw-semibold">
                  Session ID
                </label>
                <input
                  id="session_id"
                  name="session_id"
                  type="number"
                  className="form-control form-control-lg mono"
                  min={1}
                  placeholder="e.g. 42"
                  required
                />
                <div className="form-text">
                  The QR session number is shown by the lecturer when the attendance window opens.
                </div>
              </div>

              <div className="info-callout mb-4">
                <i className="ti ti-info-circle" />
                <div>
                  <div className="info-callout-title">Verification order</div>
                  <div className="info-callout-copy">
                    The backend checks active session status, course enrollment, digital ID
                    validity, and then GPS metadata before saving the record.
                  </div>
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-100 py-2" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Checking location and saving attendance...
                  </>
                ) : (
                  'Confirm attendance'
                )}
              </Button>
            </form>
          </Card.Body>
        </Card>

        <aside className="gps-panel">
          <div className="section-title">
            <div>
              <h3>Location readiness</h3>
              <p>What the browser must provide during check-in.</p>
            </div>
            <span className="pill teal">
              <i className="ti ti-radar-2" />
              Awaiting GPS
            </span>
          </div>

          <div className="gps-map">
            <div className="gps-ring" />
            <div className="gps-dot" />
          </div>

          <div className="timeline-list">
            <TimelinePoint
              icon="lock-access"
              title="Use your own account"
              copy="The session is linked to your authenticated student ID."
            />
            <TimelinePoint
              icon="qrcode"
              title="Enter the active session"
              copy="A stale or closed session will be rejected immediately."
            />
            <TimelinePoint
              icon="map-pin"
              title="Allow location access"
              copy="Missing accuracy can still record attendance, but it will be flagged."
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function TimelinePoint({
  icon,
  title,
  copy,
}: {
  icon: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="timeline-item">
      <div className="timeline-dot">
        <i className={`ti ti-${icon}`} />
      </div>
      <div>
        <h4>{title}</h4>
        <p>{copy}</p>
      </div>
    </div>
  );
}
