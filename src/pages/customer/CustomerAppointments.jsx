import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, X, MapPin, Scissors, AlertTriangle, CheckCircle, Star } from "lucide-react";
import ReviewSheet from "../../components/ReviewSheet";
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
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null); // { id, name, type }

  const fetchBookings = async () => {
    setLoading(true);
    try { const b = await api.getBookings(tabs[tab]); setBookings(b); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [tab]);

  const handleCancel = async (id) => {
    setCancelling(id);
    setCancelError("");
    try {
      await api.cancelBooking(id);
      setCancelConfirm(null);
      fetchBookings();
    } catch (e) {
      setCancelError(e.message || "Cannot cancel this booking");
    }
    setCancelling(null);
  };

  const statusColor = (s) =>
    s === "upcoming" ? "bg-blue-50 text-blue-500" :
    s === "completed" ? "bg-green-50 text-brand-green" :
    "bg-red-50 text-brand-red";

  const statusIcon = (s) =>
    s === "completed" ? <CheckCircle size={20} className="text-brand-green" /> :
    s === "cancelled" ? <X size={20} className="text-brand-red" /> :
    <Scissors size={20} className="text-brand-orange" />;

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
                      {statusIcon(bk.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-brand-dark truncate">{bk.service?.name || "Service"}</h3>
                      <p className="text-[12px] text-brand-light mt-0.5">{bk.vendor?.name || "Vendor"}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColor(bk.status)}`}>
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
                      <button onClick={() => { setCancelError(""); setCancelConfirm(bk); }}
                        className="flex items-center gap-1 text-[13px] font-semibold text-brand-red">
                        <X size={14} /> Cancel
                      </button>
                    )}
                    {bk.status === "completed" && bk.vendorId && (
                      <button
                        onClick={() => setReviewTarget({ id: bk.vendorId, name: bk.vendor?.name || "Vendor", type: "vendor" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-50 text-[12px] font-bold text-yellow-600 active:opacity-70"
                      >
                        <Star size={12} /> Rate
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelConfirm && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => { setCancelConfirm(null); setCancelError(""); }} />
            <motion.div
              className="relative w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-xl"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-brand-red" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-brand-dark">Cancel Booking?</h3>
                  <p className="text-[12px] text-brand-light">{cancelConfirm.service?.name}</p>
                </div>
              </div>

              <div className="rounded-xl bg-brand-bg p-3 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[12px] text-brand-medium">
                  <Calendar size={13} /> {cancelConfirm.date} at {cancelConfirm.time}
                </div>
                <p className="text-[12px] text-brand-medium font-semibold">₹{cancelConfirm.amount}</p>
              </div>

              <div className="rounded-xl bg-yellow-50 p-3 mb-4">
                <p className="text-[11px] text-yellow-800 font-medium leading-relaxed">
                  ⚠️ <strong>Cancellation Policy:</strong> Bookings cannot be cancelled within 2 hours of the appointment, 
                  or if booked less than 5 hours before the appointment time. Non-refundable in those cases.
                </p>
              </div>

              {cancelError && (
                <div className="rounded-xl bg-red-50 p-3 mb-4">
                  <p className="text-[12px] text-brand-red font-medium">{cancelError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelConfirm(null); setCancelError(""); }}
                  className="btn-outline flex-1"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => handleCancel(cancelConfirm.id)}
                  disabled={cancelling === cancelConfirm.id}
                  className="flex-1 rounded-xl bg-brand-red py-3 text-[14px] font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling === cancelConfirm.id ? <><span className="spinner !h-4 !w-4" /> Cancelling...</> : <><X size={14} /> Yes, Cancel</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review sheet */}
      <AnimatePresence>
        {reviewTarget && (
          <ReviewSheet
            targetId={reviewTarget.id}
            targetType={reviewTarget.type}
            targetName={reviewTarget.name}
            onClose={() => setReviewTarget(null)}
            onSuccess={() => setReviewTarget(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav base="/customer" />
    </div>
  );
}
