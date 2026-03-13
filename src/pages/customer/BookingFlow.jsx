import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, PawPrint, FileText, CheckCircle, CreditCard, Banknote, Shield } from "lucide-react";
import { api } from "../../lib/api";

// Generate time slots dynamically from service operating hours or default 9AM–5PM
function generateTimeSlots(startHour = 9, endHour = 17, intervalMin = 30) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMin) {
      if (h === 12 && m >= 0 && h < 14) continue; // skip lunch 12:00-12:30
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function getImageSrc(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `/api${img}`;
}

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
    });
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
  const [paymentMethod, setPaymentMethod] = useState(""); // "razorpay" | "cash"
  const [step, setStep] = useState(1); // 1=select slot, 2=confirm, 3=done
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const days = getNext7Days();
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    (async () => {
      try {
        const [s, v, pets] = await Promise.all([
          serviceId ? api.getService(serviceId) : null,
          vendorId ? api.getVendor(vendorId).catch(() => null) : null,
          api.getMyPets().catch(() => []),
        ]);
        setSvc(s); setVendor(v); setMyPets(pets);
        if (days[0]) setSelectedDate(days[0].date);
      } catch { /* */ }
      setLoading(false);
    })();
  }, [serviceId, vendorId]);

  const price = mode === "home_delivery" && svc?.homePrice ? svc.homePrice : svc?.price || 0;

  const handleRazorpay = () => {
    const options = {
      key: "rzp_test_1DP5mmOlF5G5ag", // Razorpay test key
      amount: price * 100,
      currency: "INR",
      name: "Servleash",
      description: `${svc?.name} — ${vendor?.name}`,
      image: getImageSrc(svc?.image) || "/favicon.ico",
      handler: async (response) => {
        // Payment successful — create booking
        await createBooking(response.razorpay_payment_id);
      },
      prefill: { email: "", contact: "" },
      theme: { color: "#14B8A6" },
      modal: { ondismiss: () => setSubmitting(false) },
    };

    if (window.Razorpay) {
      setSubmitting(true);
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      setError("Payment gateway loading... Please try again.");
    }
  };

  const createBooking = async (paymentId = null) => {
    setSubmitting(true); setError("");
    try {
      const res = await api.createBooking({
        serviceId, vendorId, date: selectedDate, time: selectedTime,
        petName: selectedPet || null, notes: notes || null, mode,
        paymentMethod: paymentId ? "razorpay" : "cash",
        paymentId: paymentId || null,
      });
      setBooking(res.booking);
      setStep(3);
    } catch (e) { setError(e.message); }
    setSubmitting(false);
  };

  const handleConfirm = () => {
    if (!paymentMethod) { setError("Please select a payment method"); return; }
    if (paymentMethod === "razorpay") handleRazorpay();
    else createBooking();
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center">
      <span className="spinner" style={{ borderTopColor: "#14B8A6", borderColor: "rgba(20,184,166,0.2)" }} />
    </div>
  );

  // ── Success state ──
  if (step === 3 && booking) return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
        <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
          <CheckCircle size={44} className="text-brand-green" />
        </div>
      </motion.div>
      <h1 className="text-[22px] font-extrabold text-brand-dark mt-6">Booking Confirmed</h1>
      <p className="text-[14px] text-brand-light mt-2 text-center">
        {paymentMethod === "cash" ? "Pay at the venue when you arrive." : "Payment received successfully."}
      </p>
      <div className="mt-6 w-full rounded-2xl bg-gray-50 p-5 space-y-3">
        <Row label="Service" value={svc?.name} />
        <Row label="Vendor" value={vendor?.name || "🔄 Finding a provider..."} />
        <Row label="Date" value={new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} />
        <Row label="Time" value={selectedTime} />
        <Row label="Mode" value={mode === "home_delivery" ? "Home Visit" : "At Salon"} />
        <Row label="Payment" value={paymentMethod === "cash" ? "Cash" : "Online (Razorpay)"} />
        {selectedPet && <Row label="Pet" value={selectedPet} />}
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="text-[15px] font-extrabold text-brand-dark">Total</span>
          <span className="text-[15px] font-extrabold text-brand-orange">₹{price}</span>
        </div>
      </div>
      <button onClick={() => nav("/customer/appointments")} className="btn-primary mt-6 w-full">View My Bookings</button>
      <button onClick={() => nav("/customer/home")} className="btn-outline mt-3 w-full">Back to Home</button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-white pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 1 ? nav(-1) : setStep(1)}
            className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft size={20} className="text-brand-dark" />
          </button>
          <div>
            <h1 className="text-[18px] font-extrabold text-brand-dark">
              {step === 1 ? "Select Slot" : "Confirm & Pay"}
            </h1>
            <p className="text-[12px] text-brand-light">Step {step} of 2</p>
          </div>
        </div>
      </div>

      {/* Service card */}
      <div className="mx-5 mt-4 rounded-2xl bg-gray-50 p-4 flex gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden">
          <img src={getImageSrc(svc?.image) || ""} alt={svc?.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-brand-dark truncate">{svc?.name}</h3>
          <p className="text-[12px] text-brand-light">{vendor?.name ? `${vendor.name} · ` : ""}{svc?.duration}</p>
          <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
            mode === "home_delivery" ? "bg-teal-50 text-teal-600" : "bg-blue-50 text-blue-600"
          }`}>{mode === "home_delivery" ? "Home Visit" : "At Salon"}</span>
        </div>
        <p className="text-[16px] font-extrabold text-brand-orange self-center">₹{price}</p>
      </div>

      {/* ── Step 1: Select Slot ── */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Date picker */}
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2">
              <Calendar size={15} className="text-brand-orange" /> Select Date
            </h3>
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {days.map((d) => (
                <button key={d.date} onClick={() => setSelectedDate(d.date)}
                  className={`shrink-0 w-[4.25rem] py-3 rounded-xl text-center transition-all ${
                    selectedDate === d.date
                      ? "bg-brand-dark text-white shadow-elevated"
                      : "bg-gray-50 text-brand-dark"
                  }`}>
                  <p className="text-[10px] font-medium opacity-70">{d.label}</p>
                  <p className="text-[20px] font-extrabold mt-0.5">{d.day}</p>
                  <p className="text-[9px] font-semibold opacity-60">{d.month}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2">
              <Clock size={15} className="text-brand-orange" /> Select Time
            </h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {timeSlots.map((t) => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                    selectedTime === t
                      ? "bg-brand-dark text-white shadow-elevated"
                      : "bg-gray-50 text-brand-dark"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pet selection */}
          {myPets.length > 0 && (
            <div className="px-5 mt-5">
              <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2">
                <PawPrint size={15} className="text-brand-orange" /> Select Pet
              </h3>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {myPets.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPet(prev => prev === p.name ? "" : p.name)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                      selectedPet === p.name
                        ? "bg-brand-dark text-white"
                        : "bg-gray-50 text-brand-dark"
                    }`}>
                    {p.species === "Cat" ? "🐱" : "🐶"} {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="px-5 mt-5">
            <h3 className="text-[14px] font-bold text-brand-dark flex items-center gap-2">
              <FileText size={15} className="text-brand-orange" /> Notes (optional)
            </h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..."
              className="mt-2 w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-[13px] text-brand-dark resize-none h-20 outline-none focus:border-brand-orange transition-colors" />
          </div>

          <div className="px-5 mt-6">
            <button onClick={() => { setError(""); setStep(2); }} disabled={!selectedDate || !selectedTime}
              className="btn-primary w-full">Continue to Payment</button>
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Confirm & Pay ── */}
      {step === 2 && (
        <motion.div className="px-5 mt-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          {/* Summary */}
          <div className="rounded-2xl bg-gray-50 p-5 space-y-3">
            <h3 className="text-[15px] font-extrabold text-brand-dark mb-1">Booking Summary</h3>
            <Row label="Service" value={svc?.name} />
            <Row label="Vendor" value={vendor?.name || "🔄 Any available provider"} />
            <Row label="Date" value={new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} />
            <Row label="Time" value={selectedTime} />
            <Row label="Mode" value={mode === "home_delivery" ? "Home Visit" : "At Salon"} />
            {selectedPet && <Row label="Pet" value={selectedPet} />}
            {notes && <Row label="Notes" value={notes} />}
          </div>

          {/* Payment method */}
          <h3 className="text-[15px] font-extrabold text-brand-dark mt-6 mb-3">Payment Method</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => { setPaymentMethod("razorpay"); setError(""); }}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 transition-all border-2 ${
                paymentMethod === "razorpay"
                  ? "bg-teal-50 border-brand-orange"
                  : "bg-gray-50 border-transparent"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                paymentMethod === "razorpay" ? "bg-brand-orange" : "bg-gray-200"
              }`}>
                <CreditCard size={18} className={paymentMethod === "razorpay" ? "text-white" : "text-gray-500"} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[14px] font-bold text-brand-dark">Pay Online</p>
                <p className="text-[11px] text-brand-light">UPI, Cards, Netbanking via Razorpay</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === "razorpay" ? "border-brand-orange bg-brand-orange" : "border-gray-300"
              }`}>
                {paymentMethod === "razorpay" && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </button>

            <button
              onClick={() => { setPaymentMethod("cash"); setError(""); }}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 transition-all border-2 ${
                paymentMethod === "cash"
                  ? "bg-teal-50 border-brand-orange"
                  : "bg-gray-50 border-transparent"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                paymentMethod === "cash" ? "bg-brand-orange" : "bg-gray-200"
              }`}>
                <Banknote size={18} className={paymentMethod === "cash" ? "text-white" : "text-gray-500"} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[14px] font-bold text-brand-dark">Cash on Service</p>
                <p className="text-[11px] text-brand-light">Pay when the service is done</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === "cash" ? "border-brand-orange bg-brand-orange" : "border-gray-300"
              }`}>
                {paymentMethod === "cash" && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
            </button>
          </div>

          {/* Total + CTA */}
          <div className="mt-6 rounded-2xl bg-brand-dark p-4 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-white/60 font-medium">Total Amount</p>
              <p className="text-[22px] font-extrabold text-white">₹{price}</p>
            </div>
            <Shield size={20} className="text-white/30" />
          </div>

          {error && <p className="mt-3 text-[13px] text-brand-red text-center font-semibold">{error}</p>}

          <button onClick={handleConfirm} disabled={submitting || !paymentMethod}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            {submitting ? (
              <><span className="spinner" /> Processing...</>
            ) : paymentMethod === "cash" ? (
              "Confirm Booking"
            ) : (
              `Pay ₹${price}`
            )}
          </button>

          <p className="mt-3 text-[11px] text-brand-light text-center">
            By confirming, you agree to the cancellation policy. No cancellations within 2 hours of appointment.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[13px] text-brand-light">{label}</span>
      <span className="text-[13px] font-semibold text-brand-dark text-right max-w-[200px]">{value}</span>
    </div>
  );
}
