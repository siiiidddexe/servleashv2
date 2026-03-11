import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, MapPin, PawPrint, FileText, CheckCircle } from "lucide-react";
import { api } from "../../lib/api";

const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push({ date: d.toISOString().split("T")[0], label: d.toLocaleDateString("en-IN", { weekday: "short" }), day: d.getDate() });
  }
  return days;
}

export default function BookingFlow() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const serviceId = params.get("serviceId");
  const vendorId = params.get("vendorId");
  const mode = params.get("mode") || "in_store";

  const [svc, setSvc] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [myPets, setMyPets] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1); // 1=select slot, 2=confirm, 3=done
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const days = getNext7Days();

  useEffect(() => {
    (async () => {
      try {
        const [s, v, pets] = await Promise.all([
          serviceId ? api.getService(serviceId) : null,
          vendorId ? api.getVendor(vendorId) : null,
          api.getMyPets().catch(() => []),
        ]);
        setSvc(s); setVendor(v); setMyPets(pets);
        if (days[0]) setSelectedDate(days[0].date);
      } catch { /* */ }
      setLoading(false);
    })();
  }, [serviceId, vendorId]);

  const price = mode === "home_delivery" && svc?.homePrice ? svc.homePrice : svc?.price || 0;

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) { setError("Please select a date and time"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await api.createBooking({
        serviceId, vendorId, date: selectedDate, time: selectedTime,
        petName: selectedPet || null, notes: notes || null, mode,
      });
      setBooking(res.booking);
      setStep(3);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-[100dvh] bg-brand-bg flex items-center justify-center"><span className="spinner" /></div>;

  // Success state
  if (step === 3 && booking) return (
    <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
        <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
          <CheckCircle size={44} className="text-brand-green" />
        </div>
      </motion.div>
      <h1 className="text-[22px] font-bold text-brand-dark mt-6">Booking Confirmed!</h1>
      <p className="text-[14px] text-brand-light mt-2 text-center">Your appointment has been booked successfully.</p>
      <div className="mt-6 w-full rounded-2xl bg-white p-5 shadow-soft space-y-3">
        <div className="flex justify-between"><span className="text-[13px] text-brand-light">Service</span><span className="text-[13px] font-semibold text-brand-dark">{svc?.name}</span></div>
        <div className="flex justify-between"><span className="text-[13px] text-brand-light">Vendor</span><span className="text-[13px] font-semibold text-brand-dark">{vendor?.name}</span></div>
        <div className="flex justify-between"><span className="text-[13px] text-brand-light">Date</span><span className="text-[13px] font-semibold text-brand-dark">{selectedDate}</span></div>
        <div className="flex justify-between"><span className="text-[13px] text-brand-light">Time</span><span className="text-[13px] font-semibold text-brand-dark">{selectedTime}</span></div>
        <div className="flex justify-between border-t border-brand-bg pt-3"><span className="text-[15px] font-bold text-brand-dark">Total</span><span className="text-[15px] font-bold text-brand-orange">₹{price}</span></div>
      </div>
      <button onClick={() => nav("/customer/appointments")} className="btn-primary mt-6 w-full">View My Bookings</button>
      <button onClick={() => nav("/customer/home")} className="btn-outline mt-3 w-full">Back to Home</button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-28">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 1 ? nav(-1) : setStep(1)} className="h-10 w-10 rounded-full bg-brand-bg flex items-center justify-center">
            <ArrowLeft size={20} className="text-brand-dark" />
          </button>
          <h1 className="text-[20px] font-bold text-brand-dark">{step === 1 ? "Select Slot" : "Confirm Booking"}</h1>
        </div>
      </div>

      {/* Service summary */}
      <div className="mx-5 mt-4 rounded-2xl bg-white p-4 shadow-soft flex gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-brand-orange/10 flex items-center justify-center">
          <span className="text-xl">✨</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-brand-dark truncate">{svc?.name}</h3>
          <p className="text-[12px] text-brand-light">{vendor?.name} · {svc?.duration}</p>
        </div>
        <p className="text-[16px] font-bold text-brand-orange">₹{price}</p>
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Date picker */}
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2"><Calendar size={16} /> Select Date</h3>
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {days.map((d) => (
                <button key={d.date} onClick={() => setSelectedDate(d.date)}
                  className={`shrink-0 w-16 py-3 rounded-xl text-center transition-all ${selectedDate === d.date ? "bg-brand-orange text-white" : "bg-white shadow-soft text-brand-dark"}`}>
                  <p className="text-[11px] font-medium">{d.label}</p>
                  <p className="text-[18px] font-bold mt-0.5">{d.day}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2"><Clock size={16} /> Select Time</h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((t) => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all ${selectedTime === t ? "bg-brand-orange text-white" : "bg-white shadow-soft text-brand-dark"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pet selection */}
          {myPets.length > 0 && (
            <div className="px-5 mt-5">
              <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2"><PawPrint size={16} /> Select Pet</h3>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {myPets.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPet(p.name)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${selectedPet === p.name ? "bg-brand-orange text-white" : "bg-white shadow-soft text-brand-dark"}`}>
                    {p.species === "Cat" ? "🐱" : "🐶"} {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2"><FileText size={16} /> Notes (optional)</h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..."
              className="mt-2 w-full rounded-xl bg-white border border-brand-border-light p-3 text-[14px] text-brand-dark resize-none h-20 outline-none focus:border-brand-orange" />
          </div>

          <div className="px-5 mt-6">
            <button onClick={() => setStep(2)} disabled={!selectedDate || !selectedTime}
              className="btn-primary w-full">Continue</button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div className="px-5 mt-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="rounded-2xl bg-white p-5 shadow-soft space-y-4">
            <h3 className="text-[16px] font-bold text-brand-dark">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-[13px] text-brand-light">Service</span><span className="text-[13px] font-semibold text-brand-dark">{svc?.name}</span></div>
              <div className="flex justify-between"><span className="text-[13px] text-brand-light">Vendor</span><span className="text-[13px] font-semibold text-brand-dark">{vendor?.name}</span></div>
              <div className="flex justify-between"><span className="text-[13px] text-brand-light">Date</span><span className="text-[13px] font-semibold text-brand-dark">{selectedDate}</span></div>
              <div className="flex justify-between"><span className="text-[13px] text-brand-light">Time</span><span className="text-[13px] font-semibold text-brand-dark">{selectedTime}</span></div>
              <div className="flex justify-between"><span className="text-[13px] text-brand-light">Mode</span><span className="text-[13px] font-semibold text-brand-dark">{mode === "home_delivery" ? "Home Delivery" : "In-Store"}</span></div>
              {selectedPet && <div className="flex justify-between"><span className="text-[13px] text-brand-light">Pet</span><span className="text-[13px] font-semibold text-brand-dark">{selectedPet}</span></div>}
              {notes && <div className="flex justify-between"><span className="text-[13px] text-brand-light">Notes</span><span className="text-[13px] font-semibold text-brand-dark text-right max-w-[200px]">{notes}</span></div>}
            </div>
            <div className="border-t border-brand-bg pt-3 flex justify-between">
              <span className="text-[16px] font-bold text-brand-dark">Total</span>
              <span className="text-[16px] font-bold text-brand-orange">₹{price}</span>
            </div>
          </div>

          <p className="mt-4 text-[12px] text-brand-light text-center">
            Cancellation policy: No cancellations within 2 hours of appointment. Bookings made less than 5 hours before the appointment are non-cancellable.
          </p>

          {error && <p className="mt-2 text-[13px] text-brand-red text-center">{error}</p>}

          <button onClick={handleBook} disabled={submitting} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            {submitting ? <><span className="spinner" /> Booking...</> : `Pay ₹${price} & Confirm`}
          </button>
        </motion.div>
      )}
    </div>
  );
}
