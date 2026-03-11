import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Phone, X, Plus, Check, Clock } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function LostPetRecovery() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ petName: "", species: "Dog", color: "", lastSeen: "", area: "", description: "", contactPhone: "" });
  const [posting, setPosting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try { const a = await api.getRecoveryAlerts(); setAlerts(a); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleSubmit = async () => {
    if (!form.petName || !form.area || !form.contactPhone) return;
    setPosting(true);
    try {
      await api.createRecoveryAlert(form);
      setShowForm(false);
      setForm({ petName: "", species: "Dog", color: "", lastSeen: "", area: "", description: "", contactPhone: "" });
      fetchAlerts();
    } catch { /* */ }
    setPosting(false);
  };

  const handleResolve = async (id) => {
    if (!confirm("Mark this pet as found?")) return;
    try { await api.resolveRecoveryAlert(id); fetchAlerts(); } catch { /* */ }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <div>
              <h1 className="text-[20px] font-bold text-brand-dark">Lost & Found 🔍</h1>
              <p className="text-[12px] text-brand-light">Community pet recovery network</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-[13px] font-bold text-white">
            <Plus size={14} /> Alert
          </button>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : alerts.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl">🐾</div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-4">No active alerts</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">All pets are safe! Report a lost pet if you need community help.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div key={alert.id} className={`rounded-2xl p-4 shadow-soft ${alert.status === "resolved" ? "bg-green-50" : "bg-white border-l-4 border-brand-red"}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-2xl ${alert.status === "resolved" ? "bg-green-100" : "bg-red-50"}`}>
                    {alert.status === "resolved" ? "✅" : alert.species === "Cat" ? "🐱" : "🐶"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-brand-dark">{alert.petName}</h3>
                      {alert.status === "resolved" ? (
                        <span className="badge-green text-[10px]">FOUND</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-brand-red text-[10px] font-bold">LOST</span>
                      )}
                    </div>
                    <p className="text-[12px] text-brand-light mt-0.5">{alert.species} · {alert.color}</p>
                    {alert.description && <p className="text-[12px] text-brand-medium mt-1">{alert.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-brand-light">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {alert.area}</span>
                      {alert.lastSeen && <span className="flex items-center gap-1"><Clock size={10} /> Last: {alert.lastSeen}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-brand-bg flex gap-2">
                  <a href={`tel:${alert.contactPhone}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-green py-2.5 text-[12px] font-bold text-white">
                    <Phone size={14} /> Contact
                  </a>
                  {alert.status !== "resolved" && alert.isOwner && (
                    <button onClick={() => handleResolve(alert.id)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-bg py-2.5 text-[12px] font-semibold text-brand-medium">
                      <Check size={14} /> Mark Found
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">🚨 Report Lost Pet</h2>
                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Pet Name *</label>
                  <input type="text" value={form.petName} onChange={e => setForm(p => ({...p, petName: e.target.value}))} className="input-field" placeholder="e.g. Buddy" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Species</label>
                    <select value={form.species} onChange={e => setForm(p => ({...p, species: e.target.value}))} className="input-field">
                      <option>Dog</option><option>Cat</option><option>Bird</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Color</label>
                    <input type="text" value={form.color} onChange={e => setForm(p => ({...p, color: e.target.value}))} className="input-field" placeholder="Brown" />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Area / Last Seen Location *</label>
                  <input type="text" value={form.area} onChange={e => setForm(p => ({...p, area: e.target.value}))} className="input-field" placeholder="e.g. MG Road, Bangalore" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Last Seen Date/Time</label>
                  <input type="text" value={form.lastSeen} onChange={e => setForm(p => ({...p, lastSeen: e.target.value}))} className="input-field" placeholder="e.g. Today 2:30 PM" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="input-field min-h-[80px]" placeholder="Any distinguishing features..." />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Contact Phone *</label>
                  <input type="tel" value={form.contactPhone} onChange={e => setForm(p => ({...p, contactPhone: e.target.value}))} className="input-field" placeholder="9876543210" />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={posting || !form.petName || !form.area || !form.contactPhone} className="btn-primary mt-6 w-full flex items-center justify-center gap-2">
                {posting ? <><span className="spinner" /> Submitting...</> : <><AlertTriangle size={16} /> Submit Alert</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav base="/customer" activeTab="recovery" />
    </div>
  );
}
