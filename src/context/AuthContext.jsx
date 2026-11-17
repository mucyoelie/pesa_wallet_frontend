import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UNAUTHORIZED_EVENT, api } from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Owns the signed-in user. `status` is "loading" while the session is checked,
 * "authenticated", "guest" when nobody is signed in, or "error" when the API could
 * not be reached at all.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const payload = await api.auth.me();
      setUser(payload.data);
      setStatus('authenticated');
    } catch (requestError) {
      setUser(null);
      if (requestError.status === 401) {
        setStatus('guest');
      } else {
        setError(requestError);
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The API client emits this when a request comes back 401, e.g. the session
  // expired while the dashboard was open.
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleExpired);
  }, []);

  const startSession = useCallback((payload) => {
    setUser(payload.data);
    setError(null);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (credentials) => {
      const payload = await api.auth.login(credentials);
      startSession(payload);
      return payload.data;
    },
    [startSession],
  );

  const register = useCallback(
    async (details) => {
      const payload = await api.auth.register(details);
      startSession(payload);
      return payload.data;
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Signing out locally still matters if the request failed.
    }
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ user, status, error, login, register, logout, reload: load }),
    [user, status, error, login, register, logout, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
