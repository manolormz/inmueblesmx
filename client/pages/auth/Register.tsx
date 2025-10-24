import { useState } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer"|"agent"|"company">("buyer");
  const [submitting, setSubmitting] = useState(false);

  const nameValid = full_name.trim().length >= 2;
  const emailValid = /.+@.+\..+/.test(email);
  const passwordValid = password.length >= 6;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameValid || !emailValid || !passwordValid) return;
    setSubmitting(true);
    try {
      await registerUser({ full_name, email, password, role });
      toast.success("Registro exitoso");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Error al registrarse");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Crear cuenta</h1>
        <p className="text-sm text-gray-600 mb-4">Este acceso es de demostración. No uses datos reales.</p>
        <form onSubmit={onSubmit} aria-busy={submitting} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">Nombre completo</label>
            <Input id="name" value={full_name} onChange={(e) => setFullName(e.target.value)} aria-invalid={!nameValid} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Correo</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!emailValid} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Contraseña</label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!passwordValid} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="role">Rol</label>
            <select id="role" className="w-full border rounded h-10 px-2" value={role} onChange={(e)=>setRole(e.target.value as any)}>
              <option value="buyer">Comprador</option>
              <option value="agent">Agente</option>
              <option value="company">Empresa</option>
            </select>
          </div>
          <Button type="submit" disabled={!nameValid || !emailValid || !passwordValid || submitting} aria-disabled={!nameValid || !emailValid || !passwordValid || submitting} data-loc="RegisterSubmit">
            {submitting ? "Creando…" : "Registrarse"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
