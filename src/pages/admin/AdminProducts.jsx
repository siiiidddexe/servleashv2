import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Edit2, Trash2, X, Save, Upload, Image as ImageIcon } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import ImageCropper from "../../components/ImageCropper";
import { api } from "../../lib/api";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "", description: "", stock: "", image: null });
  const [saving, setSaving] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try { const p = await api.getProducts(); setProducts(p); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", price: "", category: "", description: "", stock: "", image: null });
    setPreview(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, price: p.price, category: p.category || "", description: p.description || "", stock: p.stock || "", image: p.image || null });
    setPreview(p.image || null);
    setShowForm(true);
  };

  const handleCropped = async (blob, previewUrl) => {
    setShowCropper(false);
    setPreview(previewUrl);
    setUploading(true);
    try {
      const file = new File([blob], "product.png", { type: "image/png" });
      const res = await api.uploadFile(file);
      setForm(f => ({ ...f, image: res.url }));
    } catch (e) {
      console.warn("Upload failed:", e);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) || 0 };
      if (editing) await api.adminUpdateProduct(editing, payload);
      else await api.adminCreateProduct(payload);
      setShowForm(false);
      fetchProducts();
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await api.adminDeleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); } catch { /* */ }
  };

  const getImageSrc = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `/api${img}`;
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-brand-light font-medium">Admin Panel</p>
            <h1 className="text-[22px] font-bold text-brand-dark">Products</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-brand-light bg-brand-bg px-3 py-1.5 rounded-full">{products.length} items</span>
            <button onClick={openAdd} className="flex items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2 text-[13px] font-bold text-white">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="mt-16 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-brand-bg flex items-center justify-center">
              <Package size={36} className="text-brand-light" />
            </div>
            <p className="text-[14px] text-brand-light mt-4">No products yet. Tap + to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p, i) => (
              <motion.div key={p.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-brand-bg overflow-hidden flex items-center justify-center">
                    {getImageSrc(p.image) ? (
                      <img src={getImageSrc(p.image)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={22} className="text-brand-light" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-brand-dark truncate">{p.name}</h3>
                    <p className="text-[12px] text-brand-light">{p.category} · Stock: {p.stock}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[15px] font-bold text-brand-orange">₹{p.price}</p>
                      {p.mrp > p.price && (
                        <span className="text-[11px] text-brand-light line-through">₹{p.mrp}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center"><Edit2 size={14} className="text-brand-medium" /></button>
                    <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-brand-red" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Image Cropper */}
      {showCropper && <ImageCropper onCropped={handleCropped} onCancel={() => setShowCropper(false)} />}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">{editing ? "Edit Product" : "Add Product"}</h2>
                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowCropper(true)}
                    className="h-16 w-16 shrink-0 rounded-xl border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden bg-brand-bg">
                    {preview ? (
                      <img src={preview.startsWith("blob:") ? preview : getImageSrc(preview) || preview} alt="" className="h-full w-full object-cover" />
                    ) : uploading ? (
                      <span className="spinner" />
                    ) : (
                      <Upload size={20} className="text-brand-light" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-brand-dark">Product Image</p>
                    <p className="text-[11px] text-brand-light">Tap to upload &amp; crop</p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Price *</label>
                    <input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} className="input-field" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm(p => ({...p, stock: e.target.value}))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="input-field">
                    <option value="">Select category</option>
                    {["Food", "Toys", "Treats", "Hygiene", "Accessories"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="input-field min-h-[80px]" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || uploading || !form.name || !form.price} className="btn-primary mt-5 w-full flex items-center justify-center gap-2">
                {saving ? <><span className="spinner" /> Saving...</> : <><Save size={16} /> {editing ? "Update" : "Create"}</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminNav />
    </div>
  );
}
