import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone as PhoneIcon, Plus, Edit2, Trash2, X, Save, MapPin } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

export default function AdminEmergencyVets() {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", phone2: "", type: "vet", city: "", state: "", address: "", hours: "" });
  const [saving, setSaving] = useState(false);

  const fetchVets = useCallback(async () => {
    setLoading(true);
    try { const v = await api.getEmergencyVets(); setVets(v); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVets(); }, [fetchVets]);

  const openAdd = () => { setEditing(null); setForm({ name: "", phone: "", phone2: "", type: "vet", city: "", state: "", address: "", hours: "" }); setShowForm(true); };
  const openEdit = (v) => { setEditing(v.id); setForm({ name: v.name, phone: v.phone, phone2: v.phone2 || "", type: v.type, city: v.city, state: v.state, address: v.address || "", hours: v.hours || "" }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.city || !form.state) return;
    setSaving(true);
    try {
      if (editing) await api.adminUpdateEmergencyVet(editing, form);
      else await api.adminCreateEmergencyVet(form);
      setShowForm(false);
      fetchVets();
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try { await api.adminDeleteEmergencyVet(id); setVets(prev => prev.filter(v => v.id !== id)); } catch { /* */ }
  };

  const typeLabel = { vet: "🏥 Vet", ambulance: "🚑 Ambulance", shelter: "🏠 Shelter" };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold text-brand-dark">Emergency Vets</h1>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-[13px] font-bold text-white">
            <Plus size={14} /> Add
          </button>
        </div>
        <p className="text-[12px] text-brand-light mt-1">{vets.length} entries</p>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : vets.length === 0 ? (
          <p className="text-center text-brand-light text-[14px] mt-12">No entries</p>
        ) : (
          <div className="space-y-3">
            {vets.map((v, i) => (
              <motion.div key={v.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-brand-dark truncate">{v.name}</h3>
                      <span className="text-[10px] bg-brand-bg rounded-full px-2 py-0.5 font-medium text-brand-medium">{typeLabel[v.type] || v.type}</span>
                    </div>
                    <p className="text-[12px] text-brand-light mt-0.5 flex items-center gap-1"><MapPin size={10} />{v.city}, {v.state}</p>
                    <p className="text-[12px] text-brand-medium mt-0.5 flex items-center gap-1"><PhoneIcon size={10} />{v.phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(v)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center"><Edit2 size={14} className="text-brand-medium" /></button>
                    <button onClick={() => handleDelete(v.id)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-brand-red" /></button>
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
                <h2 className="text-[18px] font-bold text-brand-dark">{editing ? "Edit Entry" : "Add Entry"}</h2>
                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Type *</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className="input-field">
                    <option value="vet">Vet Clinic</option>
                    <option value="ambulance">Ambulance</option>
                    <option value="shelter">Shelter</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Phone *</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="input-field" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Alt Phone</label>
                    <input type="tel" value={form.phone2} onChange={e => setForm(p => ({...p, phone2: e.target.value}))} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">City *</label>
                    <input type="text" value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="input-field" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">State *</label>
                    <input type="text" value={form.state} onChange={e => setForm(p => ({...p, state: e.target.value}))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Hours</label>
                  <input type="text" value={form.hours} onChange={e => setForm(p => ({...p, hours: e.target.value}))} className="input-field" placeholder="24/7 or 9AM-9PM" />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || !form.name || !form.phone || !form.city || !form.state} className="btn-primary mt-5 w-full flex items-center justify-center gap-2">
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
