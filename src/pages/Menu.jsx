import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, Clock, X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../supabase";
import toast, { Toaster } from "react-hot-toast";

export default function Menu() {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState({
    nombre_negocio: "Cargando...",
    foto_welcome_url: "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=1000&q=80",
    telefono_whatsapp: "5216871717189"
  });

  const [liked, setLiked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [publicidadBanners, setPublicidadBanners] = useState([]);

  // ==========================================
  // ESTADOS Y LÓGICA DEL CARRITO (LOCALSTORAGE)
  // ==========================================
  const [cart, setCart] = useState(() => {
    const localCart = localStorage.getItem("cart_menu");
    return localCart ? JSON.parse(localCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sincronizar carrito con localStorage cada que cambie
  useEffect(() => {
    localStorage.setItem("cart_menu", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item.id === product.id);
      if (exists) {
        toast.success(`Cantidad actualizada: ${product.nombre}`);
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      toast.success(`Añadido al carrito: ${product.nombre}`);
      return [...prevCart, { ...product, quantity: qty }];
    });
  };

  const updateQuantity = (id, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + change;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id, name) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    toast.error(`Eliminado: ${name}`);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.precio * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ==========================================
  // CONSTRUCCIÓN DEL MENSAJE DE WHATSAPP
  // ==========================================
  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let totalPedido = 0;
    let text = `*Nuevo Pedido — ${config.nombre_negocio}*\n`;
    text += `=========================\n\n`;

    cart.forEach((item) => {
      const subtotal = item.precio * item.quantity;
      totalPedido += subtotal;
      text += `*${item.quantity}x* ${item.nombre}\n`;
      if (item.descripcion) text += `   _${item.descripcion.slice(0, 40)}..._\n`;
      text += `   Precio: $${Number(item.precio).toLocaleString()} | Subtotal: *$${subtotal.toLocaleString()}*\n\n`;
    });

    text += `=========================\n`;
    text += `*TOTAL A PAGAR: $${totalPedido.toLocaleString()}*\n\n`;
    text += `_Por favor, confírmenme la recepción del pedido para acordar la entrega. ¡Gracias!_`;

    const encodedText = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send/?phone=${config.telefono_whatsapp}&text=${encodedText}&type=phone_number&app_absent=0`;
    
    window.open(url, "_blank");
  };

  // Carga inicial de datos
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: configData } = await supabase.from("configuracion").select("*").eq("id", 1).single();
        if (configData) setConfig(configData);

        const { data: bannersData } = await supabase.from("publicidad").select("*").order("created_at", { ascending: true });
        if (bannersData) setPublicidadBanners(bannersData);

        const { data: cats } = await supabase.from("categorias").select("*").order("orden", { ascending: true });
        const { data: prods } = await supabase.from("productos").select("*").eq("activo", true);

        if (cats) setCategories(cats);
        if (prods) setAllProducts(prods);
        if (cats && cats.length > 0) setActiveCat(cats[0].id);
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Control del carrusel publicitario
  const sliderImages = publicidadBanners.map((b) => b.foto_url);
  if (sliderImages.length === 0 && config.foto_welcome_url) {
    sliderImages.push(config.foto_welcome_url);
  }

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const filteredProducts = allProducts.filter((p) => p.categoria_id === activeCat);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl font-medium animate-pulse text-neutral-700">Cargando menú...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F5F5F7] text-[#09090b] animate-fade-in pb-24">
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: '100px', background: '#333', color: '#fff', fontSize: '13px' } }} />

      <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl bg-white min-h-screen shadow-sm relative">
        
        {/* CARRUSEL DE PUBLICIDAD */}
        <div className="relative h-64 w-full overflow-hidden bg-black md:h-80">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentSlide}
              src={sliderImages[currentSlide]}
              alt="Publicidad"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />

          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5">
            <button onClick={() => navigate("/")} className="grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition active:scale-95">
              <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <button onClick={() => setLiked((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition active:scale-95">
              <Heart className={`h-5 w-5 transition ${liked ? "fill-red-500 text-red-500" : ""}`} strokeWidth={2.2} />
            </button>
          </div>

          {sliderImages.length > 1 && (
            <div className="absolute bottom-12 left-0 right-0 z-10 flex justify-center gap-1.5">
              {sliderImages.map((_, idx) => (
                <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? "w-5 bg-white" : "w-1 bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>

        {/* INFO PANEL */}
        <div className="relative -mt-8 rounded-t-[32px] bg-white px-5 pt-6 pb-4 z-10">
          <div className="mx-auto h-1 w-10 bg-gray-200 rounded-full mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">{config.nombre_negocio}</h2>
          
          <div className="mt-2 flex items-center gap-4 text-xs font-medium text-neutral-500">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.8</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Abierto ahora</span>
            {config.eslogan && <span className="truncate italic text-neutral-400">"{config.eslogan}"</span>}
          </div>

          {/* FILTROS DE CATEGORÍAS */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
            {categories.map((c) => {
              const active = c.id === activeCat;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all ${active ? "bg-black text-white shadow-md" : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"}`}
                >
                  {c.nombre}
                </button>
              );
            })}
          </div>

          {/* LISTA DE PRODUCTOS */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-neutral-400 col-span-2 py-8 text-sm">No hay productos aquí.</p>
            ) : (
              filteredProducts.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-2.5 text-left shadow-sm ring-1 ring-black/[0.03] transition hover:ring-black/10 active:scale-[0.99]"
                >
                  <img src={p.foto_url || "https://via.placeholder.com/150"} alt={p.nombre} className="h-20 w-20 shrink-0 rounded-xl object-cover bg-neutral-100" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-tight text-neutral-900 truncate">{p.nombre}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400 leading-normal">{p.descripcion || "Sin descripción."}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-900">${Number(p.precio).toLocaleString()}</span>
                      <span className="text-[10px] bg-neutral-100 font-medium px-2 py-0.5 rounded-full text-neutral-600">Ver más</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      // BOTÓN FLOTANTE DEL CARRITO (FAB)
      {/* ========================================== */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 20 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-black px-5 py-4 text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-2 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {cartCount}
            </span>
          </div>
          <span className="text-sm font-semibold">${cartTotal.toLocaleString()}</span>
        </motion.button>
      )}

      {/* ========================================== */}
      {/* DETALLE DEL PRODUCTO (MODAL MODIFICADO) */}
      {/* ========================================== */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="relative w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-3xl">
              <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition active:scale-95"><X className="h-4 w-4" strokeWidth={2.4} /></button>
              <div className="h-56 w-full overflow-hidden bg-neutral-100"><img src={selected.foto_url || "https://via.placeholder.com/400"} alt={selected.nombre} className="h-full w-full object-cover" /></div>
              <div className="p-5">
                <h3 className="text-xl font-bold tracking-tight text-neutral-900">{selected.nombre}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{selected.descripcion}</p>
                {selected.ingredientes && (
                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Ingredientes</span>
                    <ul className="mt-2 flex flex-wrap gap-1.5">{selected.ingredientes.split(',').map((ing, idx) => (<li key={idx} className="rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700">{ing.trim()}</li>))}</ul>
                  </div>
                )}
                <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 block">Precio</span>
                    <span className="text-2xl font-bold text-neutral-900">${Number(selected.precio).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => { addToCart(selected); setSelected(null); }}
                    className="rounded-full bg-black px-6 py-3.5 text-xs font-semibold text-white shadow-md hover:bg-neutral-800 transition active:scale-95"
                  >
                    Añadir al carrito
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* DRAWER DEL CARRITO (PANEL LATERAL SLIDE) */}
      {/* ========================================== */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
              className="h-full w-full max-w-md bg-white p-5 shadow-2xl flex flex-col justify-between"
            >
              {/* Encabezado */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-neutral-800" />
                  <h3 className="text-lg font-bold">Tu Pedido</h3>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-600">{cartCount}</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-50 text-neutral-500 hover:bg-neutral-100 transition"><X className="h-5 w-5" /></button>
              </div>

              {/* Lista de productos en el carrito */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-none">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 text-sm">Tu carrito está vacío.</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border-b border-neutral-50 pb-3">
                      <img src={item.foto_url || "https://via.placeholder.com/100"} alt={item.nombre} className="h-14 w-14 rounded-xl object-cover border" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-neutral-900 truncate">{item.nombre}</h4>
                        <p className="text-xs text-neutral-500 font-bold mt-0.5">${Number(item.precio * item.quantity).toLocaleString()}</p>
                        
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-neutral-200 rounded-full bg-neutral-50 px-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-neutral-500 hover:text-black transition"><Minus className="h-3 w-3" /></button>
                            <span className="w-6 text-center text-xs font-bold text-neutral-800">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-neutral-500 hover:text-black transition"><Plus className="h-3 w-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.nombre)} className="text-neutral-400 hover:text-red-500 transition p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pie de página del checkout */}
              <div className="border-t border-neutral-100 pt-4 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-500">Subtotal</span>
                  <span className="text-xl font-bold text-neutral-900">${cartTotal.toLocaleString()}</span>
                </div>
                
                <button
                  onClick={sendWhatsAppOrder}
                  disabled={cart.length === 0}
                  className="w-full rounded-full bg-emerald-600 py-4 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-50 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  Enviar Pedido por WhatsApp
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}