import { useAuth } from '../../context/AuthContext';

export default function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { userId, role } = useAuth();
  const today = new Intl.DateTimeFormat('en-ZM', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <header className="shell-topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-menu" onClick={onToggleSidebar}>
          <i className="ti ti-menu-2" />
        </button>
        <div>
          <div className="topbar-eyebrow">Cavendish University Zambia</div>
          <div className="topbar-title">Smart Campus Portal</div>
          <div className="topbar-subtitle">{today}</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-pill">
          <i className="ti ti-shield-check me-1" />
          {role ?? 'User'}
        </div>
        <div className="topbar-user">
          <div className="shell-user-avatar">{role?.slice(0, 1) ?? 'U'}</div>
          <div className="topbar-user-copy">
            <div className="topbar-eyebrow">Signed in</div>
            <div className="topbar-subtitle mono">ID {userId ?? '--'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
