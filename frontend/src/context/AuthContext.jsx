import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("pm_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pm_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("pm_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("pm_token");
        localStorage.removeItem("pm_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function applyAuth(data) {
    localStorage.setItem("pm_token", data.access_token);
    localStorage.setItem("pm_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    applyAuth(res.data);
    return res.data.user;
  }

  async function signup(payload) {
    const res = await api.post("/auth/register", payload);
    applyAuth(res.data);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("pm_token");
    localStorage.removeItem("pm_user");
    setUser(null);
  }

  function refreshUser(updated) {
    setUser(updated);
    localStorage.setItem("pm_user", JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
