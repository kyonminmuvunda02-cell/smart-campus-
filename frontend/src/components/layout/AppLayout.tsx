import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import Sidebar, { getVisibleNavItems } from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';
import { useAuth } from '@/modules/auth/context/AuthProvider';

function getBottomNav(role: 'Student' | 'Lecturer' | 'Admin' | null) {
  const items = getVisibleNavItems(role);
  if (role === 'Student') return items.filter((item) => ['/', '/checkin', '/my-courses', '/my-attendance', '/my-digital-id'].includes(item.to));
  if (role === 'Lecturer') return items.filter((item) => ['/', '/sessions', '/sessions/new'].includes(item.to));
  if (role === 'Admin') return items.filter((item) => ['/', '/users', '/courses', '/audit'].includes(item.to));
  return items.filter((item) => item.to === '/');
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { role } = useAuth();
  const bottomNav = getBottomNav(role);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div
        className={`sb-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="shell-main">
        <TopNavbar onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main className="shell-content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav">
        {bottomNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <i className={`ti ti-${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
