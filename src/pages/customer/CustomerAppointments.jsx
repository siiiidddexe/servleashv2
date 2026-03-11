import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ChevronRight, X, MapPin, Scissors } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

const tabs = ["upcoming", "completed", "cancelled"];
const tabLabels = ["Upcoming", "Completed", "Cancelled"];

export default function CustomerAppointments() {
  const nav = useNavigate();
  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try { const b = await api.getBookings(tabs[tab]); setBookings(b); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [tab]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try { await api.cancelBooking(id); fetchBookings(); } catch {}
    setCancelling(null);
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">My Bookings</h1>
        </div>
        <div className="mt-4 flex gap-1 rounded-xl bg-brand-bg p-1">
          {tabLabels.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                tab === i ? "bg-white text-brand-orange shadow-soft" : "text-brand-light"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-brand-orange/10 flex items-center justify-center">
              <Calendar size={36} className="text-brand-orange" />
            </div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-5">
              {tab === 0 ? "No upcoming bookings" : tab === 1 ? "No completed bookings" : "No cancelled bookings"}
            </h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">
              Book a service for your pet and your appointments will appear here
            </p>
            <button onClick={() => nav("/customer/home")} className="btn-primary mt-6 px-8">Explore Services</button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {bookings.map((bk, i) => (
                <motion.div
                  key={bk.id}
                  className="rounded-2xl bg-white p-4 shadow-soft"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                      <Scissors size={20} className="text-brand-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-brand-dark truncate">{bk.service?.name || "Service"}</h3>
                      <p className="text-[12px] text-brand-light mt-0.5">{bk.vendor?.name || "Vendor"}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      bk.status === "upcoming" ? "bg-blue-50 text-blue-500" :
                      bk.status === "completed" ? "bg-green-50 text-brand-green" :
                      "bg-red-50 text-brand-red"
                    }`}>
                      {bk.status.charAt(0).toUpperCase() + bk.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-brand-light" />
                      <span className="text-[12px] text-brand-medium">{bk.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-brand-light" />
                      <span className="text-[12px] text-brand-medium">{bk.time}</span>
                    </div>
                    {bk.vendor?.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-brand-light" />
                        <span className="text-[12px] text-brand-medium">{bk.vendor.distance}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-brand-bg pt-3">
                    <span className="text-[16px] font-bold text-brand-dark">₹{bk.amount}</span>
                    {bk.status === "upcoming" && (
                      <button
                        onClick={() => handleCancel(bk.id)}
                        disabled={cancelling === bk.id}
                        className="flex items-center gap-1 text-[13px] font-semibold text-brand-red disabled:opacity-50"
                      >
                        <X size={14} />
                        {cancelling === bk.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav base="/customer" />
    </div>
  );
}
