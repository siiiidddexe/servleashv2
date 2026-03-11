import { createContext, useContext, useState, useEffect } from "react";

const AuthCtx = createContext(null);

const USER_KEY   = "servleash_user";
const TOKEN_KEY  = "servleash_token";
const EXPIRY_KEY = "servleash_expiry";
const TTL_MS     = 30 * 24 * 60 * 60 * 1000; // 30 days

function loadPersistedAuth() {
  try {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return { user: null, token: null };
    }
    const stored = localStorage.getItem(USER_KEY);
    const token  = localStorage.getItem(TOKEN_KEY);
    return {
      user: stored ? JSON.parse(stored) : null,
      token: token || null,
    };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const initial = loadPersistedAuth();
  const [user,  setUser]  = useState(initial.user);
  const [token, setToken] = useState(initial.token);

  // Persist whenever auth changes — sliding 30-day expiry
  useEffect(() => {
    if (user && token) {
      localStorage.setItem(USER_KEY,   JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY,  token);
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
  }, [user, token]);

  const login = (userData, tkn) => {
    setUser(userData);
    setToken(tkn);
  };

  const logout = () => {
    // Fire-and-forget logout to server — never block UI on it
    try {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    } catch {}
    setUser(null);
    setToken(null);
    // Prevent back-button returning to stale authenticated pages
    window.location.replace("/login");
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, isAuthed: !!token }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

