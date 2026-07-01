import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Pencil, Plus, Trash2, Loader2, Image as ImageIcon, AlertTriangle, LogOut, Save, Upload, ChevronUp, ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../supabase";

export default function AdminPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [banners, setBanners] = useState([]); 
  
  const [configNombre, setConfigNombre] = useState("");
  const [configEslogan, setConfigEslogan] = useState("");
  const [configPreview, setConfigPreview] = useState("");
  const [configWhatsapp, setConfigWhatsapp] = useState("");
  const [configImagenFile, setConfigImagenFile] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const configFileInputRef = useRef(null);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileInputRef = useRef(null);

  const [editingProd, setEditingProd] = useState(null);
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: "", id: null, title: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    // CAMBIO AQUÍ: Ahora ordenamos las categorías por la columna "orden"
    const { data: cats } = await supabase.from("categorias").select("*").order("orden", { ascending: true });
    const { data: prods } = await supabase.from("productos").select("*").order("created_at", { ascending: false });
    const { data: bns } = await supabase.from("publicidad").select("*").order("created_at", { ascending: true });
    
    if (cats) setCategorias(cats);
    if (prods) setProductos(prods);
    if (bns) setBanners(bns);

    const { data: config } = await supabase.from("configuracion").select("*").eq("id", 1).single();
    if (config) {
      setConfigNombre(config.nombre_negocio);
      setConfigEslogan(config.eslogan);
      setConfigPreview(config.foto_welcome_url);
      setConfigWhatsapp(config.telefono_whatsapp || "");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lock = prodModalOpen || catModalOpen || deleteDialog.isOpen;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [prodModalOpen, catModalOpen, deleteDialog.isOpen]);

  // ==========================================
  // FUNCIÓN PARA ORDENAR CATEGORÍAS MANUALMENTE
  // ==========================================
  const moveCategory = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categorias.length) return;

    // Intercambiar en el array local para que la UI sea instantánea
    const newCats = [...categorias];
    const temp = newCats[index];
    newCats[index] = newCats[newIndex];
    newCats[newIndex] = temp;
    setCategorias(newCats);

    try {
      // Preparar los datos actualizados con su nuevo índice de orden
      const updates = newCats.map((cat, i) => ({
        ...cat,
        orden: i
      }));
      
      // Upsert guarda los cambios masivos en Supabase
      const { error } = await supabase.from("categorias").upsert(updates);
      if (error) throw error;
    } catch (error) {
      toast.error("Error al guardar el orden");
      fetchData(); // Si falla, recargamos el orden original
    }
  };

  const compressImageNative = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 1200; 
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], fileName, { type: "image/jpeg", lastModified: Date.now() });
            resolve(compressedFile);
          }, "image/jpeg", 0.85);
        };
      };
    });
  };

  const handleUploadBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (banners.length >= 5) {
      toast.error("Máximo permitido: 5 banners publicitarios");
      return;
    }

    setIsUploadingBanner(true);
    toast.loading("Procesando y subiendo publicidad...", { id: "banner-toast" });

    try {
      const compressed = await compressImageNative(file);
      const fileName = `banner-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("imagenes-menu").upload(fileName, compressed);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("imagenes-menu").getPublicUrl(fileName);
      const { error: dbError } = await supabase.from("publicidad").insert([{ foto_url: data.publicUrl }]);
      if (dbError) throw dbError;

      toast.success("Publicidad agregada con éxito", { id: "banner-toast" });
      fetchData(); 
    } catch (err) {
      toast.error("Error al subir el banner publicitario", { id: "banner-toast" });
    } finally {
      setIsUploadingBanner(false);
      bannerFileInputRef.current.value = "";
    }
  };

  const handleConfigImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setConfigPreview(URL.createObjectURL(file));
      try {
        toast.loading("Optimizando portada...", { id: "config-img-toast" });
        const compressed = await compressImageNative(file);
        setConfigImagenFile(compressed);
        toast.success("Portada optimizada", { id: "config-img-toast" });
      } catch (err) {
        setConfigImagenFile(file);
        toast.error("usando original", { id: "config-img-toast" });
      }
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configNombre.trim()) return;
    setIsSavingConfig(true);

    try {
      let finalUrl = configPreview;

      if (configImagenFile) {
        const fileExt = configImagenFile.name.split('.').pop();
        const fileName = `welcome-bg-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("imagenes-menu").upload(fileName, configImagenFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("imagenes-menu").getPublicUrl(fileName);
        finalUrl = data.publicUrl;
      }

      await supabase.from("configuracion").update({
        nombre_negocio: configNombre.trim(),
        eslogan: configEslogan.trim(),
        foto_welcome_url: finalUrl,
        telefono_whatsapp: configWhatsapp.trim()
      }).eq("id", 1);

      toast.success("Identidad del negocio actualizada");
    } catch (err) {
      toast.error("Error al guardar configuración");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openNewProd = () => { setEditingProd(null); setProdModalOpen(true); };
  const openEditProd = (p) => { setEditingProd(p); setProdModalOpen(true); };
  const openNewCat = () => { setEditingCat(null); setCatModalOpen(true); };
  const openEditCat = (c) => { setEditingCat(c); setCatModalOpen(true); };

  const triggerDeleteProduct = (p) => setDeleteDialog({ isOpen: true, type: "producto", id: p.id, title: p.nombre, foto_url: p.foto_url });
  const triggerDeleteCategory = (c) => setDeleteDialog({ isOpen: true, type: "categoría", id: c.id, title: c.nombre });
  const triggerDeleteBanner = (b, index) => setDeleteDialog({ isOpen: true, type: "banner", id: b.id, title: `Banner #${index + 1}`, foto_url: b.foto_url });
  
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      // 1. ELIMINACIÓN DEL ARCHIVO FÍSICO EN STORAGE (Si existe foto)
      if (deleteDialog.foto_url) {
        // Extraemos el nombre del archivo de la URL pública (ej: "17192345.jpg")
        const fileName = deleteDialog.foto_url.split('/').pop();
        
        // Verificamos que sea una imagen alojada en nuestro Supabase antes de intentar borrar
        if (deleteDialog.foto_url.includes("supabase.co/storage")) {
          const { error: storageError } = await supabase.storage
            .from("imagenes-menu")
            .remove([fileName]);
            
          if (storageError) {
            console.error("Error al borrar del Storage:", storageError.message);
            // Nota: No lanzamos throw aquí por si el archivo ya no existía en el Storage, 
            // permitiendo que limpie el registro de la Base de Datos de todos modos.
          }
        }
      }

      // 2. ELIMINACIÓN DEL REGISTRO EN LA BASE DE DATOS
      if (deleteDialog.type === "producto") {
        await supabase.from("productos").delete().eq("id", deleteDialog.id);
        toast.success("Producto e imagen eliminados por completo");
      } else if (deleteDialog.type === "categoría") {
        const { error } = await supabase.from("categorias").delete().eq("id", deleteDialog.id);
        if (error) throw new Error("La categoría tiene productos asignados.");
        toast.success("Categoría eliminada");
      } else if (deleteDialog.type === "banner") {
        await supabase.from("publicidad").delete().eq("id", deleteDialog.id);
        toast.success("Banner e imagen eliminados por completo");
      }
      
      fetchData(); // Recargar el Dashboard con los datos limpios
    } catch (error) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ isOpen: false, type: "", id: null, title: "", foto_url: null });
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        style: { borderRadius: '100px', background: '#333', color: '#fff', fontSize: '14px', padding: '12px 24px' }
      }} />

      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm transition active:scale-95">
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </Link>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Panel de Control</h1>
          <button 
            onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
            className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Gestiona la identidad visual, anuncios publicitarios y productos.</p>

        {/* IDENTIDAD DEL NEGOCIO */}
        <section className="mt-8 bg-white border border-black/5 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold tracking-tight mb-4">Identidad del Negocio</h3>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Nombre Comercial</span>
                <input required type="text" value={configNombre} onChange={(e) => setConfigNombre(e.target.value)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15" />
              </label>
              <label className="block">
                <span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Eslogan o Frase</span>
                <input type="text" value={configEslogan} onChange={(e) => setConfigEslogan(e.target.value)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15" />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">WhatsApp para Pedidos (Ej: 5216871717189)</span>
                <input 
                  required
                  type="text" 
                  value={configWhatsapp}
                  onChange={(e) => setConfigWhatsapp(e.target.value)}
                  className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
                />
              </label>
            </div>
            <div>
              <span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Imagen de Fondo Principal</span>
              <input type="file" ref={configFileInputRef} onChange={handleConfigImageChange} accept="image/*" className="hidden" />
              <div className="flex gap-4 items-center">
                <div className="h-24 w-40 rounded-2xl overflow-hidden border bg-gray-100 relative shadow-inner shrink-0">
                  {configPreview ? <img src={configPreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon /></div>}
                </div>
                <button type="button" onClick={() => configFileInputRef.current.click()} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition active:scale-95">Cambiar Imagen</button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isSavingConfig} className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70">
                {isSavingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Identidad
              </button>
            </div>
          </form>
        </section>

        {/* BANNERS PUBLICIDAD */}
        <section className="mt-8 bg-white border border-black/5 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Publicidad / Banners</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">({banners.length}/5)</p>
            </div>
            <input type="file" ref={bannerFileInputRef} onChange={handleUploadBanner} accept="image/*" className="hidden" />
            <button
              type="button"
              disabled={isUploadingBanner || banners.length >= 5}
              onClick={() => bannerFileInputRef.current.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:scale-[1.03] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100"
            >
              {isUploadingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Subir Anuncio
            </button>
          </div>
          {banners.length === 0 ? (
            <div className="border border-dashed rounded-2xl p-6 text-center text-sm text-[var(--muted-foreground)]">Sin publicidad.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {banners.map((b, idx) => (
                <div key={b.id} className="relative aspect-[16/10] rounded-xl overflow-hidden group border shadow-sm bg-gray-50">
                  <img src={b.foto_url} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => triggerDeleteBanner(b, idx)} className="bg-red-600 text-white p-2.5 rounded-full hover:bg-red-700 transition transform hover:scale-110 shadow-md">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <button onClick={openNewProd} className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-6 py-4 text-base font-medium text-[var(--background)] shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.98] sm:w-auto">
          <Plus className="h-5 w-5" strokeWidth={2.4} /> Agregar nuevo producto
        </button>

        {/* PRODUCTOS */}
        <section className="mt-8">
          <h3 className="px-1 text-xl font-semibold tracking-tight">Productos</h3>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {productos.length === 0 ? <p className="px-5 py-6 text-sm text-[var(--muted-foreground)]">No hay productos aún.</p> : (
              productos.map((p, i) => {
                const catName = categorias.find(c => c.id === p.categoria_id)?.nombre || "Sin categoría";
                return (
                  <div key={p.id} className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      {p.foto_url ? <img src={p.foto_url} alt={p.nombre} className="h-10 w-10 rounded-full object-cover shrink-0" /> : <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100 grid place-items-center"><ImageIcon className="h-5 w-5 text-gray-400" /></div>}
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{p.nombre}</p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">{catName} · ${Number(p.precio).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEditProd(p)} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-[var(--foreground)] transition hover:bg-gray-200 active:scale-95"><Pencil className="h-4 w-4" strokeWidth={2.2} /></button>
                      <button onClick={() => triggerDeleteProduct(p)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[var(--destructive)] transition hover:bg-red-100 active:scale-95"><Trash2 className="h-4 w-4" strokeWidth={2.2} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* CATEGORÍAS ORDENABLES */}
        <section className="mt-10">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-semibold tracking-tight">Categorías</h3>
            <button onClick={openNewCat} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-medium text-[var(--background)] shadow-sm transition hover:scale-[1.03] active:scale-95"><Plus className="h-4 w-4" strokeWidth={2.4} />Agregar Categoría</button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {categorias.length === 0 ? <p className="px-5 py-6 text-sm text-[var(--muted-foreground)]">No hay categorías aún.</p> : (
              categorias.map((c, i) => (
                <div key={c.id} className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                  
                  {/* Flechas de ordenamiento */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => moveCategory(i, -1)} 
                        disabled={i === 0}
                        className="text-gray-400 hover:text-black disabled:opacity-30 transition"
                      >
                        <ChevronUp className="h-4 w-4" strokeWidth={3} />
                      </button>
                      <button 
                        onClick={() => moveCategory(i, 1)} 
                        disabled={i === categorias.length - 1}
                        className="text-gray-400 hover:text-black disabled:opacity-30 transition"
                      >
                        <ChevronDown className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </div>
                    <p className="truncate text-[15px] font-medium">{c.nombre}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditCat(c)} className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-[var(--foreground)] transition hover:bg-gray-200 active:scale-95"><Pencil className="h-4 w-4" strokeWidth={2.2} /></button>
                    <button onClick={() => triggerDeleteCategory(c)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[var(--destructive)] transition hover:bg-red-100 active:scale-95"><Trash2 className="h-4 w-4" strokeWidth={2.2} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {prodModalOpen && (
          <ProductModal key="product-modal" initial={editingProd} categorias={categorias} onClose={() => setProdModalOpen(false)} onSuccess={(msg) => { setProdModalOpen(false); fetchData(); toast.success(msg); }} compressImageNative={compressImageNative} />
        )}
        {catModalOpen && (
          <CategoryModal key="cat-modal" initial={editingCat} currentCount={categorias.length} onClose={() => setCatModalOpen(false)} onSuccess={(msg) => { setCatModalOpen(false); fetchData(); toast.success(msg); }} />
        )}
        {deleteDialog.isOpen && (
          <ConfirmDeleteModal key="delete-modal" dialog={deleteDialog} loading={isDeleting} onClose={() => setDeleteDialog({ isOpen: false, type: "", id: null, title: "" })} onConfirm={executeDelete} />
        )}
      </AnimatePresence>
    </main>
  );
}

function ConfirmDeleteModal({ dialog, loading, onClose, onConfirm }) {
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-5 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-7 w-7 text-red-600" /></div>
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">¿Eliminar {dialog.type}?</h3>
        <p className="mt-2 text-sm text-slate-500">Estás a punto de eliminar <strong>"{dialog.title}"</strong>. Esta acción no se puede deshacer.</p>
        <div className="mt-7 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 rounded-full bg-slate-100 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]">Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-sm font-medium text-white shadow-md transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-70">
            {loading ? "Eliminando" : "Sí, eliminar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProductModal({ initial, categorias, onClose, onSuccess, compressImageNative }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [precio, setPrecio] = useState(initial?.precio?.toString() || "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [ingredientes, setIngredientes] = useState(initial?.ingredientes || "");
  const [categoriaId, setCategoriaId] = useState(initial?.categoria_id || categorias[0]?.id || "");
  
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(initial?.foto_url || null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      try {
        const compressedFile = await compressImageNative(file);
        setImagen(compressedFile);
      } catch (error) { setImagen(file); }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !precio) return;
    setLoading(true);

    try {
      let fotoUrl = initial?.foto_url || "";
      if (imagen) {
        const fileExt = imagen.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        await supabase.storage.from("imagenes-menu").upload(fileName, imagen);
        const { data } = supabase.storage.from("imagenes-menu").getPublicUrl(fileName);
        fotoUrl = data.publicUrl;
      }

      const payload = { nombre: nombre.trim(), precio: parseFloat(precio), descripcion: descripcion.trim(), ingredientes: ingredientes.trim(), categoria_id: categoriaId, foto_url: fotoUrl, activo: true };

      if (initial) {
        await supabase.from("productos").update(payload).eq("id", initial.id);
        onSuccess("Producto actualizado");
      } else {
        await supabase.from("productos").insert([payload]);
        onSuccess("Producto agregado");
      }
    } catch (error) {
      toast.error("Error al guardar el producto");
    } finally { setLoading(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className="relative w-full max-w-lg overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:rounded-3xl">
        <div className="max-h-[88vh] overflow-y-auto px-6 pb-6 pt-7 sm:px-8 sm:pt-8 scrollbar-none">
          <h3 className="text-2xl font-semibold tracking-tight">{initial ? "Editar producto" : "Nuevo producto"}</h3>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current.click()} className="mt-6 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-100 text-[var(--muted-foreground)] transition hover:bg-gray-200 overflow-hidden relative">
            {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <><ImagePlus className="h-7 w-7" strokeWidth={1.8} /><span className="text-xs font-medium">Subir imagen</span></>}
          </button>
          <div className="mt-5 space-y-4">
            <Field label="Nombre del producto"><input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--foreground)]/15">
                  <span className="text-[var(--muted-foreground)]">$</span>
                  <input required type="number" step="0.01" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full bg-transparent text-[15px] outline-none" />
                </div>
              </Field>
              <Field label="Categoría">
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="w-full appearance-none rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15">
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Ingredientes"><input value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15" /></Field>
            <Field label="Descripción"><textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="w-full resize-none rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15" /></Field>
          </div>
          <div className="mt-7 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-full px-5 py-3 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-gray-100 active:scale-[0.98]">Cancelar</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70">Guardar</button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ==========================================
// MODAL CATEGORÍA: SE AÑADIÓ EL ORDEN
// ==========================================
function CategoryModal({ initial, currentCount, onClose, onSuccess }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);

    try {
      if (initial) {
        await supabase.from("categorias").update({ nombre: nombre.trim() }).eq("id", initial.id);
        onSuccess("Categoría actualizada");
      } else {
        // Al crear una nueva, se le asigna el orden igual a la cantidad actual de categorías
        await supabase.from("categorias").insert([{ nombre: nombre.trim(), orden: currentCount }]);
        onSuccess("Categoría agregada");
      }
    } catch (error) {
      toast.error("Error al guardar la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className="relative w-full max-w-md overflow-hidden rounded-t-[32px] bg-white px-6 pb-6 pt-7 shadow-2xl sm:rounded-3xl sm:px-8 sm:pt-8">
        <h3 className="text-2xl font-semibold tracking-tight">{initial ? "Editar categoría" : "Nueva categoría"}</h3>
        <div className="mt-5">
          <Field label="Nombre"><input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15" autoFocus /></Field>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-full px-5 py-3 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-gray-100 active:scale-[0.98]">Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70">Guardar</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</span>{children}</label>;
}