import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface AuthState {
  token: string | null;
  userId: number | null;
  role: 'Student' | 'Lecturer' | 'Admin' | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, userId: number, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readPersistedAuth(): AuthState {
  return {
    token: localStorage.getItem('access_token'),
    userId: Number(localStorage.getItem('user_id')) || null,
    role: (localStorage.getItem('user_role') as AuthState['role']) || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readPersistedAuth);

  const login = useCallback((token: string, userId: number, role: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_id', String(userId));
    localStorage.setItem('user_role', role);
    setAuth({ token, userId, role: role as AuthState['role'] });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    setAuth({ token: null, userId: null, role: null });
  }, []);

  const isRole = useCallback((...roles: string[]) => {
    return auth.role !== null && roles.includes(auth.role);
  }, [auth.role]);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        isAuthenticated: auth.token !== null,
        isRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
