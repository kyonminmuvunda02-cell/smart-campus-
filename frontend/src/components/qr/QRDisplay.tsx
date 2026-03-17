import { useCountdown } from '../../hooks/useCountdown';

const QR_TTL_SECONDS = 60;

interface Props {
  base64Image: string;
  onExpire: () => void;
}

export default function QRDisplay({ base64Image, onExpire }: Props) {
  const secondsLeft = useCountdown(QR_TTL_SECONDS, onExpire);
  const isUrgent = secondsLeft <= 10;

  return (
    <div className="qr-card">
      <div className="section-title justify-content-center">
        <div className="text-center">
          <h3>Session QR code</h3>
          <p>Students have one minute to scan before the token rotates.</p>
        </div>
      </div>

      <img
        src={`data:image/png;base64,${base64Image}`}
        alt="Attendance QR code"
        className="qr-image mb-4"
      />

      <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
        <span className={`pill ${isUrgent ? 'red' : 'green'}`}>
          <i className={`ti ti-${isUrgent ? 'alert-triangle' : 'circle-check'}`} />
          {secondsLeft}s remaining
        </span>
        <span className="pill royal">
          <i className="ti ti-refresh" />
          Auto-refresh enabled
        </span>
      </div>

      <div className="qr-expiry mb-2">
        <div
          className={`qr-expiry-fill ${isUrgent ? 'urgent' : ''}`}
          style={{ width: `${(secondsLeft / QR_TTL_SECONDS) * 100}%` }}
        />
      </div>

      <p className="text-muted small mb-0">
        {isUrgent
          ? 'The QR code is about to rotate. Students should scan immediately.'
          : 'Keep this screen visible while students scan and the record list refreshes.'}
      </p>
    </div>
  );
}
