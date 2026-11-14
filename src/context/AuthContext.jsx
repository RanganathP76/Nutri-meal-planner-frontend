import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api, { tokenStore, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const deviceName = () => `${navigator.userAgentData?.platform || navigator.platform || 'Unknown'} browser`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [notice, setNotice] = useState('');

  const logout = useCallback((message = '') => {
    tokenStore.clear();
    setUser(null);
    setNotice(message);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((msg) => logout(msg));
  }, [logout]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data.user);
      return data.user;
    } catch (error) {
      // It's safer to clear loading even if the initial check fails
      throw error;
    }
  }, []);

  // Validate the saved token when the app opens
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => { /* a 401 is handled by the api client; a network error keeps the login */ })
      .finally(() => setLoading(false));
  }, [refreshUser, logout]);

  const googleSignIn = useCallback(async (credential, extra = {}) => {
    const { data } = await api.post('/users/google', { credential, deviceName: deviceName(), ...extra });
    tokenStore.set(data.token);
    setNotice('');
    setUser(data.user);
    return data;
  }, []);

  // 1. Bundle all pieces of context into an object
  // 2. Wrap in useMemo to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    user,
    loading,
    notice,
    setNotice,
    googleSignIn,
    logout,
    refreshUser
  }), [user, loading, notice, googleSignIn, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
