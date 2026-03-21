import { useActionState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { Auth } from '@/client';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { getErrorMessage } from '@/utils/errors';

interface ActionState {
  error: string | null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      if (!localStorage.getItem('device_id')) {
        localStorage.setItem('device_id', uuidv4());
      }

      const { data: tokenData, error: loginError } = await Auth.loginAccessToken({
        body: {
          username: String(formData.get('email')),
          password: String(formData.get('password')),
        },
      });

      if (loginError) {
        return { error: getErrorMessage({ body: loginError }) };
      }

      const token = (tokenData as { access_token?: string })?.access_token;
      if (!token) return { error: 'No token received from server.' };

      localStorage.setItem('access_token', token);

      const { data: user, error: userError } = await Auth.getCurrentUser();
      if (userError || !user) {
        localStorage.removeItem('access_token');
        return { error: getErrorMessage({ body: userError }) || 'Could not load user profile.' };
      }

      login(token, user.user_id, user.role);
      navigate('/', { replace: true });
      return { error: null };
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(loginAction, { error: null });

  return (
    <div className="login-shell simple">
      <section className="login-panel simple">
        <div className="login-panel-head">
          <div className="login-brand compact">
            <div className="login-brand-mark">
              <i className="ti ti-school" />
            </div>
            <div>
              <div className="login-eyebrow">Cavendish University Zambia</div>
              <div className="login-brand-name">Smart Campus</div>
            </div>
          </div>

          <div className="login-intro">
            <h1 className="login-title">Sign in</h1>
            <p className="login-copy">Use your campus account to access attendance, digital identity, and teaching operations.</p>
          </div>
        </div>

        {state.error && (
          <Alert variant="danger" className="mb-3">
            <i className="ti ti-alert-circle me-2" />
            {state.error}
          </Alert>
        )}

        <Form action={formAction} className="login-form">
          <div className="field-shell">
            <label htmlFor="email" className="field-label">Email address</label>
            <div className="field-wrap">
              <i className="ti ti-mail" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@cuz.ac.zm"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="field-shell">
            <label htmlFor="password" className="field-label">Password</label>
            <div className="field-wrap">
              <i className="ti ti-lock" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="login-helper">Use the password assigned to your campus account.</div>
          </div>

          <div className="login-hint compact">
            <i className="ti ti-device-mobile" />
            <span>Your device identity is created automatically on first sign-in.</span>
          </div>

          <Button type="submit" variant="primary" className="w-100" disabled={isPending}>
            {isPending ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              <>
                <i className="ti ti-login" />
                Sign In
              </>
            )}
          </Button>
        </Form>
      </section>
    </div>
  );
}
