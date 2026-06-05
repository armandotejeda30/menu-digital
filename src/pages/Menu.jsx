import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, Clock, MapPin, X } from "lucide-react";
import { supabase } from "../supabase"; // Importamos nuestra conexión

export default function Menu() {
  const navigate = useNavigate();
  
  // Estados para nuestra Base de Datos
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeCat, setActiveCat] = useState(null); // Guardará el ID de la categoría activa
  const [loading, setLoading] = useState(true);

  // Estados de la UI interactiva
  const [liked, setLiked] = useState(false);
  const [selected, setSelected] = useState(null);

  // Efecto para consultar Supabase al cargar la pantalla
  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Consultar Categorías
        const { data: cats, error: errorCats } = await supabase
          .from("categorias")
          .select("*")
          .order("nombre");
        if (errorCats) throw errorCats;

        // 2. Consultar Productos (solo los activos)
        const { data: prods, error: errorProds } = await supabase
          .from("productos")
          .select("*")
          .eq("activo", true);
        if (errorProds) throw errorProds;

        setCategories(cats);
        setAllProducts(prods);

        // Seleccionar la primera categoría por defecto
        if (cats && cats.length > 0) {
          setActiveCat(cats[0].id);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Efecto para cerrar el modal con la tecla Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  // Filtrar los productos para mostrar solo los de la categoría seleccionada
  const filteredProducts = allProducts.filter((p) => p.categoria_id === activeCat);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-xl font-medium animate-pulse">Cargando platillos...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] animate-fade-in">
      <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl">
        {/* Hero image */}
        <div className="relative h-72 w-full overflow-hidden sm:h-96">
          <img 
            src="https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Sushi" 
            className="h-full w-full object-cover" 
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 pt-6">
            <button
              onClick={() => navigate("/")}
              aria-label="Back"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-black shadow-[var(--shadow-soft)] backdrop-blur-md transition active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="relative -mt-10 rounded-t-[36px] bg-[var(--background)] px-6 pb-12 pt-8 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto h-1.5 w-12 -mt-3 mb-6 rounded-full bg-[var(--muted)]" />

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Yummy Burger King</h2>

          <div className="mt-3 flex items-center gap-5 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-[var(--star)] text-[var(--star)]" />
              <span className="font-medium text-[var(--foreground)]">4.5</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              25–35 mins
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              8 km
            </span>
          </div>

          {/* Category filters dinámicos */}
          <div className="mt-7 flex gap-2.5 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-none">
            {categories.map((c) => {
              const active = c.id === activeCat;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]"
                      : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {c.nombre}
                </button>
              );
            })}
          </div>

          {/* Product list dinámico */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-[var(--muted-foreground)] col-span-2 py-8">
                No hay productos en esta categoría aún.
              </p>
            ) : (
              filteredProducts.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="flex items-center gap-4 rounded-3xl bg-[var(--card)] p-3 text-left shadow-[var(--shadow-soft)] ring-1 ring-[var(--border)]/60 transition active:scale-[0.99] hover:ring-[var(--foreground)]/20 animate-fade-up"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <img
                    src={p.foto_url || "https://via.placeholder.com/150"}
                    alt={p.nombre}
                    className="h-24 w-24 shrink-0 rounded-2xl object-cover bg-[var(--muted)]"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold leading-tight">{p.nombre}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{p.descripcion}</p>
                    <div className="mt-2.5 text-sm font-semibold">${Number(p.precio).toLocaleString()}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Product modal dinámico */}
      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.nombre}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-t-[36px] bg-[var(--background)] shadow-2xl animate-fade-up sm:rounded-[36px]"
          >
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black shadow-[var(--shadow-soft)] backdrop-blur-md transition active:scale-95"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>

            <div className="h-64 w-full overflow-hidden bg-[var(--muted)]">
              <img src={selected.foto_url || "https://via.placeholder.com/400"} alt={selected.nombre} className="h-full w-full object-cover" />
            </div>

            <div className="px-6 pb-8 pt-6">
              <h3 className="text-2xl font-semibold tracking-tight">{selected.nombre}</h3>
              
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{selected.descripcion}</p>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Ingredientes
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {/* Convertimos el string de ingredientes separados por coma en un arreglo */}
                  {selected.ingredientes ? selected.ingredientes.split(',').map((ing, idx) => (
                    <li
                      key={idx}
                      className="rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
                    >
                      {ing.trim()}
                    </li>
                  )) : (
                    <span className="text-sm text-[var(--muted-foreground)]">No especificados</span>
                  )}
                </ul>
              </div>

              <div className="mt-7 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Precio</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    ${Number(selected.precio).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-[var(--foreground)] px-7 py-3.5 text-sm font-medium text-[var(--background)] shadow-[var(--shadow-soft)] transition active:scale-[0.98]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}