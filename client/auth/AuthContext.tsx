import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "buyer" | "agent" | "company";
export type AuthUser = { id: string; full_name: string; email: string; role: Role };

type LoginInput = { email: string; password: string };
type RegisterInput = { full_name: string; email: string; password: string; role: Role };

type AuthContextValue = {
  currentUser: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LS_KEY = "imx_user";

function shortId(len = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[(Math.random() * alphabet.length) | 0];
  return out;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(LS_KEY, JSON.stringify(user));
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser: user,
    async login({ email, password }) {
      const emailOk = /.+@.+\..+/.test(email);
      if (!emailOk) throw new Error("Correo inválido");
      if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
      const id = shortId();
      const name = email.split("@")[0];
      setUser({ id, full_name: name, email, role: "buyer" });
    },
    async register({ full_name, email, password, role }) {
      const emailOk = /.+@.+\..+/.test(email);
      if (!full_name || full_name.trim().length < 2) throw new Error("Nombre inválido");
      if (!emailOk) throw new Error("Correo inválido");
      if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
      const id = shortId();
      setUser({ id, full_name, email, role });
    },
    async logout() {
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
