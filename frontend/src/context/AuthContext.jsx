import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken, loadStoredToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = loadStoredToken();
    if (!token) { setLoading(false); return; }
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(name, email, password) {
    const data = await api.signup({ name, email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function loginWithGoogle(demoName, demoEmail) {
    const data = await api.loginGoogle({ name: demoName, email: demoEmail });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
