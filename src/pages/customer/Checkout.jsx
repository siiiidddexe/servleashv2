import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Coins, Heart, MapPin, Check, Banknote, Smartphone, ShieldCheck, X, Loader2, Clock, Calendar } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

const DELIVERY_SLOTS = [
  { id: "9AM-12PM",  label: "9 AM – 12 PM",  sub: "Morning"   },
  { id: "12PM-3PM",  label: "12 PM – 3 PM",   sub: "Afternoon" },
  { id: "3PM-6PM",   label: "3 PM – 6 PM",    sub: "Evening"   },
  { id: "6PM-9PM",   label: "6 PM – 9 PM",    sub: "Night"     },
];

function getNext5Days() {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
    };
  });
}

export default function Checkout() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [coins, setCoins] = useState({ balance: 0 });
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);
  const [charityAmount, setCharityAmount] = useState(0);

  // Structured address
  const [addr, setAddr] = useState({ name: "", phone: "", flat: "", street: "", landmark: "", city: "", pincode: "" });
  const setField = (k, v) => setAddr(prev => ({ ...prev, [k]: v }));

  // Delivery slot
  const days = getNext5Days();
  const [deliveryDate, setDeliveryDate] = useState(days[0].date);
  const [deliverySlot, setDeliverySlot] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRazorpay, setShowRazorpay] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cartData, coinData] = await Promise.all([api.getCart(), api.getCoins()]);
      setItems(cartData.items || []);
      setCoins(coinData);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const itemPrice = (i) => i.product?.price || i.price || 0;
  const itemName  = (i) => i.product?.name  || i.name  || "Unknown";
  const subtotal = items.reduce((s, i) => s + itemPrice(i) * (i.qty || 1), 0);
  const coinDiscount = useCoinsDiscount ? Math.min(coins.balance || 0, 100, subtotal) : 0;
  const total = subtotal - coinDiscount + charityAmount;

  const formattedAddress = [
    `${addr.name}${addr.phone ? " · " + addr.phone : ""}`,
    `${addr.flat}${addr.street ? ", " + addr.street : ""}`,
    addr.landmark,
    `${addr.city}${addr.pincode ? " – " + addr.pincode : ""}`,
  ].filter(Boolean).join("\n");

  const validate = () => {
    if (!addr.name.trim())    return "Please enter your name";
    if (!addr.phone.trim())   return "Please enter your phone number";
    if (!addr.flat.trim())    return "Please enter house/flat details";
    if (!addr.street.trim())  return "Please enter your street/area";
    if (!addr.city.trim())    return "Please enter your city";
    if (!addr.pincode.trim()) return "Please enter your pincode";
    if (!deliverySlot)        return "Please select a delivery time slot";
    return null;
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      await api.createOrder({
        address: formattedAddress,
        deliveryDate,
        deliverySlot,
        useCoins: useCoinsDiscount,
        charityAmount,
        paymentMethod,
      });
      setOrderPlaced(true);
    } catch { /* */ }
    setPlacing(false);
  };

  const handlePlace = async () => {
    const err = validate();
    if (err) return alert(err);
    if (paymentMethod === "razorpay") setShowRazorpay(true);
    else await placeOrder();
  };

  const handleRazorpaySuccess = async () => {
    setShowRazorpay(false);
    await placeOrder();
  };

  const selectedDay = days.find(d => d.date === deliveryDate);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;

  if (orderPlaced) {
    return (
      <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-8">
        <motion.div className="flex flex-col items-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="h-20 w-20 rounded-full bg-brand-green flex items-center justify-center"><Check size={40} className="text-white" /></div>
          <h1 className="text-[24px] font-bold text-brand-dark mt-6">Order Placed!</h1>
          <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">
            Expected delivery: <span className="font-semibold text-brand-dark">{selectedDay?.label}, {DELIVERY_SLOTS.find(s => s.id === deliverySlot)?.label}</span>
          </p>
          <div className="mt-4 w-full rounded-2xl bg-white p-4 shadow-soft text-left space-y-1">
            <p className="text-[12px] text-brand-light">Delivering to</p>
            <p className="text-[13px] font-semibold text-brand-dark whitespace-pre-line">{formattedAddress}</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => nav("/customer/orders")} className="btn-primary px-6">View Orders</button>
            <button onClick={() => nav("/customer/shop")} className="btn-outline px-6">Shop More</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-8">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">Checkout</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Items Summary */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">Order Summary</h3>
          {items.map(item => (
            <div key={item.productId} className="flex items-center justify-between py-2 border-b border-brand-bg last:border-0">
              <div>
                <p className="text-[13px] font-medium text-brand-dark">{itemName(item)}</p>
                <p className="text-[11px] text-brand-light">Qty: {item.qty}</p>
              </div>
              <p className="text-[13px] font-bold text-brand-dark">₹{itemPrice(item) * item.qty}</p>
            </div>
          ))}
        </motion.div>

        {/* Delivery Address */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3 flex items-center gap-2"><MapPin size={15} className="text-brand-orange" /> Delivery Address</h3>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[11px] text-brand-light mb-1">Full Name <span className="text-red-400">*</span></p>
                <input value={addr.name} onChange={e => setField("name", e.target.value)} placeholder="Rahul Sharma" className="input-field w-full" />
              </div>
              <div>
                <p className="text-[11px] text-brand-light mb-1">Phone <span className="text-red-400">*</span></p>
                <input value={addr.phone} onChange={e => setField("phone", e.target.value)} placeholder="9876543210" inputMode="numeric" className="input-field w-full" />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-brand-light mb-1">Flat / House No / Floor / Building <span className="text-red-400">*</span></p>
              <input value={addr.flat} onChange={e => setField("flat", e.target.value)} placeholder="Flat 4B, 2nd Floor, Sunrise Apartments" className="input-field w-full" />
            </div>
            <div>
              <p className="text-[11px] text-brand-light mb-1">Street / Colony / Area <span className="text-red-400">*</span></p>
              <input value={addr.street} onChange={e => setField("street", e.target.value)} placeholder="MG Road, Koramangala" className="input-field w-full" />
            </div>
            <div>
              <p className="text-[11px] text-brand-light mb-1">Landmark <span className="text-brand-light font-normal">(optional)</span></p>
              <input value={addr.landmark} onChange={e => setField("landmark", e.target.value)} placeholder="Near HDFC Bank" className="input-field w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[11px] text-brand-light mb-1">City <span className="text-red-400">*</span></p>
                <input value={addr.city} onChange={e => setField("city", e.target.value)} placeholder="Bangalore" className="input-field w-full" />
              </div>
              <div>
                <p className="text-[11px] text-brand-light mb-1">Pincode <span className="text-red-400">*</span></p>
                <input value={addr.pincode} onChange={e => setField("pincode", e.target.value)} placeholder="560001" inputMode="numeric" maxLength={6} className="input-field w-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delivery Time */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3 flex items-center gap-2"><Clock size={15} className="text-brand-orange" /> Delivery Time</h3>

          {/* Date row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {days.map(d => (
              <button key={d.date} onClick={() => setDeliveryDate(d.date)}
                className={`shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl transition-all ${
                  deliveryDate === d.date ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-dark"
                }`}>
                <span className="text-[10px] font-semibold opacity-70">{d.label}</span>
                <span className="text-[18px] font-extrabold leading-tight">{d.day}</span>
                <span className="text-[9px] font-medium opacity-60">{d.month}</span>
              </button>
            ))}
          </div>

          {/* Time slot pills */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {DELIVERY_SLOTS.map(slot => (
              <button key={slot.id} onClick={() => setDeliverySlot(slot.id)}
                className={`flex flex-col items-start px-3.5 py-3 rounded-xl transition-all border-2 ${
                  deliverySlot === slot.id
                    ? "bg-teal-50 border-teal-400"
                    : "bg-brand-bg border-transparent"
                }`}>
                <span className="text-[10px] font-semibold text-brand-light">{slot.sub}</span>
                <span className={`text-[13px] font-bold mt-0.5 ${deliverySlot === slot.id ? "text-teal-700" : "text-brand-dark"}`}>{slot.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3 flex items-center gap-2"><CreditCard size={15} className="text-brand-orange" /> Payment Method</h3>
          <div className="space-y-2">
            <button onClick={() => setPaymentMethod("razorpay")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 border-2 transition-all ${paymentMethod === "razorpay" ? "border-brand-orange bg-brand-orange/5" : "border-brand-border bg-white"}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === "razorpay" ? "bg-brand-orange/15" : "bg-brand-bg"}`}>
                <Smartphone size={20} className={paymentMethod === "razorpay" ? "text-brand-orange" : "text-brand-medium"} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-bold text-brand-dark">Pay Online (Razorpay)</p>
                <p className="text-[11px] text-brand-light">UPI, Cards, Net Banking, Wallets</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-brand-orange" : "border-brand-border"}`}>
                {paymentMethod === "razorpay" && <div className="h-2.5 w-2.5 rounded-full bg-brand-orange" />}
              </div>
            </button>

            <button onClick={() => setPaymentMethod("cod")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 border-2 transition-all ${paymentMethod === "cod" ? "border-brand-green bg-brand-green/5" : "border-brand-border bg-white"}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === "cod" ? "bg-brand-green/15" : "bg-brand-bg"}`}>
                <Banknote size={20} className={paymentMethod === "cod" ? "text-brand-green" : "text-brand-medium"} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-bold text-brand-dark">Cash on Delivery</p>
                <p className="text-[11px] text-brand-light">Pay when you receive your order</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-brand-green" : "border-brand-border"}`}>
                {paymentMethod === "cod" && <div className="h-2.5 w-2.5 rounded-full bg-brand-green" />}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Coins Discount */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Coins size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-brand-dark">Use Servleash Coins</h3>
                <p className="text-[11px] text-brand-light">Balance: {coins.balance || 0} coins (max ₹100 off)</p>
              </div>
            </div>
            <button onClick={() => setUseCoinsDiscount(!useCoinsDiscount)} className={`h-6 w-10 rounded-full transition-colors ${useCoinsDiscount ? "bg-brand-green" : "bg-gray-200"}`}>
              <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${useCoinsDiscount ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
          {useCoinsDiscount && coinDiscount > 0 && (
            <p className="mt-2 text-[12px] text-brand-green font-semibold">-₹{coinDiscount} discount applied!</p>
          )}
        </motion.div>

        {/* Charity */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <Heart size={20} className="text-pink-500" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-brand-dark">Donate for Strays</h3>
              <p className="text-[11px] text-brand-light">Every small amount helps</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 2, 5, 10].map(amt => (
              <button key={amt} onClick={() => setCharityAmount(amt)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors ${charityAmount === amt ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-medium"}`}>
                {amt === 0 ? "None" : `₹${amt}`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Total & Pay */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-brand-light">Subtotal</span>
              <span className="text-brand-dark font-medium">₹{subtotal}</span>
            </div>
            {coinDiscount > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-brand-green">Coin Discount</span>
                <span className="text-brand-green font-medium">-₹{coinDiscount}</span>
              </div>
            )}
            {charityAmount > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-pink-500">Charity</span>
                <span className="text-pink-500 font-medium">+₹{charityAmount}</span>
              </div>
            )}
            {deliverySlot && (
              <div className="flex justify-between text-[13px]">
                <span className="text-brand-light flex items-center gap-1"><Calendar size={11} /> Delivery</span>
                <span className="text-brand-dark font-medium">{selectedDay?.label} · {DELIVERY_SLOTS.find(s => s.id === deliverySlot)?.label}</span>
              </div>
            )}
            <div className="flex justify-between text-[16px] pt-2 border-t border-brand-bg">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="font-bold text-brand-orange">₹{total}</span>
            </div>
          </div>
          <button onClick={handlePlace} disabled={placing || items.length === 0} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
            {placing ? <><span className="spinner" /> Placing Order…</> : paymentMethod === "razorpay" ? <><CreditCard size={16} /> Pay ₹{total}</> : <><Banknote size={16} /> Place Order — ₹{total}</>}
          </button>
        </motion.div>
      </div>

      {/* Razorpay Simulation Modal */}
      <AnimatePresence>
        {showRazorpay && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowRazorpay(false)} />
            <motion.div className="relative w-full max-w-[380px] rounded-2xl bg-white overflow-hidden shadow-xl"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="bg-[#072654] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-[14px] font-bold">Servleash</p>
                    <p className="text-white/60 text-[11px]">Powered by Razorpay</p>
                  </div>
                </div>
                <button onClick={() => setShowRazorpay(false)} className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center">
                  <X size={14} className="text-white" />
                </button>
              </div>
              <div className="p-5">
                <div className="text-center mb-5">
                  <p className="text-[13px] text-brand-light">Amount to pay</p>
                  <p className="text-[28px] font-bold text-brand-dark">₹{total}</p>
                </div>
                <div className="space-y-2 mb-5">
                  {[
                    { label: "UPI", desc: "Google Pay, PhonePe, Paytm", icon: "📱" },
                    { label: "Cards", desc: "Credit / Debit card", icon: "💳" },
                    { label: "Net Banking", desc: "All major banks", icon: "🏦" },
                    { label: "Wallet", desc: "Paytm, Mobikwik, etc.", icon: "👛" },
                  ].map(opt => (
                    <div key={opt.label} className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg">
                      <span className="text-lg">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-brand-dark">{opt.label}</p>
                        <p className="text-[11px] text-brand-light">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleRazorpaySuccess} disabled={placing}
                  className="w-full rounded-xl bg-[#072654] py-3.5 text-[14px] font-bold text-white flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60">
                  {placing ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><ShieldCheck size={16} /> Pay Securely ₹{total}</>}
                </button>
                <p className="mt-3 text-center text-[10px] text-brand-light">🔒 Payments are 100% secure and encrypted</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
