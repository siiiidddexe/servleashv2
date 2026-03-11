import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion } from "framer-motion";
import { Users, Store, ClipboardList, DollarSign, TrendingUp, User, Clock, Mail } from "lucide-react";
import AdminNav from "../../components/AdminNav";

export default function AdminHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { icon: Users, label: "Customers", value: stats.customers, color: "#FC8019" },
    { icon: Store, label: "Vendors", value: stats.activeVendors, color: "#48c78e" },
    { icon: ClipboardList, label: "Bookings", value: stats.totalBookings, color: "#4285F4" },
    { icon: DollarSign, label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, color: "#9b59b6" },
  ] : [];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-24">
      <div className="bg-white px-5 pt-12 pb-5">
        <p className="text-[13px] text-brand-light font-medium">Admin Dashboard</p>
        <h1 className="text-[22px] font-bold text-brand-dark mt-1">{user?.name || "Admin"}</h1>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center"><span className="spinner" /></div>
      ) : (
        <>
          <div className="px-5 mt-4 grid grid-cols-2 gap-3">
            {cards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: s.color + "14" }}>
                      <Icon size={20} style={{ color: s.color }} />
                    </div>
                    <TrendingUp size={16} className="text-brand-green" />
                  </div>
                  <p className="text-[24px] font-bold text-brand-dark mt-3">{s.value}</p>
                  <p className="text-[12px] text-brand-light font-medium mt-0.5">{s.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Recent users */}
          <div className="px-5 mt-6">
            <h2 className="section-title">Recent Users</h2>
            <div className="mt-3 space-y-3">
              {(stats?.recentUsers || []).length === 0 ? (
                <p className="text-center text-[13px] text-brand-light py-6">No users yet</p>
              ) : (
                stats.recentUsers.map((u, i) => (
                  <motion.div key={u.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                    <div className="h-10 w-10 shrink-0 rounded-full bg-brand-orange/10 flex items-center justify-center">
                      <User size={18} className="text-brand-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-brand-dark truncate">{u.name}</p>
                      <p className="text-[12px] text-brand-light flex items-center gap-1">
                        <Mail size={10} /> {u.email}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === "customer" ? "bg-orange-50 text-brand-orange" :
                      u.role === "vendor" ? "bg-green-50 text-brand-green" :
                      "bg-blue-50 text-blue-500"
                    }`}>{u.role}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Recent bookings */}
          <div className="px-5 mt-6">
            <h2 className="section-title">Recent Bookings</h2>
            <div className="mt-3 space-y-3">
              {(stats?.recentBookings || []).length === 0 ? (
                <p className="text-center text-[13px] text-brand-light py-6">No bookings yet</p>
              ) : (
                stats.recentBookings.map((b, i) => (
                  <motion.div key={b.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                      <ClipboardList size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-brand-dark truncate">{b.service?.name || "Service"}</p>
                      <p className="text-[12px] text-brand-light">{b.userName} · {b.date}</p>
                    </div>
                    <span className="text-[14px] font-bold text-brand-dark">₹{b.amount}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <AdminNav />
    </div>
  );
}
