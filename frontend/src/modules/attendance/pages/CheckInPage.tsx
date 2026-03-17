import { useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import { useAttendance } from '../hooks/useAttendance';

type CheckInState = 'idle' | 'processing' | 'success' | 'error';
type GpsState = 'idle' | 'checking' | 'verified' | 'unavailable';

export default function CheckInPage() {
  const [state, setState] = useState<CheckInState>('idle');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [gpsCoords, setGpsCoords] = useState('-');
  const [qrPayload, setQrPayload] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();
  const { checkin } = useAttendance();

  async function handleCheckIn() {
    setState('processing');
    setErrorMsg('');
    setGpsState('checking');

    try {
      const parsed = JSON.parse(qrPayload) as { session_id?: number; qr_code?: string };
      const sessionId = Number(parsed.session_id);
      const qrCode = String(parsed.qr_code ?? '');

      if (!Number.isInteger(sessionId) || sessionId <= 0 || !qrCode) {
        throw new Error('QR payload must include both session_id and qr_code.');
      }

      const deviceId = localStorage.getItem('device_id') || 'unknown';

      let lat = 0;
      let lng = 0;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
        );
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        setGpsCoords(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setGpsState('verified');
      } catch {
        setGpsState('unavailable');
        setGpsCoords('Location unavailable');
      }

      await checkin.mutateAsync({
        body: {
          session_id: sessionId,
          qr_code: qrCode,
          device_id: deviceId,
          gps_latitude: lat,
          gps_longitude: lng,
          gps_accuracy: null,
        },
      });

      setState('success');
      showToast('success', 'Attendance confirmed', 'Your check-in has been recorded and verified.');
    } catch (err) {
      setState('error');
      setGpsState((current) => (current === 'checking' ? 'unavailable' : current));
      setErrorMsg(getErrorMessage(err));
    }
  }

  function resetFlow() {
    setState('idle');
    setGpsState('idle');
    setGpsCoords('-');
    setQrPayload('');
    setErrorMsg('');
  }

  const gpsStatusClass =
    gpsState === 'verified' ? 'gps-status' :
      gpsState === 'checking' ? 'gps-status amber' :
        gpsState === 'unavailable' ? 'gps-status red' : 'gps-status amber';
  const gpsStatusLabel =
    gpsState === 'verified' ? 'GPS locked' :
      gpsState === 'checking' ? 'Checking location' :
        gpsState === 'unavailable' ? 'GPS unavailable' : 'Waiting for check-in';

  return (
    <div>
      <PageHeader
        eyebrow="Student flow"
        title="Secure attendance check-in"
        subtitle="Paste the lecturer's QR payload, verify location, and confirm your attendance in one guided step."
        icon="qrcode"
        tone="teal"
      >
        <Button variant="outline-secondary" onClick={resetFlow}>
          <i className="ti ti-rotate-2" />
          Reset
        </Button>
      </PageHeader>

      <div className="checkin-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Attendance payload</h3>
                <div className="section-subtle">The payload must contain both the live session ID and QR code UUID.</div>
              </div>
              <span className="status-pill teal"><i className="ti ti-shield-lock" />Identity bound</span>
            </div>

            <div className="callout-panel" style={{ marginBottom: '1rem' }}>
              <i className="ti ti-info-circle" style={{ color: 'var(--royal)' }} />
              <div>
                <div className="callout-title">Use the full JSON payload</div>
                <div className="callout-copy">
                  The backend now validates refreshed QR codes, so a session ID alone is no longer enough.
                </div>
              </div>
            </div>

            <div className="field-shell" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="qrPayload" className="field-label">QR payload JSON</label>
              <div className="field-wrap">
                <i className="ti ti-braces" style={{ alignSelf: 'flex-start', paddingTop: '0.95rem' }} />
                <textarea
                  id="qrPayload"
                  value={qrPayload}
                  onChange={(event) => setQrPayload(event.target.value)}
                  placeholder='{"session_id": 12, "qr_code": "...."}'
                />
              </div>
            </div>

            <div className="login-hint">
              Your device ID is reused automatically. Location is requested only when you confirm the scan.
            </div>

            {state === 'error' && (
              <Alert variant="danger">
                <i className="ti ti-alert-circle me-2" />
                {errorMsg}
              </Alert>
            )}

            <Button
              variant="primary"
              onClick={() => void handleCheckIn()}
              disabled={!qrPayload.trim() || state === 'processing'}
            >
              {state === 'processing' ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Verifying attendance...
                </>
              ) : (
                <>
                  <i className="ti ti-check" />
                  Confirm attendance
                </>
              )}
            </Button>
          </div>

          <div className="gps-widget-shell">
            <div className="gps-map">
              <div className="gps-ring" />
              <div className="gps-dot" />
            </div>
            <div className="gps-body">
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <h3>Location integrity</h3>
                  <div className="section-subtle">Attendance is only trusted when identity and physical presence align.</div>
                </div>
              </div>
              <div className="gps-row">
                <div className={gpsStatusClass}>{gpsStatusLabel}</div>
                <div className="gps-coords">{gpsCoords}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card qr-stage">
          <div className="qr-stage-display">
            {state === 'success' ? (
              <>
                <div className="qr-hero-icon success"><i className="ti ti-circle-check fs-1" /></div>
                <div className="qr-stage-title">Attendance confirmed</div>
                <div className="qr-stage-copy">
                  Your check-in was accepted with device binding and session validation applied.
                </div>
                <div className="d-flex gap-2 flex-wrap justify-content-center">
                  <span className="status-pill green"><i className="ti ti-check" />Recorded</span>
                  <span className={`status-pill ${gpsState === 'verified' ? 'teal' : 'amber'}`}>
                    <i className="ti ti-map-pin" />
                    {gpsState === 'verified' ? 'GPS verified' : 'GPS fallback'}
                  </span>
                </div>
              </>
            ) : state === 'error' ? (
              <>
                <div className="qr-hero-icon error"><i className="ti ti-alert-octagon fs-1" /></div>
                <div className="qr-stage-title">Check-in blocked</div>
                <div className="qr-stage-copy">
                  Review the payload structure, location permission, or session validity before trying again.
                </div>
              </>
            ) : state === 'processing' ? (
              <>
                <div className="qr-hero-icon processing"><i className="ti ti-loader fs-1" /></div>
                <div className="qr-stage-title">Verifying attendance</div>
                <div className="qr-stage-copy">
                  Session identity, QR freshness, device binding, and geolocation are being checked.
                </div>
              </>
            ) : (
              <>
                <div className="qr-hero-icon"><i className="ti ti-qrcode fs-1" /></div>
                <div className="qr-stage-title">Ready for a verified scan</div>
                <div className="qr-stage-copy">
                  Paste the classroom QR payload when the lecturer opens the attendance window.
                </div>
                <div className="d-flex gap-2 flex-wrap justify-content-center">
                  <span className="status-pill royal"><i className="ti ti-lock-access" />Role checked</span>
                  <span className="status-pill teal"><i className="ti ti-device-mobile" />Device linked</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
