import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE = {
  pending:   { color: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  completed: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [updating, setUpdating] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminBookings(filter || undefined);
      setBookings(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.updateBookingStatus(id, status);
      await fetchBookings();
    } catch {}
    setUpdating(null);
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-24">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-[22px] font-bold text-brand-dark">Booking Manager</h1>
        <p className="text-[13px] text-brand-light mt-0.5">Manage customer bookings</p>
      </div>

      {/* Status filter tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
              filter === t.id ? "bg-brand-orange text-white" : "bg-white text-brand-medium border border-brand-border-light"
            }`}>{t.label}</button>
        ))}
      </div>

      <div className="px-5 space-y-3 mt-1">
        {loading ? (
          [1, 2, 3].map(n => (
            <div key={n} className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="h-4 w-1/2 bg-brand-bg rounded shimmer" />
              <div className="mt-3 h-3 w-3/4 bg-brand-bg rounded shimmer" />
              <div className="mt-2 h-3 w-1/3 bg-brand-bg rounded shimmer" />
            </div>
          ))
        ) : bookings.length === 0 ? (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle size={48} className="mx-auto text-brand-light" />
            <p className="mt-4 text-[15px] font-semibold text-brand-medium">No bookings found</p>
            <p className="text-[13px] text-brand-light mt-1">Bookings will appear here when customers book services</p>
          </motion.div>
        ) : bookings.map((b, i) => {
          const badge = STATUS_BADGE[b.status] || STATUS_BADGE.pending;
          const BadgeIcon = badge.icon;
          return (
            <motion.div key={b.id} className="rounded-2xl bg-white p-4 shadow-soft"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-brand-dark truncate">{b.serviceName || "Service"}</h3>
                  <p className="text-[12px] text-brand-light mt-0.5">Vendor: {b.vendorName || "—"}</p>
                  <p className="text-[12px] text-brand-light">Customer: {b.customerName || b.customerEmail || "—"}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.color}`}>
                  <BadgeIcon size={12} /> {b.status}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3 text-[12px] text-brand-light">
                <div className="flex items-center gap-1"><CalendarDays size={13} /> {b.date || "—"}</div>
                <div className="flex items-center gap-1"><Clock size={13} /> {b.time || "—"}</div>
              </div>

              {/* Actions */}
              {b.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleStatus(b.id, "confirmed")} disabled={updating === b.id}
                    className="flex-1 py-2 rounded-xl bg-brand-green text-white text-[13px] font-bold disabled:opacity-50">
                    {updating === b.id ? "..." : "Confirm"}
                  </button>
                  <button onClick={() => handleStatus(b.id, "cancelled")} disabled={updating === b.id}
                    className="flex-1 py-2 rounded-xl bg-brand-red text-white text-[13px] font-bold disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              )}
              {b.status === "confirmed" && (
                <button onClick={() => handleStatus(b.id, "completed")} disabled={updating === b.id}
                  className="w-full mt-3 py-2 rounded-xl bg-brand-orange text-white text-[13px] font-bold disabled:opacity-50">
                  {updating === b.id ? "..." : "Mark Completed"}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Refresh FAB */}
      <button onClick={fetchBookings}
        className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-brand-orange text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40">
        <RefreshCw size={20} />
      </button>

      <AdminNav />
    </div>
  );
}
