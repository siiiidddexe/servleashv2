import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, MapPin, Phone, Upload, Image as ImageIcon, Check } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import ImageCropper from "../../components/ImageCropper";

function VendorForm({ initial, onSave, onCancel, saving, allServices }) {
  const [form, setForm] = useState(
    initial || { name: "", category: "Grooming", address: "", city: "", phone: "", image: null, services: [], open_time: "09:00", close_time: "18:00", slot_interval: 30 }
  );
  const [showCropper, setShowCropper] = useState(false);
  const [preview, setPreview] = useState(initial?.image || null);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleService = (id) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter(s => s !== id) : [...f.services, id],
    }));
  };

  const handleCropped = async (blob, previewUrl) => {
    setShowCropper(false);
    setPreview(previewUrl);
    setUploading(true);
    try {
      const file = new File([blob], "vendor.png", { type: "image/png" });
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
    onSave(form);
  };

  return (
    <>
      {showCropper && <ImageCropper onCropped={handleCropped} onCancel={() => setShowCropper(false)} />}
      <form onSubmit={submit} className="space-y-3">
        {/* image upload */}
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
            <p className="text-[12px] font-semibold text-brand-dark">Vendor Photo</p>
            <p className="text-[11px] text-brand-light">Tap to upload &amp; crop</p>
          </div>
        </div>

        <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Vendor name" className="input-field" required />

        <select value={form.category} onChange={e => set("category", e.target.value)} className="input-field">
          {["Grooming", "Vet Visit", "Boarding", "Training", "Meals", "Spa", "Walking", "Other"].map(c => <option key={c}>{c}</option>)}
        </select>

        <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Address" className="input-field" />

        <div className="flex gap-2">
          <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" className="input-field flex-1" />
          <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone" className="input-field flex-1" />
        </div>

        {/* Shop hours & slot config */}
        <div>
          <p className="text-[12px] font-semibold text-brand-dark mb-2">Shop Hours &amp; Slot Interval</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <p className="text-[11px] text-brand-light mb-1">Opens</p>
              <input type="time" value={form.open_time || "09:00"} onChange={e => set("open_time", e.target.value)} className="input-field w-full" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-brand-light mb-1">Closes</p>
              <input type="time" value={form.close_time || "18:00"} onChange={e => set("close_time", e.target.value)} className="input-field w-full" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-brand-light mb-1">Slot (min)</p>
              <select value={form.slot_interval || 30} onChange={e => set("slot_interval", Number(e.target.value))} className="input-field w-full">
                {[10, 15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} min</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* assign services */}
        <div>
          <p className="text-[12px] font-semibold text-brand-dark mb-2">Assign Services</p>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {allServices.length === 0 ? (
              <p className="text-[12px] text-brand-light">No services created yet.</p>
            ) : (
              allServices.map(s => {
                const on = form.services.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                      on ? "bg-brand-dark text-white border-brand-dark" : "bg-white text-brand-medium border-brand-border"
                    }`}
                  >
                    {on && <Check size={12} />}
                    {s.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
            {saving ? "Saving…" : initial ? "Update" : "Add Vendor"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | vendor obj
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getVendors(), api.getServices()])
      .then(([v, s]) => { setVendors(v); setServices(s); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing && editing !== "new" && editing.id) {
        await api.updateVendor(editing.id, data);
      } else {
        await api.createVendor(data);
      }
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this vendor?")) return;
    setDeleting(id);
    try {
      await api.deleteVendor(id);
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
          <h1 className="text-[22px] font-bold text-brand-dark">Vendors</h1>
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
                <h3 className="text-[15px] font-bold text-brand-dark">{editing === "new" ? "New Vendor" : "Edit Vendor"}</h3>
                <button onClick={() => setEditing(null)} className="h-7 w-7 rounded-full bg-brand-bg flex items-center justify-center"><X size={14} /></button>
              </div>
              <VendorForm
                initial={editing === "new" ? null : editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
                saving={saving}
                allServices={services}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><span className="spinner" /></div>
        ) : vendors.length === 0 ? (
          <p className="text-center text-[13px] text-brand-light py-16">No vendors yet. Tap + to add one.</p>
        ) : (
          vendors.map((v, i) => (
            <motion.div
              key={v.id}
              className="bg-white rounded-2xl p-4 shadow-soft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center gap-3">
                {/* image */}
                <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-brand-bg flex items-center justify-center">
                  {v.image ? (
                    <img src={v.image.startsWith("http") ? v.image : `/api${v.image}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={22} className="text-brand-light" />
                  )}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-brand-dark truncate">{v.name}</p>
                  <p className="text-[12px] text-brand-light flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {v.address || v.city || "—"}
                  </p>
                  {v.phone && (
                    <p className="text-[11px] text-brand-light flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {v.phone}
                    </p>
                  )}
                </div>

                {/* actions */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditing(v)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center">
                    <Pencil size={14} className="text-brand-medium" />
                  </button>
                  <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    {deleting === v.id ? <span className="spinner !h-4 !w-4" /> : <Trash2 size={14} className="text-brand-red" />}
                  </button>
                </div>
              </div>

              {/* assigned services */}
              {v.serviceDetails && v.serviceDetails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-brand-bg">
                  {v.serviceDetails.map(s => (
                    <span key={s.id} className="px-2.5 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange text-[11px] font-semibold">{s.name}</span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <AdminNav />
    </div>
  );
}
