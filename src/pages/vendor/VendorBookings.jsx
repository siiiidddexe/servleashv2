import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon, Clock, CheckCircle, XCircle, Phone, Calendar, User } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function VendorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try { const b = await api.getVendorBookings(); setBookings(b); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (id, action) => {
    try {
      if (action === "accept") await api.acceptBooking(id);
      else if (action === "decline") await api.declineBooking(id);
      else if (action === "complete") await api.completeBooking(id);
      fetchBookings();
    } catch { /* */ }
  };

  const tabs = [
    { key: "pending", label: "Pending", icon: Clock },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
    { key: "completed", label: "Done", icon: Check },
    { key: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  const filtered = bookings.filter(b => b.status === tab);

  const statusColors = {
    pending: "bg-yellow-50 text-yellow-600",
    confirmed: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-brand-green",
    cancelled: "bg-red-50 text-brand-red",
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-0">
        <div className="flex items-center gap-3 pb-4">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">My Bookings</h1>
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-5 px-5 pb-3">
          {tabs.map(t => {
            const Icon = t.icon;
            const count = bookings.filter(b => b.status === t.key).length;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-colors ${tab === t.key ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-medium"}`}>
                <Icon size={14} /> {t.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-brand-light text-[14px] mt-12">No {tab} bookings</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((b, i) => (
              <motion.div key={b.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-brand-dark">{b.serviceName || "Service"}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[12px] text-brand-light">
                      <span className="flex items-center gap-1"><User size={12} /> {b.customerName || "Customer"}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {b.date}</span>
                    </div>
                    <p className="text-[12px] text-brand-light mt-0.5">{b.time} · {b.mode || "In-Store"}</p>
                    {b.petName && <p className="text-[11px] text-brand-medium mt-1">🐾 {b.petName}</p>}
                    {b.notes && <p className="text-[11px] text-brand-light mt-1 italic">"{b.notes}"</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${statusColors[b.status]}`}>{b.status}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[16px] font-bold text-brand-orange">₹{b.price}</p>
                  <div className="flex gap-2">
                    {b.status === "pending" && (
                      <>
                        <button onClick={() => handleAction(b.id, "accept")} className="flex items-center gap-1 rounded-xl bg-brand-green px-4 py-2 text-[12px] font-bold text-white">
                          <Check size={14} /> Accept
                        </button>
                        <button onClick={() => handleAction(b.id, "decline")} className="flex items-center gap-1 rounded-xl bg-red-50 px-4 py-2 text-[12px] font-bold text-brand-red">
                          <XIcon size={14} /> Decline
                        </button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button onClick={() => handleAction(b.id, "complete")} className="flex items-center gap-1 rounded-xl bg-brand-dark px-4 py-2 text-[12px] font-bold text-white">
                        <CheckCircle size={14} /> Complete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav base="/vendor" activeTab="vendor_default" />
    </div>
  );
}
