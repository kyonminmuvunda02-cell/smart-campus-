import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useUser } from '../hooks/useUser';
import UserFormModal from '../components/UserFormModal';

export default function UserViewPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : undefined;
  const [showEditModal, setShowEditModal] = useState(false);
  
  const { useDetail } = useUser();
  const { data: user, isLoading } = useDetail(userId);

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  if (!user) return <EmptyState title="User Not Found" message="The identity record you are looking for may have been removed." />;

  const u = user as any;
  const role = String(u.role ?? 'User');
  const initials = `${String(u.first_name?.[0] ?? 'U')}${String(u.last_name?.[0] ?? '')}`;

  return (
    <div>
      <PageHeader
        title={`${u.first_name} ${u.last_name}`}
        subtitle={u.email}
        icon="user"
        tone="purple"
        breadcrumbs={[
          { label: 'Administration', path: '/users' },
          { label: 'Users', path: '/users' },
          { label: u.email },
        ]}
      >
        <Button variant="primary" onClick={() => setShowEditModal(true)}>
          <i className="ti ti-edit" />
          Edit Account
        </Button>
      </PageHeader>

      <div className="stack gap-4">
        <div className="surface-card">
          <div className="row g-4 align-items-center">
            <div className="col-md-auto">
              <div className={`sb-avatar xl ${role === 'Admin' ? 'bg-navy' : role === 'Lecturer' ? 'bg-purple-bg text-purple-text' : 'bg-accent-lt text-accent'}`}>
                {initials}
              </div>
            </div>
            <div className="col-md">
              <h3 className="h4 mb-1 fw-bold text-navy">{u.first_name} {u.last_name}</h3>
              <div className="d-flex gap-2 mb-2">
                <span className={`status-pill ${role === 'Admin' ? 'navy' : role === 'Lecturer' ? 'purple' : 'royal'}`}>
                  {role}
                </span>
                <span className="status-pill green">Verified Account</span>
              </div>
              <div className="text-muted small"><i className="ti ti-mail me-1" />{u.email}</div>
            </div>
            <div className="col-md-auto border-start ps-4">
              <div className="text-secondary small fw-bold uppercase mb-1">System Context</div>
              <div className="mono smaller text-navy">ID-{String(u.user_id).padStart(4, '0')}</div>
              <div className="small text-muted mt-1">Since {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="surface-card">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h4 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Academic & Professional Metadata</h4>
            <i className="ti ti-id-badge text-muted fs-5" />
          </div>

          <div className="row g-4">
            {u.role === 'Student' && (
              <>
                <div className="col-md-4">
                  <div className="metric-card border bg-light-subtle p-4 rounded-3 h-100">
                    <label className="text-secondary small fw-bold mb-2 uppercase">Student Number</label>
                    <div className="h5 mb-0 fw-bold mono text-navy">{u.student_number || 'STU-000'}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card border bg-light-subtle p-4 rounded-3 h-100">
                    <label className="text-secondary small fw-bold mb-2 uppercase">Academic Program</label>
                    <div className="h5 mb-0 fw-bold text-navy">{u.program || 'General Studies'}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card border bg-light-subtle p-4 rounded-3 h-100 text-center">
                    <label className="text-secondary small fw-bold mb-2 uppercase">Year of Study</label>
                    <div className="h5 mb-0 fw-bold text-navy">{u.year_of_study || 1}</div>
                  </div>
                </div>
              </>
            )}

            {u.role === 'Lecturer' && (
              <>
                <div className="col-md-4">
                  <div className="metric-card border bg-light-subtle p-4 rounded-3 h-100">
                    <label className="text-secondary small fw-bold mb-2 uppercase">Staff Number</label>
                    <div className="h5 mb-0 fw-bold mono text-navy">{u.staff_number || 'STF-000'}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card border bg-light-subtle p-4 rounded-3 h-100">
                    <label className="text-secondary small fw-bold mb-2 uppercase">Department</label>
                    <div className="h5 mb-0 fw-bold text-navy">{u.department || 'Academic Affairs'}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card border bg-light-subtle p-4 rounded-3 h-100">
                    <label className="text-secondary small fw-bold mb-2 uppercase">Office Location</label>
                    <div className="h5 mb-0 fw-bold text-navy">{u.office_location || 'Not Assigned'}</div>
                  </div>
                </div>
              </>
            )}

            {u.role === 'Admin' && (
              <div className="col-12 text-center py-5 border rounded-3 bg-light-subtle">
                <i className="ti ti-lock-access fs-1 text-navy opacity-25 mb-2" />
                <p className="text-secondary mb-0">Full administrative privileges are granted to this account.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserFormModal show={showEditModal} onHide={() => setShowEditModal(false)} userId={userId} />
    </div>
  );
}
