import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion } from "framer-motion";
import { CalendarCheck, DollarSign, Star, Scissors, Clock, User, ChevronRight } from "lucide-react";
import BottomNav from "../../components/BottomNav";

export default function VendorHome() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getVendorStats(), api.getVendorBookings()])
      .then(([s, b]) => { setStats(s); setBookings(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { icon: CalendarCheck, label: "Today's Bookings", value: stats.todayBookings, color: "#FC8019" },
    { icon: DollarSign, label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, color: "#48c78e" },
    { icon: Star, label: "Rating", value: stats.rating, color: "#f59e0b" },
    { icon: Scissors, label: "Services", value: stats.servicesCount, color: "#4285F4" },
  ] : [];

  const statusColor = (s) =>
    s === "upcoming" ? "bg-brand-orange/10 text-brand-orange" :
    s === "completed" ? "bg-green-50 text-brand-green" :
    "bg-red-50 text-brand-red";

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-5">
        <p className="text-[13px] text-brand-light font-medium">Vendor Dashboard</p>
        <h1 className="text-[22px] font-bold text-brand-dark mt-1">{user?.name || "Vendor"}</h1>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center"><span className="spinner" /></div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="px-5 mt-4 flex gap-3 overflow-x-auto no-scrollbar">
            {[
              { label: "Bookings", path: "/vendor/bookings" },
              { label: "Earnings", path: "/vendor/earnings" },
              { label: "My Profile", path: "/vendor/profile" },
            ].map((item) => (
              <button key={item.label} onClick={() => nav(item.path)}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-soft text-[13px] font-semibold text-brand-dark active:scale-[0.97] transition-transform">
                {item.label} <ChevronRight size={14} className="text-brand-light" />
              </button>
            ))}
          </div>

          <div className="px-5 mt-4 grid grid-cols-2 gap-3">
            {cards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: s.color + "14" }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <p className="text-[24px] font-bold text-brand-dark mt-3">{s.value}</p>
                  <p className="text-[12px] text-brand-light font-medium mt-0.5">{s.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="px-5 mt-6">
            <h2 className="section-title">Upcoming Appointments</h2>
            <div className="mt-3 space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarCheck size={40} className="mx-auto text-brand-border" />
                  <p className="text-[14px] text-brand-light mt-3">No upcoming appointments</p>
                </div>
              ) : (
                bookings.map((b, i) => (
                  <motion.div key={b.id} className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                        <Scissors size={20} className="text-brand-orange" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[15px] font-bold text-brand-dark truncate pr-2">{b.serviceName || "Service"}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(b.status)}`}>{b.status}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <User size={12} className="text-brand-light" />
                          <p className="text-[13px] text-brand-medium">{b.customerName || "Customer"}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[12px] text-brand-light">
                          <span className="flex items-center gap-1"><Clock size={12} /> {b.date} · {b.time}</span>
                        </div>
                        {b.customerEmail && (
                          <p className="text-[11px] text-brand-light mt-1 truncate">{b.customerEmail}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border/50">
                      <span className="text-[14px] font-bold text-brand-dark">₹{b.amount}</span>
                      {b.status === "upcoming" && (
                        <button className="text-[12px] font-bold text-brand-green">Mark Complete</button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <BottomNav base="/vendor" activeTab="vendor_default" />
    </div>
  );
}
