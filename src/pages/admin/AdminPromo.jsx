import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image, Film, X, Upload, AlertCircle } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

const SLOT_LABELS = {
  banner: { label: "Banner Carousel", icon: "🖼️", color: "text-blue-600", bg: "bg-blue-50" },
  deal: { label: "Deal Strip", icon: "🎬", color: "text-teal-600", bg: "bg-teal-50" },
};

export default function AdminPromo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", url: "", type: "video", slot: "deal" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filterSlot, setFilterSlot] = useState("all");

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
      if (file) {
        const uploaded = await api.uploadFile(file);
        url = uploaded.url;
      }
      await api.createPromo({ ...form, url });
      setShowForm(false);
      setForm({ title: "", subtitle: "", url: "", type: "video", slot: "deal" });
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

  const filtered = filterSlot === "all" ? items : items.filter(i => (i.slot || "banner") === filterSlot);
  const bannerCount = items.filter(i => (i.slot || "banner") === "banner").length;
  const dealCount = items.filter(i => (i.slot || "banner") === "deal").length;

  return (
    <div className="min-h-[100dvh] bg-[#f4f4f4] pb-24">
      {/* Header */}
      <div className="bg-brand-dark px-5 pt-12 pb-5">
        <h1 className="text-[22px] font-extrabold text-white">Promo Media</h1>
        <p className="text-[13px] text-white/50 mt-0.5">Manage homepage banners &amp; deal strip videos</p>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">Banners</p>
            <p className="text-[22px] font-extrabold text-white">{bannerCount}</p>
          </div>
          <div className="flex-1 rounded-2xl bg-brand-orange/20 border border-brand-orange/30 px-4 py-3">
            <p className="text-[11px] text-brand-orange/80 font-semibold uppercase tracking-wider">Deal Videos</p>
            <p className="text-[22px] font-extrabold text-brand-orange">{dealCount}</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 mt-4 flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "banner", label: "🖼️ Banner" },
          { key: "deal", label: "🎬 Deal Strip" },
        ].map(t => (
          <button key={t.key} onClick={() => setFilterSlot(t.key)}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
              filterSlot === t.key ? "bg-brand-dark text-white" : "bg-white text-brand-medium shadow-soft"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          [1, 2].map(n => <div key={n} className="h-40 rounded-2xl bg-white shadow-soft shimmer" />)
        ) : filtered.length === 0 ? (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle size={48} className="mx-auto text-brand-light" />
            <p className="mt-4 text-[15px] font-semibold text-brand-medium">
              {filterSlot === "deal" ? "No deal videos yet" : filterSlot === "banner" ? "No banners yet" : "No promo media yet"}
            </p>
            <p className="text-[13px] text-brand-light mt-1">
              {filterSlot === "deal"
                ? "Add videos to show in the deal strip on the customer homepage"
                : "Add banners & videos for the customer homepage carousel"}
            </p>
          </motion.div>
        ) : filtered.map((item, i) => {
          const slotMeta = SLOT_LABELS[item.slot || "banner"];
          return (
            <motion.div key={item.id} className="rounded-2xl bg-white shadow-card overflow-hidden"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="relative h-40 bg-brand-dark">
                {item.type === "video" ? (
                  <video src={item.url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                ) : (
                  <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
              <div className={`px-4 py-2 flex items-center gap-1.5 ${slotMeta.bg}`}>
                <span>{slotMeta.icon}</span>
                <span className={`text-[12px] font-bold ${slotMeta.color}`}>{slotMeta.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add form bottom sheet */}
      {showForm && (
        <motion.div className="fixed inset-0 z-50 bg-black/50 flex items-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowForm(false)}>
          <motion.div className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl p-6 pb-10"
            initial={{ y: 300 }} animate={{ y: 0 }} transition={{ type: "spring", damping: 28 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold text-brand-dark">Add Promo</h2>
              <button onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center">
                <X size={18} className="text-brand-medium" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Slot selector */}
              <div>
                <p className="text-[11px] font-bold text-brand-medium mb-1.5 uppercase tracking-wider">Display Location</p>
                <div className="flex gap-2">
                  {[
                    { key: "deal", label: "🎬 Deal Strip" },
                    { key: "banner", label: "🖼️ Banner Carousel" },
                  ].map(s => (
                    <button key={s.key} onClick={() => setForm(f => ({ ...f, slot: s.key }))}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                        form.slot === s.key ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-medium"
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media type */}
              <div>
                <p className="text-[11px] font-bold text-brand-medium mb-1.5 uppercase tracking-wider">Media Type</p>
                <div className="flex gap-2">
                  {[{ key: "video", label: "🎬 Video" }, { key: "image", label: "📷 Image" }].map(t => (
                    <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                        form.type === t.key ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-medium"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <input type="text" placeholder="Title (e.g. 50% OFF)" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input-field" />

              <input type="text" placeholder="Subtitle (e.g. On grooming services)" value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="input-field" />

              <div className="flex gap-2 items-center">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 rounded-xl bg-brand-bg px-4 py-3 text-[13px] text-brand-medium">
                    <Upload size={16} />
                    <span className="truncate">{file ? file.name : "Upload file..."}</span>
                  </div>
                  <input type="file" accept="image/*,video/*" className="hidden"
                    onChange={e => { setFile(e.target.files[0]); setForm(f => ({ ...f, url: "" })); }} />
                </label>
                <span className="text-[12px] text-brand-light shrink-0">or</span>
                <input type="text" placeholder="Paste URL" value={form.url}
                  onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setFile(null); }}
                  className="input-field flex-1" />
              </div>

              <button onClick={handleAdd} disabled={saving || (!form.url && !file)}
                className="btn-primary flex items-center justify-center gap-2">
                {saving ? <><span className="spinner" /> Saving...</> : "Add to Promo"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <button onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-brand-dark text-white shadow-elevated flex items-center justify-center active:scale-95 transition-transform z-40">
        <Plus size={24} />
      </button>

      <AdminNav />
    </div>
  );
}
