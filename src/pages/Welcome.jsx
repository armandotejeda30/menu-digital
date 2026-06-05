import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();
  // Imagen de fondo de Unsplash
  const welcomeBg = "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src={welcomeBg}
        alt="Restaurant ambiance"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-8 py-16 text-white">
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-fade-up">
          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-white/70">
            YZMMA
          </p>
          <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl md:text-7xl">
            Bienvenido a<br />Yzmma Sushi!
          </h1>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/70">
            Hacemos lo imposible posible.
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-6 animate-fade-up" style={{ animationDelay: "150ms" }}>
          {/* Botón modificado para navegar al menú */}
          <button
            onClick={() => navigate("/menu")}
            className="w-full rounded-full border border-white/80 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-[0.98]"
          >
            Ver Menú
          </button>
          <p className="text-sm text-white/70">
            ¿Eres el administrador?{" "}
            <button onClick={() => navigate("/admin")} className="font-medium text-white underline-offset-4 hover:underline">
              Entrar al panel
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}