import { Link } from 'react-router';

export default function UnauthorizedPage() {
  return (
    <div className="empty-state" style={{ maxWidth: '720px', margin: '8vh auto' }}>
      <div className="empty-state-icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
        <i className="ti ti-lock-access" />
      </div>
      <div className="page-header-eyebrow">Access control</div>
      <h2 style={{ fontWeight: 800, marginBottom: '8px' }}>You do not have access to this page.</h2>
      <p className="text-muted mb-4">
        The route is protected by role-based access control. Sign in with the correct role or
        return to a page that belongs to your workspace.
      </p>
      <Link className="btn-soft btn-soft-primary" to="/">
        <i className="ti ti-arrow-left" />
        <span>Return to dashboard</span>
      </Link>
    </div>
  );
}
