import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint, Plus, Edit2, Trash2, FileText, QrCode, X, ChevronRight, AlertTriangle } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Hamster", "Other"];

export default function MyPets() {
  const nav = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", species: "Dog", breed: "", age: "", weight: "", color: "", gender: "Male" });
  const [saving, setSaving] = useState(false);

  const fetchPets = async () => {
    setLoading(true);
    try { const p = await api.getMyPets(); setPets(p); } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchPets(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", species: "Dog", breed: "", age: "", weight: "", color: "", gender: "Male" });
    setShowForm(true);
  };

  const openEdit = (pet) => {
    setEditing(pet.id);
    setForm({ name: pet.name, species: pet.species, breed: pet.breed, age: pet.age, weight: pet.weight, color: pet.color, gender: pet.gender });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.species) return;
    setSaving(true);
    try {
      if (editing) { await api.updateMyPet(editing, form); }
      else { await api.createMyPet(form); }
      setShowForm(false);
      fetchPets();
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this pet profile?")) return;
    try { await api.deleteMyPet(id); setPets(prev => prev.filter(p => p.id !== id)); } catch { /* */ }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <h1 className="text-[20px] font-bold text-brand-dark">My Pets</h1>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2 text-[13px] font-bold text-white">
            <Plus size={16} /> Add Pet
          </button>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : pets.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-purple-50 flex items-center justify-center">
              <PawPrint size={36} className="text-purple-500" />
            </div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-5">No pets yet</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">Add your furry family members to manage their health records and more</p>
            <button onClick={openAdd} className="btn-primary mt-6 px-8">Add Your First Pet</button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {pets.map((pet, i) => (
              <motion.div key={pet.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">
                    {pet.species === "Cat" ? "🐱" : pet.species === "Bird" ? "🐦" : pet.species === "Rabbit" ? "🐰" : pet.species === "Fish" ? "🐟" : "🐶"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-brand-dark truncate">{pet.name}</h3>
                      {pet.lostMode && <span className="px-2 py-0.5 rounded-full bg-red-50 text-brand-red text-[10px] font-bold flex items-center gap-1"><AlertTriangle size={10} /> LOST</span>}
                    </div>
                    <p className="text-[12px] text-brand-light mt-0.5">{pet.breed || pet.species} · {pet.gender} · {pet.age || "Age not set"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {pet.weight && <span className="text-[11px] bg-brand-bg rounded-full px-2.5 py-1 text-brand-medium font-medium">{pet.weight}</span>}
                      {pet.color && <span className="text-[11px] bg-brand-bg rounded-full px-2.5 py-1 text-brand-medium font-medium">{pet.color}</span>}
                      <span className="text-[11px] bg-brand-bg rounded-full px-2.5 py-1 text-brand-medium font-medium">{(pet.documents || []).length} docs</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-brand-bg flex items-center gap-2">
                  <button onClick={() => nav(`/customer/pet-docs/${pet.id}`)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-bg py-2.5 text-[12px] font-semibold text-brand-medium active:bg-gray-100">
                    <FileText size={14} /> Documents
                  </button>
                  <button onClick={() => nav(`/customer/pet-qr/${pet.id}`)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-bg py-2.5 text-[12px] font-semibold text-brand-medium active:bg-gray-100">
                    <QrCode size={14} /> QR Tag
                  </button>
                  <button onClick={() => openEdit(pet)} className="h-9 w-9 rounded-xl bg-brand-bg flex items-center justify-center active:bg-gray-100">
                    <Edit2 size={14} className="text-brand-medium" />
                  </button>
                  <button onClick={() => handleDelete(pet.id)} className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <Trash2 size={14} className="text-brand-red" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">{editing ? "Edit Pet" : "Add New Pet"}</h2>
                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <X size={18} className="text-brand-medium" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Pet Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" placeholder="e.g. Buddy" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Species *</label>
                  <select value={form.species} onChange={e => setForm(p => ({...p, species: e.target.value}))} className="input-field">
                    {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Breed</label>
                    <input type="text" value={form.breed} onChange={e => setForm(p => ({...p, breed: e.target.value}))} className="input-field" placeholder="e.g. Labrador" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Gender</label>
                    <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))} className="input-field">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Age</label>
                    <input type="text" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} className="input-field" placeholder="2 yrs" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Weight</label>
                    <input type="text" value={form.weight} onChange={e => setForm(p => ({...p, weight: e.target.value}))} className="input-field" placeholder="12 kg" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Color</label>
                    <input type="text" value={form.color} onChange={e => setForm(p => ({...p, color: e.target.value}))} className="input-field" placeholder="Brown" />
                  </div>
                </div>
              </div>

              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary mt-6 w-full flex items-center justify-center gap-2">
                {saving ? <><span className="spinner" /> Saving...</> : editing ? "Save Changes" : "Add Pet"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav base="/customer" activeTab="my_pets" />
    </div>
  );
}
