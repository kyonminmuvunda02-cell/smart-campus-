import { useActionState, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Auth } from '../../client/sdk.gen';
import { getErrorMessage } from '../../utils/errors';

type LoginRole = 'Student' | 'Lecturer' | 'Admin';

const roleCopy: Record<LoginRole, { helper: string; icon: string }> = {
  Student: {
    helper: 'Use your student portal credentials to access QR-based attendance tools.',
    icon: 'user',
  },
  Lecturer: {
    helper: 'Open attendance sessions, refresh QR codes, and review live check-ins.',
    icon: 'user-star',
  },
  Admin: {
    helper: 'Manage users, courses, and audit evidence from the admin workspace.',
    icon: 'shield',
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [roleTab, setRoleTab] = useState<LoginRole>('Student');

  async function loginAction(_prev: { error: string | null }, formData: FormData) {
    try {
      const { data: tokenData, error: loginError } = await Auth.loginAccessToken({
        body: {
          grant_type: 'password',
          username: String(formData.get('email')),
          password: String(formData.get('password')),
        },
      });

      if (loginError) {
        return { error: getErrorMessage({ body: loginError }) };
      }

      const token = (tokenData as { access_token?: string } | null)?.access_token;
      if (!token) return { error: 'No token received from server.' };

      localStorage.setItem('access_token', token);

      const { data: user, error: userError } = await Auth.getCurrentUser();
      if (userError || !user) {
        return { error: getErrorMessage({ body: userError }) || 'Could not load user profile.' };
      }

      login(token, user.user_id, user.role);
      navigate('/');
      return { error: null };
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(loginAction, { error: null });

  return (
    <div className="login-shell">
      <section className="login-panel">
        <div className="mb-4">
          <div className="page-header-eyebrow">CUZ final year project</div>
          <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: 800 }}>
            Sign in to Smart Campus
          </h1>
          <p className="text-muted mb-0">{roleCopy[roleTab].helper}</p>
        </div>

        <div className="login-role-tabs" aria-label="Portal role preview">
          {(Object.keys(roleCopy) as LoginRole[]).map((role) => (
            <button
              key={role}
              type="button"
              className={`login-role-tab ${role === roleTab ? 'active' : ''}`}
              onClick={() => setRoleTab(role)}
            >
              <i className={`ti ti-${roleCopy[role].icon} me-2`} />
              {role}
            </button>
          ))}
        </div>

        {state.error && <Alert variant="danger">{state.error}</Alert>}

        <Form action={formAction}>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="your@cuz.ac.zm"
              autoComplete="email"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </Form.Group>

          <div className="login-hint-grid mb-4">
            <div className="hint-card">
              <strong>Digital ID ready</strong>
              <span className="text-muted small">
                Students can check card validity before scanning attendance.
              </span>
            </div>
            <div className="hint-card">
              <strong>Privacy-aware GPS</strong>
              <span className="text-muted small">
                Location is used only to verify physical presence during check-in.
              </span>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-100 py-2" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Open portal'}
          </Button>
        </Form>
      </section>

      <aside className="login-brand-panel">
        <div className="login-brand-mark">
          <i className="ti ti-school" />
        </div>
        <div className="page-header-eyebrow text-white-50">Smart Campus MVP</div>
        <h2 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '12px' }}>
          Digital attendance with better proof of presence.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.82)', maxWidth: '42rem', marginBottom: 0 }}>
          This interface now presents the project like a serious final-year delivery: clear
          workflows, role-aware tools, and visual emphasis on QR, GPS, RBAC, and auditability.
        </p>

        <div className="login-feature-list">
          <div className="login-feature">
            <div className="login-feature-badge">
              <i className="ti ti-qrcode" />
            </div>
            Time-limited QR codes reduce screenshot and forwarding abuse.
          </div>
          <div className="login-feature">
            <div className="login-feature-badge">
              <i className="ti ti-map-pin" />
            </div>
            Browser GPS confirms on-campus presence before a record is accepted.
          </div>
          <div className="login-feature">
            <div className="login-feature-badge">
              <i className="ti ti-shield-lock" />
            </div>
            Role-based access keeps student, lecturer, and admin workflows separate.
          </div>
        </div>
      </aside>
    </div>
  );
}
