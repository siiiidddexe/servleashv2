import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, Image } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function Charity() {
  const [data, setData] = useState({ totalDonations: 0, media: [] });
  const [loading, setLoading] = useState(true);

  const fetchCharity = useCallback(async () => {
    setLoading(true);
    try { const c = await api.getCharity(); setData(c); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCharity(); }, [fetchCharity]);

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <div>
            <h1 className="text-[20px] font-bold text-brand-dark">Charity ❤️</h1>
            <p className="text-[12px] text-brand-light">See how your donations help strays</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Impact Card */}
        <motion.div className="rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 p-6 text-white shadow-soft"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Heart size={28} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] text-white/80">Total Donations</p>
              <p className="text-[28px] font-bold leading-tight">₹{data.totalDonations}</p>
              <p className="text-[11px] text-white/70">From all Servleash users</p>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <Image size={16} className="text-brand-medium" />
          <h2 className="text-[16px] font-bold text-brand-dark">How Donations Are Used</h2>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center"><span className="spinner" /></div>
        ) : data.media.length === 0 ? (
          <motion.div className="mt-8 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-brand-light text-[14px] text-center">No media yet. Add charity donations at checkout to support strays!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {data.media.map((item, i) => (
              <motion.div key={item.id} className="rounded-2xl bg-white shadow-soft overflow-hidden"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.caption} className="w-full h-36 object-cover bg-gray-50" />
                ) : (
                  <div className="w-full h-36 bg-pink-50 flex items-center justify-center text-4xl">🐾</div>
                )}
                <div className="p-3">
                  <p className="text-[12px] text-brand-dark font-medium line-clamp-2">{item.caption || "Helping strays"}</p>
                  {item.date && <p className="text-[10px] text-brand-light mt-1">{new Date(item.date).toLocaleDateString()}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* How it works */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft mt-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">How It Works</h3>
          <div className="space-y-3">
            {[
              { emoji: "🛒", text: "Add a small charity amount at checkout" },
              { emoji: "🐕", text: "We use donations to feed & care for strays" },
              { emoji: "📸", text: "See photos & updates right here" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{step.emoji}</span>
                <p className="text-[13px] text-brand-medium">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav base="/customer" activeTab="charity" />
    </div>
  );
}
