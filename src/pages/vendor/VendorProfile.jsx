import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Store, MapPin, Phone, Star, Clock, Edit2, Save } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try { const p = await api.getVendorProfile(); setProfile(p); setForm(p); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    try {
      await api.updateProfile({ name: form.name, phone: form.phone });
      setProfile(prev => ({ ...prev, ...form }));
      setEditing(false);
    } catch { /* */ }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;
  if (!profile) return <div className="min-h-[100dvh] flex items-center justify-center"><p className="text-brand-light">Profile not found</p></div>;

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <h1 className="text-[20px] font-bold text-brand-dark">Business Profile</h1>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-[13px] font-bold text-white">
            {editing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Business Card */}
        <motion.div className="rounded-2xl bg-white p-5 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-400 flex items-center justify-center">
              <Store size={28} className="text-white" />
            </div>
            <div className="flex-1">
              {editing ? (
                <input type="text" value={form.name || ""} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field text-[18px] font-bold" />
              ) : (
                <h2 className="text-[18px] font-bold text-brand-dark">{profile.name}</h2>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-[13px] font-semibold text-brand-dark">{profile.rating || "4.5"}</span>
                <span className="text-[12px] text-brand-light">({profile.reviews || 0} reviews)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">Contact Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-brand-light" />
              {editing ? (
                <input type="tel" value={form.phone || ""} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="input-field flex-1" />
              ) : (
                <p className="text-[13px] text-brand-dark">{profile.phone || "Not set"}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-brand-light" />
              <p className="text-[13px] text-brand-dark">{profile.address || "Address not set"}</p>
            </div>
          </div>
        </motion.div>

        {/* Services */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">Services Offered</h3>
          {profile.services && profile.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s, i) => (
                <span key={i} className="rounded-full bg-brand-bg px-3 py-1.5 text-[12px] font-medium text-brand-medium">{s}</span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-brand-light">No services assigned. Contact admin to add services.</p>
          )}
        </motion.div>

        {/* Hours */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-brand-medium" />
            <h3 className="text-[15px] font-bold text-brand-dark">Business Hours</h3>
          </div>
          <div className="space-y-1.5">
            {["Mon-Fri: 9 AM - 7 PM", "Saturday: 9 AM - 5 PM", "Sunday: 10 AM - 4 PM"].map((h, i) => (
              <p key={i} className="text-[13px] text-brand-medium">{h}</p>
            ))}
          </div>
        </motion.div>

        {/* Gallery */}
        {profile.gallery && profile.gallery.length > 0 && (
          <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-[15px] font-bold text-brand-dark mb-3">Gallery</h3>
            <div className="grid grid-cols-3 gap-2">
              {profile.gallery.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden h-24 bg-brand-bg">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <BottomNav base="/vendor" activeTab="vendor_default" />
    </div>
  );
}
