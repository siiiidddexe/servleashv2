import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Plus, Edit2, Trash2, X, Save } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

export default function AdminCelebrations() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", includes: "" });
  const [saving, setSaving] = useState(false);

  const fetchPkgs = useCallback(async () => {
    setLoading(true);
    try { const p = await api.getCelebrations(); setPackages(p); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPkgs(); }, [fetchPkgs]);

  const openAdd = () => { setEditing(null); setForm({ name: "", price: "", description: "", includes: "" }); setShowForm(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ name: p.name, price: p.price, description: p.description || "", includes: (p.includes || []).join(", ") }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const payload = { name: form.name, price: Number(form.price), description: form.description, includes: form.includes.split(",").map(s => s.trim()).filter(Boolean) };
      if (editing) await api.adminUpdateCelebration(editing, payload);
      else await api.adminCreateCelebration(payload);
      setShowForm(false);
      fetchPkgs();
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this package?")) return;
    try { await api.adminDeleteCelebration(id); setPackages(prev => prev.filter(p => p.id !== id)); } catch { /* */ }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold text-brand-dark">Celebrations</h1>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2 text-[13px] font-bold text-white">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : packages.length === 0 ? (
          <p className="text-center text-brand-light text-[14px] mt-12">No packages yet</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg, i) => (
              <motion.div key={pkg.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-brand-dark">{pkg.name}</h3>
                    <p className="text-[12px] text-brand-light mt-0.5">{pkg.description}</p>
                    {pkg.includes && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pkg.includes.map((item, j) => (
                          <span key={j} className="text-[10px] bg-brand-bg rounded-full px-2 py-0.5 text-brand-medium">{item}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-[16px] font-bold text-brand-orange mt-2">₹{pkg.price}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(pkg)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center"><Edit2 size={14} className="text-brand-medium" /></button>
                    <button onClick={() => handleDelete(pkg.id)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-brand-red" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">{editing ? "Edit Package" : "Add Package"}</h2>
                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Price *</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="input-field min-h-[80px]" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Includes (comma-separated)</label>
                  <input type="text" value={form.includes} onChange={e => setForm(p => ({...p, includes: e.target.value}))} className="input-field" placeholder="Cake, Decorations, Photos" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price} className="btn-primary mt-5 w-full flex items-center justify-center gap-2">
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
