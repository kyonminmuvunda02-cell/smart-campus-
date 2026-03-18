import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import QRCode from 'qrcode';
import { Alert, Button, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import { useAttendance } from '../hooks/useAttendance';

type CheckInState = 'idle' | 'processing' | 'success' | 'error';
type GpsState = 'idle' | 'checking' | 'verified' | 'unavailable';
type ScannerState = 'idle' | 'starting' | 'ready' | 'uploading' | 'unsupported' | 'error';

type ScannerSupport = {
  supported: boolean;
  reason: string;
};

export default function CheckInPage() {
  const [state, setState] = useState<CheckInState>('idle');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [gpsCoords, setGpsCoords] = useState('-');
  const [qrPayload, setQrPayload] = useState('');
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannerMsg, setScannerMsg] = useState('Scan the classroom QR to check in. Attendance submits automatically.');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const { checkin } = useAttendance();

  useEffect(() => {
    return () => {
      destroyScanner();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!qrPayload.trim()) {
      setQrPreviewUrl('');
      return undefined;
    }

    void QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
    }).then((url: string) => {
      if (!cancelled) {
        setQrPreviewUrl(url);
      }
    }).catch(() => {
      if (!cancelled) {
        setQrPreviewUrl('');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  function getScannerSupport(): ScannerSupport {
    if (!window.isSecureContext) {
      return {
        supported: false,
        reason: 'Live scanning is unavailable on this page. Use your phone camera or upload a QR image instead.',
      };
    }

    if (!navigator.mediaDevices) {
      return {
        supported: false,
        reason: 'This browser cannot open the camera here. Upload a QR image instead.',
      };
    }

    if (!navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        reason: 'This browser cannot use the camera for web pages. Upload a QR image instead.',
      };
    }

    return {
      supported: true,
      reason: '',
    };
  }

  function describeScannerError(error: unknown) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'Camera permission was denied. Allow camera access in the browser and try again.';
      }

      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'No camera was found on this device. Upload a QR image instead.';
      }

      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return 'The camera is busy in another app or could not be opened. Close other camera apps and try again.';
      }

      if (error.name === 'OverconstrainedError') {
        return 'The preferred camera is not available on this device. Try again or upload a QR image instead.';
      }
    }

    return 'Camera access failed. Check permissions or upload a QR image instead.';
  }

  function parsePayload(rawPayload: string) {
    const parsed = JSON.parse(rawPayload) as {
      session_id?: number;
      qr_code?: string;
      s?: number;
      q?: string;
    };
    const sessionId = Number(parsed.session_id ?? parsed.s);
    const qrCode = String(parsed.qr_code ?? parsed.q ?? '');

    if (!Number.isInteger(sessionId) || sessionId <= 0 || !qrCode) {
      throw new Error('QR payload must include both session_id and qr_code.');
    }

    return { sessionId, qrCode };
  }

  async function startScanner() {
    const scannerSupport = getScannerSupport();

    if (!scannerSupport.supported) {
      setScannerState('unsupported');
      setScannerMsg(scannerSupport.reason);
      return;
    }

    try {
      setScannerState('starting');
      setScannerMsg('Opening camera...');
      const hasCamera = await QrScanner.hasCamera();

      if (!hasCamera) {
        setScannerState('unsupported');
        setScannerMsg('No camera was detected on this device. Upload a QR image instead.');
        return;
      }

      if (!videoRef.current) {
        throw new Error('Camera preview is not ready.');
      }

      stopScanner();

      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const rawValue = result.data.trim();
            if (!rawValue) return;

            setQrPayload(rawValue);
            setScannerMsg('QR recognized. Confirming attendance...');
            stopScanner();
            setScannerState('idle');
            void submitAttendance(rawValue);
          },
          {
            preferredCamera: 'environment',
            maxScansPerSecond: 10,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            onDecodeError: (error) => {
              if (error === QrScanner.NO_QR_CODE_FOUND) return;
            },
          }
        );
      }

      await scannerRef.current.start();
      setScannerState('ready');
      setScannerMsg('Align the classroom QR inside the frame.');
    } catch (error) {
      setScannerState('error');
      setScannerMsg(describeScannerError(error));
      stopScanner();
    }
  }

  function openCaptureFallback() {
    setScannerState('idle');
    setScannerMsg('Opening your phone camera or photo library...');
    fileInputRef.current?.click();
  }

  async function decodeQrFromFile(file: File): Promise<string> {
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
        alsoTryWithoutScanRegion: true,
      });

      if (!result?.data?.trim()) {
        throw new Error('No QR code was found in the uploaded image.');
      }

      return result.data;
    } catch (error) {
      if (error === QrScanner.NO_QR_CODE_FOUND) {
        throw new Error('No QR code was found in the uploaded image.');
      }

      throw error;
    }
  }

  function stopScanner() {
    scannerRef.current?.stop();

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }

  function destroyScanner() {
    scannerRef.current?.destroy();
    scannerRef.current = null;
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    stopScanner();
    setScannerState('uploading');
    setScannerMsg('Reading QR image...');
    setUploadedFileName(file.name);

    try {
      const rawValue = await decodeQrFromFile(file);
      const normalizedPayload = rawValue.trim();
      setQrPayload(normalizedPayload);
      setScannerState('idle');
      setScannerMsg('QR recognized from image. Confirming attendance...');
      void submitAttendance(normalizedPayload);
    } catch (error) {
      setScannerState('error');
      setScannerMsg(getErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  }

  async function submitAttendance(payload: string) {
    setState('processing');
    setErrorMsg('');
    setGpsState('checking');

    try {
      const { sessionId, qrCode } = parsePayload(payload);
      const deviceId = localStorage.getItem('device_id') || 'unknown';

      let lat = 0;
      let lng = 0;
      let accuracy: number | null = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
        );
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        accuracy = position.coords.accuracy ?? null;
        setGpsCoords(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setGpsState('verified');
      } catch {
        setGpsState('unavailable');
        setGpsCoords('Location unavailable');
        throw new Error('Location permission is required to confirm attendance in the classroom.');
      }

      await checkin.mutateAsync({
        body: {
          session_id: sessionId,
          qr_code: qrCode,
          device_id: deviceId,
          gps_latitude: lat,
          gps_longitude: lng,
          gps_accuracy: accuracy,
        },
      });

      setState('success');
      setScannerMsg('Attendance confirmed.');
      showToast('success', 'Attendance confirmed', 'Your check-in has been recorded and verified.');
    } catch (err) {
      setState('error');
      setGpsState((current) => (current === 'checking' ? 'unavailable' : current));
      setErrorMsg(getErrorMessage(err));
      setScannerMsg('Attendance failed. Scan again or upload another QR image.');
    }
  }

  function resetFlow() {
    stopScanner();
    setState('idle');
    setGpsState('idle');
    setScannerState('idle');
    setGpsCoords('-');
    setQrPayload('');
    setErrorMsg('');
    setScannerMsg('Scan the classroom QR to check in. Attendance submits automatically.');
    setUploadedFileName('');
  }

  const liveScannerSupport = getScannerSupport();

  const gpsStatusClass =
    gpsState === 'verified' ? 'gps-status' :
      gpsState === 'checking' ? 'gps-status amber' :
        gpsState === 'unavailable' ? 'gps-status red' : 'gps-status amber';
  const gpsStatusLabel =
    gpsState === 'verified' ? 'GPS locked' :
      gpsState === 'checking' ? 'Checking location' :
        gpsState === 'unavailable' ? 'GPS unavailable' : 'Waiting for check-in';

  const scannerBadgeClass =
    scannerState === 'ready' ? 'status-pill green' :
      scannerState === 'starting' ? 'status-pill amber' :
        scannerState === 'unsupported' || scannerState === 'error' ? 'status-pill red' : 'status-pill royal';
  const scannerBadgeLabel =
    scannerState === 'ready' ? 'Camera live' :
      scannerState === 'starting' ? 'Starting camera' :
        scannerState === 'uploading' ? 'Reading image' :
        scannerState === 'unsupported' ? 'Live scan unavailable' :
          scannerState === 'error' ? 'Camera blocked' : 'Scanner idle';

  const scannerPlaceholderTitle =
    scannerState === 'unsupported'
      ? 'Live scan unavailable'
      : scannerState === 'error'
        ? 'Camera unavailable'
        : scannerState === 'uploading'
          ? 'Reading uploaded image'
          : 'Ready to scan';
  const scannerAlertVariant = scannerState === 'error' || state === 'error' ? 'danger' : 'info';
  const scannerAlertIcon = scannerAlertVariant === 'danger' ? 'alert-circle' : 'info-circle';

  return (
    <div>
      <PageHeader
        eyebrow="Student flow"
        title="Secure attendance check-in"
        subtitle="Scan the lecturer QR with your camera, verify location, and let the app submit attendance automatically."
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
                <h3>Scan classroom QR</h3>
                <div className="section-subtle">Use the device camera when supported, or upload a screenshot/photo of the QR as a fallback.</div>
              </div>
              <span className={scannerBadgeClass}><i className="ti ti-camera" />{scannerBadgeLabel}</span>
            </div>

            <div className="scanner-shell">
              <div className="scanner-frame">
                <video ref={videoRef} className="scanner-video" playsInline muted />
                {scannerState !== 'ready' && (
                  <div className="scanner-placeholder">
                    <i className={`ti ti-${scannerState === 'unsupported' ? 'device-desktop-x' : scannerState === 'error' ? 'camera-off' : scannerState === 'uploading' ? 'photo-search' : 'qrcode'}`} />
                    <div className="callout-title">{scannerPlaceholderTitle}</div>
                  </div>
                )}
                {scannerState === 'ready' ? <div className="scanner-reticle" /> : null}
              </div>
              <Alert variant={scannerAlertVariant} className="scanner-alert">
                <i className={`ti ti-${scannerAlertIcon} me-2`} />
                {scannerMsg}
              </Alert>
              {uploadedFileName ? <div className="scanner-file-meta">Last image: {uploadedFileName}</div> : null}
            </div>

            <div className="scanner-actions">
              {scannerState === 'ready' ? (
                <Button variant="outline-secondary" onClick={stopScanner}>
                  <i className="ti ti-camera-off" />
                  Stop camera
                </Button>
              ) : (
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    if (liveScannerSupport.supported) {
                      void startScanner();
                      return;
                    }

                    openCaptureFallback();
                  }}
                  disabled={scannerState === 'starting'}
                >
                  {scannerState === 'starting' ? <Spinner animation="border" size="sm" /> : <i className="ti ti-camera" />}
                  {liveScannerSupport.supported ? 'Start camera' : 'Use phone camera'}
                </Button>
              )}
              <Button variant="outline-secondary" onClick={() => fileInputRef.current?.click()} disabled={scannerState === 'uploading'}>
                {scannerState === 'uploading' ? <Spinner animation="border" size="sm" /> : <i className="ti ti-photo-up" />}
                Upload image
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="scanner-input"
              onChange={(event) => void handleFileUpload(event)}
            />
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Scan status</h3>
                <div className="section-subtle">The app stores the scan securely and submits it with your device and location checks.</div>
              </div>
              <span className="status-pill teal"><i className="ti ti-shield-lock" />Identity bound</span>
            </div>

            <div className="callout-panel" style={{ marginBottom: '1rem' }}>
              <i className="ti ti-info-circle" style={{ color: 'var(--royal)' }} />
              <div>
                <div className="callout-title">Camera scan preferred</div>
                <div className="callout-copy">
                  If your browser supports it, scan the QR directly. You can also upload a screenshot or capture a photo of the QR on your phone.
                </div>
              </div>
            </div>

            <div className="callout-panel soft" style={{ marginBottom: '0.75rem' }}>
              <i className={`ti ti-${qrPayload.trim() ? 'circle-check' : 'scan'}`} style={{ color: 'var(--teal)' }} />
              <div>
                <div className="callout-title">{qrPayload.trim() ? 'QR captured' : 'Waiting for scan'}</div>
                <div className="callout-copy">
                  {qrPayload.trim()
                    ? state === 'processing'
                      ? 'A classroom QR has been captured and attendance is being submitted now.'
                      : state === 'success'
                        ? 'A classroom QR was captured and the check-in was submitted successfully.'
                        : state === 'error'
                          ? 'A classroom QR was captured, but the attendance submission failed.'
                          : 'A classroom QR has been captured.'
                    : 'No classroom QR has been captured yet. Start the camera or upload an image to continue.'}
                </div>
              </div>
            </div>

            <div className="login-hint">
              Students do not need to see the QR contents. Your device ID is reused automatically, and location is requested as soon as a valid scan is captured.
            </div>

            {state === 'processing' && (
              <Alert variant="info">
                <i className="ti ti-loader me-2" />
                Confirming attendance. Please wait while your scan, device identity, and location are being verified.
              </Alert>
            )}

            {state === 'error' && (
              <Alert variant="danger">
                <i className="ti ti-alert-circle me-2" />
                {errorMsg}
              </Alert>
            )}

            {state === 'processing' ? (
              <Button variant="primary" disabled>
                <Spinner animation="border" size="sm" />
                Verifying attendance...
              </Button>
            ) : null}

            {state === 'error' && qrPayload.trim() ? (
              <Button variant="primary" onClick={() => void submitAttendance(qrPayload)}>
                <i className="ti ti-refresh" />
                Retry attendance
              </Button>
            ) : null}
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
                {qrPreviewUrl ? <img src={qrPreviewUrl} alt="Captured attendance QR" className="qr-stage-preview" /> : null}
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
                {qrPreviewUrl ? <img src={qrPreviewUrl} alt="Captured attendance QR" className="qr-stage-preview" /> : null}
                <div className="qr-stage-title">Check-in blocked</div>
                <div className="qr-stage-copy">
                  Review the camera access, uploaded image quality, location permission, or session validity before trying again.
                </div>
              </>
            ) : state === 'processing' ? (
              <>
                <div className="qr-hero-icon processing"><i className="ti ti-loader fs-1" /></div>
                {qrPreviewUrl ? <img src={qrPreviewUrl} alt="Captured attendance QR" className="qr-stage-preview" /> : null}
                <div className="qr-stage-title">Confirming attendance</div>
                <div className="qr-stage-copy">
                  Session identity, QR freshness, device binding, and geolocation are being checked now.
                </div>
                <div className="qr-stage-loading">
                  <Spinner animation="border" size="sm" />
                  <span>Submitting your check-in...</span>
                </div>
              </>
            ) : qrPreviewUrl ? (
              <>
                <div className="qr-hero-icon"><i className="ti ti-qrcode fs-1" /></div>
                <img src={qrPreviewUrl} alt="Captured attendance QR" className="qr-stage-preview" />
                <div className="qr-stage-title">QR captured</div>
                <div className="qr-stage-copy">
                  The classroom code has been recognized and is ready for attendance processing.
                </div>
                <div className="d-flex gap-2 flex-wrap justify-content-center">
                  <span className="status-pill royal"><i className="ti ti-scan" />Scan recognized</span>
                </div>
              </>
            ) : (
              <>
                <div className="qr-hero-icon"><i className="ti ti-qrcode fs-1" /></div>
                <div className="qr-stage-title">Ready for a verified scan</div>
                <div className="qr-stage-copy">
                  Use the camera first. If live scanning is unavailable, upload a screenshot or photo of the classroom QR.
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
