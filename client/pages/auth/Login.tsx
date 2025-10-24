import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailValid = /.+@.+\..+/.test(email);
  const passwordValid = password.length >= 6;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid || !passwordValid) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Sesión iniciada");
      const ref =
        document.referrer && document.referrer.startsWith(location.origin)
          ? document.referrer.replace(location.origin, "")
          : "/";
      navigate(ref || "/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      
      <main className="container mx-auto px-4 py-10 max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Iniciar sesión</h1>
        <form onSubmit={onSubmit} aria-busy={submitting} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Correo
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!emailValid}
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!passwordValid}
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={!emailValid || !passwordValid || submitting}
            aria-disabled={!emailValid || !passwordValid || submitting}
            data-loc="LoginSubmit"
          >
            {submitting ? "Iniciando…" : "Iniciar sesión"}
          </Button>
        </form>
      </main>
      
    </div>
  );
}
