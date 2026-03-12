import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Upload } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import ImageCropper from "../../components/ImageCropper";

const CATEGORIES = ["Grooming", "Vet Visit", "Boarding", "Training", "Meals", "Spa", "Walking", "Other"];

function ServiceForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { name: "", category: "Grooming", price: "", duration: "", description: "", image: null });
  const [showCropper, setShowCropper] = useState(false);
  const [preview, setPreview] = useState(initial?.image || null);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCropped = async (blob, previewUrl) => {
    setShowCropper(false);
    setPreview(previewUrl);
    setUploading(true);
    try {
      const file = new File([blob], "icon.png", { type: "image/png" });
      const res = await api.uploadFile(file);
      set("image", res.url);
    } catch (e) {
      console.warn("Upload failed:", e);
    }
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, price: Number(form.price) || 0 });
  };

  return (
    <>
      {showCropper && <ImageCropper onCropped={handleCropped} onCancel={() => setShowCropper(false)} />}
      <form onSubmit={submit} className="space-y-3">
        {/* icon upload */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowCropper(true)} className="h-16 w-16 shrink-0 rounded-xl border-2 border-dashed border-brand-border flex items-center justify-center overflow-hidden bg-brand-bg">
            {preview ? (
              <img src={preview.startsWith("blob:") ? preview : `/api${preview}`} alt="" className="h-full w-full object-cover" />
            ) : uploading ? (
              <span className="spinner" />
            ) : (
              <Upload size={20} className="text-brand-light" />
            )}
          </button>
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-brand-dark">Service Icon</p>
            <p className="text-[11px] text-brand-light">Tap to upload &amp; crop</p>
          </div>
        </div>

        <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Service name" className="input-field" required />

        <select value={form.category} onChange={e => set("category", e.target.value)} className="input-field">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <div className="flex gap-2">
          <input value={form.price} onChange={e => set("price", e.target.value)} placeholder="Price (₹)" type="number" className="input-field flex-1" />
          <input value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="Duration" className="input-field flex-1" />
        </div>

        <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Description" rows={3} className="input-field resize-none" />

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
            {saving ? "Saving…" : initial ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | service obj
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    api.getServices().then(s => { setServices(s); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing && editing !== "new" && editing.id) {
        await api.updateService(editing.id, data);
      } else {
        await api.createService(data);
      }
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service?")) return;
    setDeleting(id);
    try {
      await api.deleteService(id);
      load();
    } catch (e) {
      alert(e.message);
    }
    setDeleting(null);
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-brand-light font-medium">Admin Panel</p>
          <h1 className="text-[22px] font-bold text-brand-dark">Services</h1>
        </div>
        <button onClick={() => setEditing("new")} className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center shadow-md">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Form overlay */}
      <AnimatePresence>
        {editing && (
          <motion.div className="px-5 mt-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-brand-dark">{editing === "new" ? "New Service" : "Edit Service"}</h3>
                <button onClick={() => setEditing(null)} className="h-7 w-7 rounded-full bg-brand-bg flex items-center justify-center"><X size={14} /></button>
              </div>
              <ServiceForm
                initial={editing === "new" ? null : editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><span className="spinner" /></div>
        ) : services.length === 0 ? (
          <p className="text-center text-[13px] text-brand-light py-16">No services yet. Tap + to add one.</p>
        ) : (
          services.map((svc, i) => (
            <motion.div
              key={svc.id}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {/* icon */}
              <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-brand-bg flex items-center justify-center">
                {svc.image ? (
                  <img src={svc.image.startsWith("http") ? svc.image : `/api${svc.image}`} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-brand-light" />
                )}
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-brand-dark truncate">{svc.name}</p>
                <p className="text-[12px] text-brand-light">{svc.category} · ₹{svc.price} · {svc.duration || "—"}</p>
              </div>

              {/* actions */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => setEditing(svc)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center">
                  <Pencil size={14} className="text-brand-medium" />
                </button>
                <button onClick={() => handleDelete(svc.id)} disabled={deleting === svc.id} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  {deleting === svc.id ? <span className="spinner !h-4 !w-4" /> : <Trash2 size={14} className="text-brand-red" />}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AdminNav />
    </div>
  );
}
