import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, Heart, Star, Trash2, MapPin, Scissors, Dog } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function CustomerSaved() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    setLoading(true);
    try { const s = await api.getSaved(); setItems(s); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSaved(); }, []);

  const handleRemove = async (itemId, type) => {
    try { await api.unsaveItem(itemId, type); setItems(prev => prev.filter(s => !(s.itemId === itemId && s.type === type))); } catch {}
  };

  const getIcon = (type) => {
    if (type === "vendor") return MapPin;
    if (type === "service") return Scissors;
    if (type === "pet") return Dog;
    return Bookmark;
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">Saved</h1>
          {items.length > 0 && <span className="ml-auto text-[13px] text-brand-light">{items.length} items</span>}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <motion.div className="mt-20 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-brand-orange/10 flex items-center justify-center">
              <Bookmark size={36} className="text-brand-orange" />
            </div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-5">Nothing saved yet</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">
              Tap the heart icon on any pet or service to save it here for quick access
            </p>
            <button onClick={() => nav("/customer/home")} className="btn-primary mt-6 px-8">Browse Pets</button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {items.map((s, i) => {
              const Icon = getIcon(s.type);
              const item = s.item;
              if (!item) return null;
              return (
                <motion.div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                >
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                    <Icon size={20} className="text-brand-orange" />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => { if (s.type === "pet") nav(`/customer/pet/${item.id}`); }}>
                    <h3 className="text-[15px] font-bold text-brand-dark truncate">{item.name}</h3>
                    <p className="text-[12px] text-brand-light mt-0.5">
                      {s.type === "vendor" ? `${item.category} · ${item.distance}` :
                       s.type === "service" ? `${item.category} · ₹${item.price}` :
                       s.type === "pet" ? `${item.breed} · ${item.gender}` :
                       s.type === "product" ? `${item.category} · ₹${item.price}` : s.type}
                    </p>
                    {(item.rating) && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="text-[11px] font-semibold text-brand-medium">{item.rating}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleRemove(s.itemId, s.type)} className="h-9 w-9 shrink-0 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 size={16} className="text-brand-red" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav base="/customer" />
    </div>
  );
}
