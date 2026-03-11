import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image, Film, X, Upload, AlertCircle } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

export default function AdminPromo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", url: "", type: "image" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchPromo = async () => {
    setLoading(true);
    try { setItems(await api.getPromo()); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPromo(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      let url = form.url;
      // If a file was selected, upload it first
      if (file) {
        const uploaded = await api.uploadFile(file);
        url = uploaded.url;
      }
      await api.createPromo({ ...form, url });
      setShowForm(false);
      setForm({ title: "", subtitle: "", url: "", type: "image" });
      setFile(null);
      await fetchPromo();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await api.deletePromo(id); await fetchPromo(); } catch {}
    setDeleting(null);
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-24">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-[22px] font-bold text-brand-dark">Promo Media</h1>
        <p className="text-[13px] text-brand-light mt-0.5">Manage homepage videos &amp; banners</p>
      </div>

      {/* List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          [1, 2].map(n => (
            <div key={n} className="h-36 rounded-2xl bg-white shadow-soft shimmer" />
          ))
        ) : items.length === 0 ? (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle size={48} className="mx-auto text-brand-light" />
            <p className="mt-4 text-[15px] font-semibold text-brand-medium">No promo media yet</p>
            <p className="text-[13px] text-brand-light mt-1">Add banners &amp; videos to show on the customer homepage</p>
          </motion.div>
        ) : items.map((item, i) => (
          <motion.div key={item.id} className="rounded-2xl bg-white shadow-soft overflow-hidden"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            {/* Preview */}
            <div className="relative h-36 bg-brand-dark">
              {item.type === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="text-white font-bold text-[14px]">{item.title || "Untitled"}</p>
                {item.subtitle && <p className="text-white/70 text-[12px]">{item.subtitle}</p>}
              </div>
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 text-white text-[11px] font-bold">
                {item.type === "video" ? <Film size={12} /> : <Image size={12} />}
                {item.type}
              </span>
              <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-500/80 flex items-center justify-center text-white disabled:opacity-50">
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add form modal */}
      {showForm && (
        <motion.div className="fixed inset-0 z-50 bg-black/40 flex items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowForm(false)}>
          <motion.div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl p-6"
            initial={{ y: 200 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-brand-dark">Add Promo</h2>
              <button onClick={() => setShowForm(false)} className="text-brand-light"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {/* Type */}
              <div className="flex gap-2">
                {["image", "video"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                      form.type === t ? "bg-brand-orange text-white" : "bg-brand-bg text-brand-medium"
                    }`}>
                    {t === "image" ? "📷 Image" : "🎬 Video"}
                  </button>
                ))}
              </div>

              <input type="text" placeholder="Title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input-field" />

              <input type="text" placeholder="Subtitle (optional)" value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="input-field" />

              {/* File upload or URL */}
              <div className="flex gap-2 items-center">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 rounded-xl bg-brand-bg px-4 py-3 text-[13px] text-brand-medium">
                    <Upload size={16} />
                    {file ? file.name : "Upload file..."}
                  </div>
                  <input type="file" accept="image/*,video/*" className="hidden"
                    onChange={e => { setFile(e.target.files[0]); setForm(f => ({ ...f, url: "" })); }} />
                </label>
                <span className="text-[12px] text-brand-light">or</span>
                <input type="text" placeholder="URL" value={form.url}
                  onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setFile(null); }}
                  className="input-field flex-1" />
              </div>

              <button onClick={handleAdd} disabled={saving || (!form.url && !file)}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <><span className="spinner" /> Saving...</> : "Add Promo"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add FAB */}
      <button onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-brand-orange text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40">
        <Plus size={24} />
      </button>

      <AdminNav />
    </div>
  );
}
