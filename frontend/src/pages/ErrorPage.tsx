import { useRouteError } from 'react-router';

export default function ErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string };
  const is404 = error?.status === 404;

  return (
    <div className="empty-state" style={{ maxWidth: '720px', margin: '8vh auto' }}>
      <div className="empty-state-icon">
        <i className={`ti ti-${is404 ? 'mood-empty' : 'alert-circle'}`} />
      </div>
      <div className="page-header-eyebrow">{is404 ? 'Route missing' : 'Application error'}</div>
      <h2 style={{ fontWeight: 800, marginBottom: '8px' }}>
        {is404 ? 'Page not found' : 'Something went wrong'}
      </h2>
      <p className="text-muted mb-4">
        {error?.statusText || error?.message || 'An unexpected error interrupted the current view.'}
      </p>
      <button type="button" className="btn-soft btn-soft-outline" onClick={() => window.history.back()}>
        <i className="ti ti-arrow-left" />
        <span>Go back</span>
      </button>
    </div>
  );
}
