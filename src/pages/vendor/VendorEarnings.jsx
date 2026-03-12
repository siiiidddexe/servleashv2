import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function VendorEarnings() {
  const [data, setData] = useState({ total: 0, pending: 0, settled: 0, history: [] });
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try { const e = await api.getVendorEarnings(); setData(e); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">Earnings 💰</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div className="rounded-2xl bg-gradient-to-br from-brand-green to-emerald-500 p-4 text-white shadow-soft"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <TrendingUp size={20} className="text-white/80" />
            <p className="text-[11px] text-white/80 mt-2">Total Earned</p>
            <p className="text-[22px] font-bold">₹{data.total}</p>
          </motion.div>
          <motion.div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 p-4 text-white shadow-soft"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DollarSign size={20} className="text-white/80" />
            <p className="text-[11px] text-white/80 mt-2">Pending</p>
            <p className="text-[22px] font-bold">₹{data.pending}</p>
          </motion.div>
        </div>

        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-brand-medium" />
            <p className="text-[13px] text-brand-light">Settled to bank</p>
          </div>
          <p className="text-[20px] font-bold text-brand-green">₹{data.settled}</p>
          <p className="text-[11px] text-brand-light mt-1">Weekly settlements every Monday</p>
        </motion.div>

        {/* Revenue split info */}
        <motion.div className="rounded-2xl bg-blue-50 p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-[13px] font-bold text-blue-800">Revenue Split</p>
          <p className="text-[12px] text-blue-600 mt-1">You earn 80% of each booking. Servleash takes 20% as platform fee.</p>
        </motion.div>

        {/* History */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">Recent Earnings</h3>
          {(!data.history || data.history.length === 0) ? (
            <p className="text-[13px] text-brand-light text-center py-4">No earnings yet</p>
          ) : (
            <div className="space-y-2">
              {data.history.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-brand-bg last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? "bg-green-50" : "bg-red-50"}`}>
                      {tx.amount > 0 ? <ArrowUpRight size={16} className="text-brand-green" /> : <ArrowDownRight size={16} className="text-brand-red" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-brand-dark">{tx.desc}</p>
                      <p className="text-[11px] text-brand-light">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[14px] font-bold ${tx.amount > 0 ? "text-brand-green" : "text-brand-red"}`}>
                    {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <BottomNav base="/vendor" activeTab="vendor_default" />
    </div>
  );
}
