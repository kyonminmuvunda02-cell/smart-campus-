import { useQuery } from '@tanstack/react-query';
import { Alert, Spinner } from 'react-bootstrap';
import { DigitalIds, Auth } from '../../client/sdk.gen';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errors';
import PageHeader from '../../components/common/PageHeader';

export default function DigitalIDPage() {
  const { userId } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ['digital-id', userId],
    queryFn: async () => {
      const [{ data: digitalId }, { data: user }] = await Promise.all([
        DigitalIds.getActiveDigitalId({ path: { student_id: userId! } }),
        Auth.getCurrentUser(),
      ]);
      return { digitalId: digitalId ?? null, user: user ?? null };
    },
    enabled: !!userId,
  });

  if (isPending) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{getErrorMessage(error)}</Alert>;

  const { digitalId, user } = data ?? {};
  const isExpired = digitalId ? digitalId.expires_at < new Date() : false;
  const isValid = Boolean(digitalId?.is_active && !isExpired);

  return (
    <div>
      <PageHeader
        eyebrow="Student identity"
        title="My digital ID"
        subtitle="Identity, validity window, and attendance-readiness in one place."
        icon="id-badge-2"
        tone="green"
      />

      {!digitalId ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="ti ti-id-off" />
          </div>
          <h3 style={{ fontWeight: 800 }}>No active digital ID</h3>
          <p className="text-muted mb-0">
            Contact the registrar or administrator to issue a valid digital ID before attempting
            smart-campus attendance.
          </p>
        </div>
      ) : (
        <div className="id-layout">
          <section className="id-card-panel">
            <div className={`id-banner ${isValid ? '' : 'expired'}`.trim()}>
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div className="id-qr-box">
                  <i className="ti ti-qrcode" />
                </div>
                <span className={`pill ${isValid ? 'green' : 'red'}`}>
                  <i className={`ti ti-${isValid ? 'circle-check' : 'alert-circle'}`} />
                  {isValid ? 'Valid' : isExpired ? 'Expired' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4">
                <div className="page-header-eyebrow text-white-50">Cavendish University Zambia</div>
                <h2 style={{ fontWeight: 800, marginBottom: '4px' }}>
                  {user?.first_name} {user?.last_name}
                </h2>
                <div style={{ color: 'rgba(255,255,255,0.78)' }}>Student digital identity card</div>
              </div>
            </div>

            <div className="id-body">
              <div className="id-row">
                <i className="ti ti-hash" />
                <span className="mono">{digitalId.id_number}</span>
              </div>
              <div className="id-row">
                <i className="ti ti-mail" />
                <span>{user?.email}</span>
              </div>
              <div className="id-row">
                <i className="ti ti-calendar-time" />
                <span>Issued {digitalId.issued_at.toLocaleDateString()}</span>
              </div>
              <div className="id-row">
                <i className="ti ti-calendar-off" />
                <span>Expires {digitalId.expires_at.toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          <aside className="surface-card">
            <div className="info-callout teal">
              <i className="ti ti-shield-check" />
              <div>
                <div className="info-callout-title">Identity status</div>
                <div className="info-callout-copy">
                  {isValid
                    ? 'Your card is active and can be used alongside QR and GPS verification.'
                    : 'This card requires admin attention before you can rely on it for attendance.'}
                </div>
              </div>
            </div>

            <div className="id-meta-grid mb-4">
              <div className="id-meta-card">
                <strong>Card state</strong>
                <span className={`pill ${isValid ? 'green' : 'red'}`}>
                  <i className={`ti ti-${isValid ? 'circle-check' : 'alert-circle'}`} />
                  {isValid ? 'Ready for check-in' : 'Needs renewal'}
                </span>
              </div>
              <div className="id-meta-card">
                <strong>Security layer</strong>
                <span className="pill royal">
                  <i className="ti ti-lock-access" />
                  Linked to RBAC
                </span>
              </div>
            </div>

            <div className="section-title">
              <div>
                <h3>How the ID is used</h3>
                <p>The card supports the anti-fraud attendance workflow.</p>
              </div>
            </div>

            <div className="timeline-list">
              <TimelinePoint
                icon="user-check"
                title="Identity verified"
                copy="Your account and digital ID must both be active before check-in succeeds."
              />
              <TimelinePoint
                icon="qrcode"
                title="Session matched"
                copy="The lecturer QR session is checked against course and semester details."
              />
              <TimelinePoint
                icon="map-pin"
                title="Presence confirmed"
                copy="GPS data adds physical-presence evidence to reduce proxy attendance."
              />
            </div>
          </aside>
        </div>
      )}
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
