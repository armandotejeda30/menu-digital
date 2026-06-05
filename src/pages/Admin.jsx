import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ImagePlus, Pencil, Plus, Trash2, Loader2, Image as ImageIcon, AlertTriangle, LogOut } from "lucide-react";

export default function AdminPage() {

  const navigate = useNavigate();
  useEffect(() => {
       const checkUser = async () => {
         const { data: { session } } = await supabase.auth.getSession();
         if (!session) {
           navigate("/login");
         }
       };
       checkUser();
     }, [navigate]);
     
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Estados de los modales de edición
  const [editingProd, setEditingProd] = useState(null);
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // Estado para el modal de confirmación de eliminación
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: "", id: null, title: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    const { data: cats } = await supabase.from("categorias").select("*").order("nombre");
    const { data: prods } = await supabase.from("productos").select("*").order("created_at", { ascending: false });
    if (cats) setCategorias(cats);
    if (prods) setProductos(prods);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Bloquear el scroll cuando un modal está abierto
  useEffect(() => {
    const lock = prodModalOpen || catModalOpen || deleteDialog.isOpen;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [prodModalOpen, catModalOpen, deleteDialog.isOpen]);

  const openNewProd = () => { setEditingProd(null); setProdModalOpen(true); };
  const openEditProd = (p) => { setEditingProd(p); setProdModalOpen(true); };
  const openNewCat = () => { setEditingCat(null); setCatModalOpen(true); };
  const openEditCat = (c) => { setEditingCat(c); setCatModalOpen(true); };

  // ==========================================
  // LÓGICA DE ELIMINACIÓN
  // ==========================================
  const triggerDeleteProduct = (p) => {
    setDeleteDialog({ isOpen: true, type: "producto", id: p.id, title: p.nombre });
  };

  const triggerDeleteCategory = (c) => {
    setDeleteDialog({ isOpen: true, type: "categoría", id: c.id, title: c.nombre });
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteDialog.type === "producto") {
        await supabase.from("productos").delete().eq("id", deleteDialog.id);
        toast.success("Producto eliminado");
      } else if (deleteDialog.type === "categoría") {
        const { error } = await supabase.from("categorias").delete().eq("id", deleteDialog.id);
        if (error) {
          // Si da error, usualmente es porque hay productos usando esta categoría (llave foránea)
          throw new Error("No puedes eliminar una categoría que tenga productos asignados.");
        }
        toast.success("Categoría eliminada");
      }
      fetchData();
    } catch (error) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ isOpen: false, type: "", id: null, title: "" });
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      {/* Componente para mostrar los Toasts */}
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        style: { borderRadius: '100px', background: '#333', color: '#fff', fontSize: '14px', padding: '12px 24px' }
      }} />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </Link>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">Panel de Control</h1>
          <div className="w-10" />

          {/* Nuevo botón de Cerrar Sesión */}
            <button 
            onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
            title="Cerrar Sesión"
            >
            <LogOut className="h-4 w-4" strokeWidth={2.4} />
            </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Gestiona productos y categorías de tu menú.</p>

        <button
          onClick={openNewProd}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-6 py-4 text-base font-medium text-[var(--background)] shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.98] sm:w-auto"
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
          Agregar nuevo producto
        </button>

        {/* Productos */}
        <section className="mt-10">
          <h3 className="px-1 text-xl font-semibold tracking-tight">Productos</h3>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {productos.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--muted-foreground)]">No hay productos aún.</p>
            ) : (
              productos.map((p, i) => {
                const catName = categorias.find(c => c.id === p.categoria_id)?.nombre || "Sin categoría";
                return (
                  <div key={p.id} className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      {p.foto_url ? (
                        <img src={p.foto_url} alt={p.nombre} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 grid place-items-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="truncate text-[15px] font-medium">{p.nombre}</p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">{catName} · ${Number(p.precio).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditProd(p)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-[var(--foreground)] transition hover:bg-gray-200 active:scale-95"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                      <button
                        onClick={() => triggerDeleteProduct(p)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[var(--destructive)] transition hover:bg-red-100 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Categorias */}
        <section className="mt-10">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-semibold tracking-tight">Categorías</h3>
            <button
              onClick={openNewCat}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-medium text-[var(--background)] shadow-sm transition hover:scale-[1.03] active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Agregar Categoría
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {categorias.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--muted-foreground)]">No hay categorías aún.</p>
            ) : (
              categorias.map((c, i) => (
                <div key={c.id} className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                  <p className="truncate text-[15px] font-medium">{c.nombre}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditCat(c)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-[var(--foreground)] transition hover:bg-gray-200 active:scale-95"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    <button
                      onClick={() => triggerDeleteCategory(c)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-[var(--destructive)] transition hover:bg-red-100 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {prodModalOpen && (
          <ProductModal
            key="product-modal"
            initial={editingProd}
            categorias={categorias}
            onClose={() => setProdModalOpen(false)}
            onSuccess={(msg) => { 
              setProdModalOpen(false); 
              fetchData(); 
              toast.success(msg);
            }}
          />
        )}
        {catModalOpen && (
          <CategoryModal
            key="cat-modal"
            initial={editingCat}
            onClose={() => setCatModalOpen(false)}
            onSuccess={(msg) => { 
              setCatModalOpen(false); 
              fetchData(); 
              toast.success(msg);
            }}
          />
        )}
        {deleteDialog.isOpen && (
          <ConfirmDeleteModal
            key="delete-modal"
            dialog={deleteDialog}
            loading={isDeleting}
            onClose={() => setDeleteDialog({ isOpen: false, type: "", id: null, title: "" })}
            onConfirm={executeDelete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ==========================================
// MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// ==========================================
function ConfirmDeleteModal({ dialog, loading, onClose, onConfirm }) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">
          ¿Eliminar {dialog.type}?
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Estás a punto de eliminar <strong>"{dialog.title}"</strong>. Esta acción no se puede deshacer.
        </p>

        <div className="mt-7 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full bg-slate-100 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-sm font-medium text-white shadow-md transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Eliminando" : "Sí, eliminar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// MODAL DE PRODUCTO
// ==========================================
function ProductModal({ initial, categorias, onClose, onSuccess }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [precio, setPrecio] = useState(initial?.precio?.toString() || "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [ingredientes, setIngredientes] = useState(initial?.ingredientes || "");
  const [categoriaId, setCategoriaId] = useState(initial?.categoria_id || categorias[0]?.id || "");
  
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(initial?.foto_url || null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
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
        const { error: uploadError } = await supabase.storage.from("imagenes-menu").upload(fileName, imagen);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("imagenes-menu").getPublicUrl(fileName);
        fotoUrl = data.publicUrl;
      }

      const payload = {
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim(),
        ingredientes: ingredientes.trim(),
        categoria_id: categoriaId,
        foto_url: fotoUrl,
        activo: true
      };

      if (initial) {
        await supabase.from("productos").update(payload).eq("id", initial.id);
        onSuccess("Producto actualizado");
      } else {
        await supabase.from("productos").insert([payload]);
        onSuccess("Producto agregado");
      }
    } catch (error) {
      toast.error("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative w-full max-w-lg overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="max-h-[88vh] overflow-y-auto px-6 pb-6 pt-7 sm:px-8 sm:pt-8 scrollbar-none">
          <h3 className="text-2xl font-semibold tracking-tight">
            {initial ? "Editar producto" : "Nuevo producto"}
          </h3>
          
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="mt-6 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-100 text-[var(--muted-foreground)] transition hover:bg-gray-200 overflow-hidden relative"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImagePlus className="h-7 w-7" strokeWidth={1.8} />
                <span className="text-xs font-medium">Subir imagen</span>
              </>
            )}
          </button>

          <div className="mt-5 space-y-4">
            <Field label="Nombre del producto">
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--foreground)]/15">
                  <span className="text-[var(--muted-foreground)]">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-transparent text-[15px] outline-none"
                  />
                </div>
              </Field>

              <Field label="Categoría">
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full appearance-none rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
                >
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Ingredientes">
              <input
                value={ingredientes}
                onChange={(e) => setIngredientes(e.target.value)}
                className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none ring-0 transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
              />
            </Field>
          </div>

          <div className="mt-7 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full px-5 py-3 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-gray-100 active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

// ==========================================
// MODAL DE CATEGORÍA
// ==========================================
function CategoryModal({ initial, onClose, onSuccess }) {
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
        await supabase.from("categorias").insert([{ nombre: nombre.trim() }]);
        onSuccess("Categoría agregada");
      }
    } catch (error) {
      toast.error("Error al guardar la categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative w-full max-w-md overflow-hidden rounded-t-[32px] bg-white px-6 pb-6 pt-7 shadow-2xl sm:rounded-3xl sm:px-8 sm:pt-8"
      >
        <h3 className="text-2xl font-semibold tracking-tight">
          {initial ? "Editar categoría" : "Nueva categoría"}
        </h3>
        <div className="mt-5">
          <Field label="Nombre">
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--foreground)]/15"
              autoFocus
            />
          </Field>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full px-5 py-3 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-gray-100 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}