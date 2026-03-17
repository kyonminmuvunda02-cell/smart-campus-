import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  children?: ReactNode;
}

export default function EmptyState({
  icon = 'ti-database-off',
  title,
  message,
  children,
}: EmptyStateProps) {
  return (
    <div className="empty py-5">
      <div className="empty-icon">
        <i className={`ti ${icon} fs-1 text-secondary opacity-50`} />
      </div>
      <p className="empty-title fw-semibold mt-3">{title}</p>
      {message && <p className="empty-subtitle text-secondary">{message}</p>}
      {children && <div className="empty-action mt-3">{children}</div>}
    </div>
  );
}
