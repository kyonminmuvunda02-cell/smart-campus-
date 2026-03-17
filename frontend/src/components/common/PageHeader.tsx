import type { ReactNode } from 'react';

type HeaderTone = 'royal' | 'teal' | 'green' | 'purple';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
  tone?: HeaderTone;
  children?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon = 'layout-dashboard',
  tone = 'royal',
  children,
}: PageHeaderProps) {
  return (
    <div className="page-hd">
      <div className="ph-left">
        <div className={`ph-icon ${tone}`}>
          <i className={`ti ti-${icon}`} />
        </div>
        <div>
          {eyebrow && <div className="ph-kicker">{eyebrow}</div>}
          <div className="ph-title">{title}</div>
          {subtitle && <div className="ph-sub">{subtitle}</div>}
        </div>
      </div>
      {children ? <div className="ph-actions">{children}</div> : null}
    </div>
  );
}
