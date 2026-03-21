import { NavLink } from 'react-router';
import { useAuth } from '@/modules/auth/context/AuthProvider';

export interface AppNavItem {
  to: string;
  icon: string;
  label: string;
  roles?: Array<'Student' | 'Lecturer' | 'Admin'>;
  end?: boolean;
  section: string;
}

const NAV_ITEMS: AppNavItem[] = [
  { to: '/', icon: 'home', label: 'Dashboard', end: true, section: 'Workspace' },
  { to: '/checkin', icon: 'qrcode', label: 'Check In', roles: ['Student'], section: 'Student' },
  { to: '/my-courses', icon: 'books', label: 'Courses', roles: ['Student'], section: 'Student' },
  { to: '/my-attendance', icon: 'calendar-check', label: 'Attendance', roles: ['Student'], section: 'Student' },
  { to: '/my-digital-id', icon: 'id', label: 'Digital ID', roles: ['Student'], section: 'Student' },
  { to: '/sessions', icon: 'presentation', label: 'Classes', roles: ['Lecturer', 'Admin'], section: 'Teaching' },
  { to: '/sessions/new', icon: 'plus', label: 'Start Class', roles: ['Lecturer'], section: 'Teaching' },
  { to: '/attendance-review', icon: 'shield-search', label: 'Review Queue', roles: ['Lecturer', 'Admin'], section: 'Teaching' },
  { to: '/users', icon: 'users', label: 'Users', roles: ['Admin'], section: 'Administration' },
  { to: '/courses', icon: 'books', label: 'Courses', roles: ['Admin'], section: 'Administration' },
  { to: '/venues', icon: 'building', label: 'Venues', roles: ['Admin'], section: 'Administration' },
  { to: '/enrollments', icon: 'list-check', label: 'Enrollments', roles: ['Admin'], section: 'Administration' },
  { to: '/audit', icon: 'file-text', label: 'Audit Logs', roles: ['Admin'], section: 'Administration' },
];

export function getVisibleNavItems(role: 'Student' | 'Lecturer' | 'Admin' | null) {
  return NAV_ITEMS.filter((item) => !item.roles || (role ? item.roles.includes(role) : false));
}

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ isOpen = false, onNavigate }: SidebarProps) {
  const { role, userId } = useAuth();
  const visibleItems = getVisibleNavItems(role);
  const sections = Array.from(new Set(visibleItems.map((item) => item.section)));

  return (
    <aside className={`shell-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sb-brand">
        <div className="sb-logo">
          <i className="ti ti-school" />
        </div>
        <div>
          <div className="sb-brand-title">CUZ Smart Campus</div>
          <div className="sb-brand-sub">Digital ID &amp; attendance tracking</div>
        </div>
      </div>

      <nav className="sb-nav">
        {sections.map((section) => (
          <div key={section}>
            <div className="sb-section-label">{section}</div>
            {visibleItems
              .filter((item) => item.section === section)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}
                  onClick={onNavigate}
                >
                  <i className={`ti ti-${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-avatar">{userId ? String(userId).slice(-2) : '--'}</div>
        <div>
          <div className="sb-user-name">User #{userId ?? '--'}</div>
          <div className="sb-user-meta">{role ?? 'Guest workspace'}</div>
        </div>
      </div>
    </aside>
  );
}
