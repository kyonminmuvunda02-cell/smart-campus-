import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: string;
  eyebrow?: string;
  tone?: 'royal' | 'teal' | 'green' | 'purple' | 'amber';
}

export default function PageHeader({
  title,
  subtitle,
  action,
  icon = 'layout-dashboard',
  eyebrow,
  tone = 'royal',
}: Props) {
  const toneClass = tone === 'royal' ? '' : tone;

  return (
    <div className="page-header">
      <div className="page-header-main">
        <div className={`page-header-icon ${toneClass}`.trim()}>
          <i className={`ti ti-${icon}`} />
        </div>
        <div>
          {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="page-header-actions">{action}</div>}
    </div>
  );
}
