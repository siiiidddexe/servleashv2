import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, CreditCard, HelpCircle, LogOut, ChevronRight, PawPrint, Heart, X, Mail, Phone, MapPin } from "lucide-react";
import BottomNav from "../../components/BottomNav";

const menuItems = [
  { icon: PawPrint, label: "My Pets", desc: "Manage your pet profiles", path: "/customer/my-pets" },
  { icon: Heart, label: "Favourites", desc: "Saved services & pets", path: "/customer/saved" },
  { icon: CreditCard, label: "Orders", desc: "Track your orders", path: "/customer/orders" },
  { icon: Settings, label: "Coins & Rewards", desc: "Daily rewards & referrals", path: "/customer/coins" },
  { icon: HelpCircle, label: "AI Chat Support", desc: "Get instant help", path: "/customer/ai-chat" },
];

export default function CustomerProfile() {
  const nav = useNavigate();
  const { user, logout, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile().then(p => {
      setProfile(p);
      setForm({ name: p.name || "", phone: p.phone || "", city: p.city || "" });
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    logout();
    nav("/");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateProfile(form);
      if (res.user) login(res.user, localStorage.getItem("servleash_token"));
      setProfile(prev => ({ ...prev, ...form }));
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  const stats = [
    { n: profile?.stats?.bookings ?? 0, l: "Bookings" },
    { n: profile?.stats?.saved ?? 0, l: "Saved" },
    { n: profile?.stats?.coins ?? 0, l: "Coins" },
  ];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      {/* Profile header */}
      <div className="bg-white px-5 pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-orange/10 flex items-center justify-center">
            <User size={28} className="text-brand-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-bold text-brand-dark truncate">{user?.name || "User"}</h1>
            <p className="text-[13px] text-brand-light mt-0.5 flex items-center gap-1">
              <Mail size={12} />
              {user?.email || ""}
            </p>
            {user?.phone && (
              <p className="text-[13px] text-brand-light mt-0.5 flex items-center gap-1">
                <Phone size={12} />
                {user.phone}
              </p>
            )}
          </div>
          <button onClick={() => setEditing(true)} className="text-[13px] font-bold text-brand-orange">Edit</button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl bg-brand-bg py-3 text-center">
              <p className="text-[18px] font-bold text-brand-dark">{s.n}</p>
              <p className="text-[11px] text-brand-light font-medium mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="mx-5 mt-4 rounded-2xl bg-white shadow-soft overflow-hidden">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={() => item.path && nav(item.path)}
              className="flex w-full items-center gap-3.5 px-4 py-4 text-left active:bg-brand-bg transition-colors"
              style={i < menuItems.length - 1 ? { borderBottom: "1px solid #f1f1f6" } : {}}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg">
                <Icon size={18} className="text-brand-medium" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-brand-dark">{item.label}</p>
                <p className="text-[12px] text-brand-light">{item.desc}</p>
              </div>
              <ChevronRight size={18} className="text-brand-border" />
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="mx-5 mt-4 flex w-[calc(100%-40px)] items-center justify-center gap-2 rounded-2xl bg-white py-4 shadow-soft text-brand-red text-[15px] font-semibold active:bg-red-50 transition-colors"
      >
        <LogOut size={18} />
        Log Out
      </button>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(false)} />
            <motion.div
              className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center">
                  <X size={18} className="text-brand-medium" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" placeholder="Your name" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="input-field" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">City</label>
                  <input type="text" value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="input-field" placeholder="Your city" />
                </div>
              </div>

              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary mt-6 w-full flex items-center justify-center gap-2">
                {saving ? <><span className="spinner" /> Saving...</> : "Save Changes"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav base="/customer" />
    </div>
  );
}
