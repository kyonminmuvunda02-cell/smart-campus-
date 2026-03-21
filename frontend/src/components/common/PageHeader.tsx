import { ReactNode, useEffect } from 'react';
import { type BreadcrumbItem } from './Breadcrumbs';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  tone?: string;
  children?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  icon = 'layout-dashboard',
  tone = 'royal',
  children,
}: PageHeaderProps) {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    if (breadcrumbs) {
      setBreadcrumbs(breadcrumbs);
    } else {
      setBreadcrumbs([]);
    }
  }, [breadcrumbs, setBreadcrumbs]);

  return (
    <header className="page-hd">
      <div className="ph-left">
        <div className={`ph-icon ${tone}`}>
          <i className={`ti ti-${icon}`} />
        </div>
        <div>
          <h1 className="ph-title">{title}</h1>
          {subtitle && <div className="ph-sub">{subtitle}</div>}
        </div>
      </div>
      {children ? <div className="ph-actions">{children}</div> : null}
    </header>
  );
}
