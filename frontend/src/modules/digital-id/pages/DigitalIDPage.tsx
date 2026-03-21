import { Spinner } from 'react-bootstrap';
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

  if (isLoading) return <div className="p-4 text-center"><Spinner animation="border" variant="primary" /></div>;

  const c = card as Record<string, any> | undefined;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Secure Digital Identity"
        subtitle="Your virtual campus credential for verified attendance and physical access."
        icon="id-badge-2"
        tone="royal"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'My Digital ID' }]}
      />

      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="surface-card p-0 shadow-lg border-0 overflow-hidden" style={{ borderRadius: '1.5rem', background: 'linear-gradient(225deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="p-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10">
              <div className="d-flex align-items-center gap-2 text-white">
                <i className="ti ti-school fs-4 text-royal" />
                <strong className="tracking-widest uppercase small opacity-75">Smart Campus</strong>
              </div>
              <span className="badge bg-royal-lt text-royal border border-royal-subtle">LIVE ID</span>
            </div>

            <div className="p-5 text-center text-white">
              <div className="mx-auto mb-4 bg-white bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                <i className="ti ti-user fs-1 opacity-50" />
              </div>
              <h2 className="h4 fw-bold mb-1">{c ? `ID-STUDENT-${c.student_id}` : 'Student Identity'}</h2>
              <span className="smaller tracking-widest uppercase opacity-50">{role}</span>
            </div>

            <div className="px-4 pb-4">
                <div className="p-4 rounded-3 bg-white bg-opacity-5 border border-white border-opacity-10">
                  <div className="row g-3">
                    <div className="col-6">
                      <span className="smaller text-white opacity-40 uppercase d-block mb-1">National ID</span>
                      <strong className="text-white small fw-mono">{c?.id_number || '•••• •••• ••••'}</strong>
                    </div>
                    <div className="col-6 text-end">
                      <span className="smaller text-white opacity-40 uppercase d-block mb-1">Expires On</span>
                      <strong className="text-white small fw-mono">{c?.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'PERMANENT'}</strong>
                    </div>
                  </div>
                </div>
            </div>

            <div className="bg-royal py-3 text-center text-white">
              <i className="ti ti-shield-check me-2" />
              <span className="smaller fw-bold uppercase tracking-widest">Verified Identity Boundary</span>
            </div>
          </div>

          {isError && (
            <div className="text-center mt-4">
              <p className="text-muted small">No active Digital ID record found on file. Please visit the Registrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
