import { NavLink } from 'react-router';
import { useAuth } from '../../context/AuthContext';

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

function linkClassName({ isActive }: { isActive: boolean }) {
  return `shell-nav-item${isActive ? ' active' : ''}`;
}

function bottomLinkClassName({ isActive }: { isActive: boolean }) {
  return `shell-bottom-item${isActive ? ' active' : ''}`;
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { role, logout, userId } = useAuth();
  const initials = role ? role.slice(0, 1) : 'U';

  const sharedItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: 'layout-dashboard' },
  ];
  const studentItems: NavItem[] = [
    { to: '/checkin', label: 'Scan Attendance', icon: 'qrcode' },
    { to: '/my-attendance', label: 'My Attendance', icon: 'calendar-check' },
    { to: '/my-digital-id', label: 'Digital ID', icon: 'id-badge-2' },
  ];
  const lecturerItems: NavItem[] = [
    { to: '/sessions/new', label: 'Start Session', icon: 'player-play' },
    { to: '/sessions', label: 'My Sessions', icon: 'list-details' },
  ];
  const adminItems: NavItem[] = [
    { to: '/sessions', label: 'Sessions', icon: 'timeline' },
    { to: '/admin/users', label: 'Users', icon: 'users' },
    { to: '/admin/courses', label: 'Courses', icon: 'book-2' },
    { to: '/admin/audit', label: 'Audit Logs', icon: 'shield-search' },
  ];

  const roleItems =
    role === 'Student' ? studentItems : role === 'Lecturer' ? lecturerItems : adminItems;
  const bottomItems = [...sharedItems, ...roleItems].slice(0, 4);

  return (
    <>
      <aside className={`shell-sidebar ${open ? 'open' : ''}`}>
        <div className="shell-brand">
          <div className="shell-brand-mark">
            <i className="ti ti-school" />
          </div>
          <div>
            <div className="shell-brand-title">CUZ Smart Campus</div>
            <div className="shell-brand-subtitle">Digital ID and attendance</div>
          </div>
        </div>

        <div className="shell-section">Workspace</div>
        <nav className="shell-nav">
          {sharedItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClassName}
              onClick={onClose}
            >
              <i className={`ti ti-${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shell-section">Role tools</div>
        <nav className="shell-nav">
          {roleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClassName}
              onClick={onClose}
            >
              <i className={`ti ti-${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shell-user">
          <div className="shell-user-card">
            <div className="shell-user-avatar">{initials}</div>
            <div>
              <div className="shell-user-name">User #{userId ?? '--'}</div>
              <div className="shell-user-role">{role ?? 'Unknown role'}</div>
            </div>
          </div>
          <button type="button" className="shell-signout" onClick={logout}>
            <i className="ti ti-logout-2" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <nav className="shell-bottom-nav">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={bottomLinkClassName}
          >
            <i className={`ti ti-${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
