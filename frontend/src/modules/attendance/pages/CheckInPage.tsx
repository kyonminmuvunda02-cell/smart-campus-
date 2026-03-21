import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Alert, Button, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import { useAttendance } from '../hooks/useAttendance';

type CheckInState = 'idle' | 'processing' | 'success' | 'error';
type GpsState = 'idle' | 'checking' | 'verified' | 'unavailable';
type ScannerState = 'idle' | 'starting' | 'ready' | 'uploading' | 'unsupported' | 'error';

export default function CheckInPage() {
  const [state, setState] = useState<CheckInState>('idle');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [gpsCoords, setGpsCoords] = useState('-');
  const [qrPayload, setQrPayload] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannerMsg, setScannerMsg] = useState('Align the classroom QR inside the frame.');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const { checkin } = useAttendance();

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  async function startScanner() {
    try {
      setScannerState('starting');
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) throw new Error('No camera detected.');
      if (!videoRef.current) throw new Error('Preview not ready.');

      scannerRef.current?.stop();
      scannerRef.current = new QrScanner(videoRef.current, (result) => {
        const val = result.data.trim();
        if (!val) return;
        setQrPayload(val);
        scannerRef.current?.stop();
        setScannerState('idle');
        void submitAttendance(val);
      }, { preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true });

      await scannerRef.current.start();
      setScannerState('ready');
    } catch (e) {
      setScannerState('error');
      setScannerMsg(getErrorMessage(e));
    }
  }

  async function submitAttendance(payload: string) {
    setState('processing');
    setGpsState('checking');
    try {
      const parsed = JSON.parse(payload);
      const sId = Number(parsed.session_id ?? parsed.s);
      const qrC = String(parsed.qr_code ?? parsed.q ?? '');
      
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true })
      );
      
      setGpsCoords(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      setGpsState('verified');

      await checkin.mutateAsync({
        body: {
          session_id: sId,
          qr_code: qrC,
          device_id: localStorage.getItem('device_id') || 'web_client',
          gps_latitude: pos.coords.latitude,
          gps_longitude: pos.coords.longitude,
          gps_accuracy: pos.coords.accuracy,
        }
      });

      setState('success');
      showToast('success', 'Verified', 'Attendance recorded.');
    } catch (e) {
      setState('error');
      setErrorMsg(getErrorMessage(e));
      setGpsState('unavailable');
    }
  }

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Classroom Check-in"
        subtitle="Secure identity and location-bound attendance capture."
        icon="qrcode"
        tone="teal"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Check-in' }]}
      >
        <Button variant="outline-secondary" onClick={() => window.location.reload()}><i className="ti ti-rotate-2" />Reset</Button>
      </PageHeader>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="surface-card p-0 d-flex flex-column h-100 overflow-hidden">
            <div className="p-4 border-bottom bg-light-subtle d-flex justify-content-between align-items-center">
              <div>
                <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Scanner Feed</h3>
                <span className="smaller text-muted">{scannerMsg}</span>
              </div>
              <span className={`status-pill ${scannerState === 'ready' ? 'green' : 'royal'}`}>
                <i className={`ti ti-${scannerState === 'ready' ? 'camera' : 'player-play'}`} />
                {scannerState === 'ready' ? 'Live' : 'Standby'}
              </span>
            </div>
            
            <div className="bg-navy position-relative d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
              <video ref={videoRef} className="w-100 h-100 object-fit-cover" style={{ filter: scannerState === 'ready' ? 'none' : 'grayscale(1) blur(10px)', opacity: scannerState === 'ready' ? 1 : 0.3 }} />
              {scannerState !== 'ready' && (
                <div className="position-absolute text-center text-white p-4">
                  <i className="ti ti-qrcode fs-1 opacity-25 mb-3" />
                  <h4 className="h5 fw-bold mb-3">Secure Scanner</h4>
                  <div className="d-flex flex-column gap-2">
                    <Button
                      variant="light"
                      className="scanner-launch-btn"
                      onClick={() => void startScanner()}
                      disabled={scannerState === 'starting'}
                    >
                      {scannerState === 'starting' ? <Spinner size="sm" /> : <i className="ti ti-camera me-2" />}
                      Start Live Camera
                    </Button>
                    <span className="smaller opacity-50">OR</span>
                    <Button
                      variant="outline-light"
                      size="sm"
                      className="scanner-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="ti ti-photo-up me-2" />Upload QR Image
                    </Button>
                  </div>
                </div>
              )}
              {scannerState === 'ready' && <div className="scanner-reticle" />}
            </div>
            
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={e => {
               const file = e.target.files?.[0];
               if (file) QrScanner.scanImage(file).then(val => void submitAttendance(val)).catch(err => { setState('error'); setErrorMsg(getErrorMessage(err)); });
            }} />
          </div>
        </div>

        <div className="col-lg-5">
          <div className="stack gap-4 h-100">
            {/* Verification Status */}
            <div className="surface-card h-100">
              <h3 className="h6 mb-4 fw-bold uppercase tracking-wider text-secondary border-bottom pb-2">Verification Payload</h3>
              
              <div className="stack gap-3">
                <div className={`p-3 rounded-3 border d-flex align-items-center gap-3 ${state === 'success' ? 'bg-green-lt border-green-subtle text-green' : 'bg-light-subtle'}`}>
                  <div className={`sb-avatar sm rounded-circle ${state === 'success' ? 'bg-green text-white' : 'bg-secondary text-white'}`}>
                    <i className={`ti ti-${state === 'success' ? 'check' : 'scan'}`} />
                  </div>
                  <div className="flex-grow-1">
                    <strong className="small d-block">{state === 'success' ? 'Class Recognized' : 'Awaiting Scan'}</strong>
                    <span className="smaller opacity-75">{qrPayload ? 'Payload Decoded' : 'Point camera at class QR'}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-3 border d-flex align-items-center gap-3 ${gpsState === 'verified' ? 'bg-teal-lt border-teal-subtle text-teal' : 'bg-light-subtle'}`}>
                  <div className={`sb-avatar sm rounded-circle ${gpsState === 'verified' ? 'bg-teal text-white' : 'bg-secondary text-white'}`}>
                    <i className="ti ti-map-pin" />
                  </div>
                  <div className="flex-grow-1">
                    <strong className="small d-block">Location Integrity</strong>
                    <span className="smaller opacity-75">{gpsCoords}</span>
                  </div>
                </div>

                {state === 'processing' && (
                  <div className="p-4 text-center border-dashed rounded-3">
                    <Spinner size="sm" className="text-royal mb-2" />
                    <div className="small fw-bold text-royal">Verifying device & location...</div>
                  </div>
                )}

                {state === 'error' && (
                  <Alert variant="danger" className="mb-0 border-0 shadow-sm">
                    <i className="ti ti-alert-circle me-2" />
                    {errorMsg}
                    <Button variant="link" size="sm" className="d-block mt-2 p-0 text-danger fw-bold text-decoration-none" onClick={() => void submitAttendance(qrPayload)}>Retry Verification →</Button>
                  </Alert>
                )}

                {state === 'success' && (
                   <div className="p-4 text-center bg-green text-white rounded-3 shadow-sm border-0">
                    <i className="ti ti-circle-check fs-1 mb-2" />
                    <h4 className="h5 fw-bold mb-1">Attendance Secured</h4>
                    <p className="smaller mb-0 opacity-75">Your identity, device, and location have been bound to this class.</p>
                  </div>
                )}
              </div>

              <div className="callout-panel teal mt-4">
                <i className="ti ti-shield-lock" />
                <div className="smaller">
                  Identity binding active. Only one device per student is permitted for attendance reporting.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
