import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useBreadcrumbs } from '@/context/BreadcrumbContext';
import Breadcrumbs from '@/components/common/Breadcrumbs';

interface TopNavbarProps {
  onMenuToggle?: () => void;
}

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const { breadcrumbs } = useBreadcrumbs();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="shell-topbar">
      <div className="tb-leading">
        <button type="button" className="tb-menu" onClick={onMenuToggle} aria-label="Open navigation">
          <i className="ti ti-menu-2" />
        </button>
        {breadcrumbs.length > 0 ? (
          <div className="tb-meta d-none d-md-flex">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}
      </div>

      <div className="tb-actions">
        {role ? (
          <div className="tb-role">
            <i className={`ti ti-${role === 'Admin' ? 'shield' : role === 'Lecturer' ? 'user-star' : 'user'}`} />
            <span>{role}</span>
          </div>
        ) : null}
        <Button variant="outline-secondary" className="tb-signout" onClick={handleLogout}>
          <i className="ti ti-logout" />
          <span>Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
