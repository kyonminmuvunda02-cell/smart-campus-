import { Card, Spinner } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { getActiveDigitalIdOptions } from '@/client/@tanstack/react-query.gen';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import PageHeader from '@/components/common/PageHeader';
import type { Options, GetActiveDigitalIdData } from '@/client';

export default function DigitalIDPage() {
  const { userId, role } = useAuth();

  const { data: card, isLoading, isError } = useQuery({
    ...getActiveDigitalIdOptions({ path: { student_id: userId! } } as Options<GetActiveDigitalIdData>),
    enabled: !!userId,
  });

  if (isLoading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  const c = card as Record<string, unknown> | undefined;

  return (
    <div>
      <PageHeader title="Digital ID" subtitle="Your virtual campus identity" />

      <div className="mx-auto" style={{ maxWidth: 400 }}>
        <Card
          className="border-0 shadow-lg overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #206bc4 0%, #1a56a0 60%, #0f3d7a 100%)', borderRadius: '1.25rem' }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="bg-white bg-opacity-25 p-2 rounded"><i className="ti ti-school fs-3" /></div>
              <div>
                <div className="fw-bold">CUZ Smart Campus</div>
                <div className="small text-white-50">Digital Student ID</div>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="bg-white bg-opacity-15 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
                <i className="ti ti-user fs-1 text-white-50" />
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="mb-1 fw-bold">{c ? `Student #${c.student_id as number}` : 'Student'}</h3>
              <div className="badge bg-white bg-opacity-25 mb-2">{role}</div>
              {c && <div className="small text-white-50">ID Card #{c.digital_id_id as number}</div>}
            </div>

            {c && (
              <div className="bg-white rounded p-3 text-dark">
                <div className="small text-uppercase text-muted mb-2">Identity Details</div>
                <div className="fw-semibold mb-1">National ID: {c.id_number as string}</div>
                <div className="small">Expires: {c.expires_at ? new Date(c.expires_at as string).toLocaleDateString() : '-'}</div>
              </div>
            )}

            {isError && (
              <div className="text-center text-white-50 py-3"><p className="mb-0 small">No active Digital ID found. Contact admin.</p></div>
            )}

            {!c && !isError && (
              <div className="text-center text-white-50 py-3"><p className="mb-0 small">Digital ID not yet issued.</p></div>
            )}
          </Card.Body>

          <div className="bg-white bg-opacity-10 px-4 py-2 text-center">
            <small className="text-white-50">Active digital identity for attendance verification</small>
          </div>
        </Card>
      </div>
    </div>
  );
}
