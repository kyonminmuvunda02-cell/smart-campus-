import { Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/modules/auth/context/AuthProvider';

interface TopNavbarProps {
  onMenuToggle?: () => void;
}

function getRouteCopy(pathname: string) {
  if (pathname.startsWith('/sessions')) return { label: 'Teaching', title: 'Session operations' };
  if (pathname.startsWith('/users')) return { label: 'Administration', title: 'User management' };
  if (pathname.startsWith('/courses')) return { label: 'Administration', title: 'Course catalog' };
  if (pathname.startsWith('/venues')) return { label: 'Administration', title: 'Venue management' };
  if (pathname.startsWith('/audit')) return { label: 'Administration', title: 'Audit evidence' };
  if (pathname.startsWith('/checkin')) return { label: 'Student flow', title: 'Attendance check-in' };
  if (pathname.startsWith('/my-attendance')) return { label: 'Student flow', title: 'Attendance history' };
  if (pathname.startsWith('/my-digital-id')) return { label: 'Student flow', title: 'Digital identity' };
  return { label: 'Workspace', title: 'Campus operations overview' };
}

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { logout, role, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeCopy = getRouteCopy(location.pathname);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="shell-topbar">
      <div className="tb-leading">
        <button type="button" className="tb-menu" onClick={onMenuToggle} aria-label="Open navigation">
          <i className="ti ti-menu-2" />
        </button>
        <div className="tb-meta">
          <div className="tb-label">{routeCopy.label}</div>
          <div className="tb-title">{routeCopy.title}</div>
          <div className="tb-subtitle">Role-based access and attendance workflow</div>
        </div>
      </div>

      <div className="tb-actions">
        {role ? (
          <div className="tb-role">
            <i className={`ti ti-${role === 'Admin' ? 'shield' : role === 'Lecturer' ? 'user-star' : 'user'}`} />
            <span>{role}</span>
          </div>
        ) : null}
        <div className="tb-avatar">{userId ? String(userId).slice(-2) : '--'}</div>
        <Button variant="outline-secondary" className="tb-signout" onClick={handleLogout}>
          <i className="ti ti-logout" />
          <span>Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
