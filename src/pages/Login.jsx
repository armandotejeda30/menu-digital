import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Bienvenido al panel");
      navigate("/admin");
    } catch (error) {
      toast.error("Credenciales incorrectas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '100px', background: '#333', color: '#fff', fontSize: '14px' } }} />
      
      <header className="p-5">
        <Link
          to="/"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Acceso Admin</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
                placeholder="admin@restaurante.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-4 text-sm font-medium text-[var(--background)] shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Verificando..." : "Entrar al Panel"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}