import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Coins, Heart, MapPin, Check, Banknote, Smartphone, ShieldCheck, X, Loader2 } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

export default function Checkout() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [coins, setCoins] = useState({ balance: 0 });
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);
  const [charityAmount, setCharityAmount] = useState(0);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // "razorpay" | "cod"
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRazorpay, setShowRazorpay] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cartData, coinData] = await Promise.all([api.getCart(), api.getCoins()]);
      setItems(cartData);
      setCoins(coinData);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const coinDiscount = useCoinsDiscount ? Math.min(coins.balance || 0, 100, subtotal) : 0;
  const total = subtotal - coinDiscount + charityAmount;

  const placeOrder = async () => {
    setPlacing(true);
    try {
      await api.createOrder({ address, useCoins: useCoinsDiscount, charityAmount, paymentMethod });
      setOrderPlaced(true);
    } catch { /* */ }
    setPlacing(false);
  };

  const handlePlace = async () => {
    if (!address.trim()) return alert("Please enter delivery address");
    if (paymentMethod === "razorpay") {
      setShowRazorpay(true);
    } else {
      await placeOrder();
    }
  };

  const handleRazorpaySuccess = async () => {
    setShowRazorpay(false);
    await placeOrder();
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;

  if (orderPlaced) {
    return (
      <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-8">
        <motion.div className="flex flex-col items-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="h-20 w-20 rounded-full bg-brand-green flex items-center justify-center"><Check size={40} className="text-white" /></div>
          <h1 className="text-[24px] font-bold text-brand-dark mt-6">Order Placed! 🎉</h1>
          <p className="text-[14px] text-brand-light mt-3 text-center">
            {paymentMethod === "cod"
              ? "Your order has been placed. Pay when you receive it!"
              : "Payment successful! Your order is confirmed."}
          </p>
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
                <p className="text-[13px] font-medium text-brand-dark">{item.name}</p>
                <p className="text-[11px] text-brand-light">Qty: {item.qty}</p>
              </div>
              <p className="text-[13px] font-bold text-brand-dark">₹{item.price * item.qty}</p>
            </div>
          ))}
        </motion.div>

        {/* Address */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3 flex items-center gap-2"><MapPin size={16} /> Delivery Address</h3>
          <textarea value={address} onChange={e => setAddress(e.target.value)} className="input-field min-h-[80px]" placeholder="Enter your full delivery address..." />
        </motion.div>

        {/* Payment Method */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3 flex items-center gap-2"><CreditCard size={16} /> Payment Method</h3>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod("razorpay")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 border-2 transition-all ${
                paymentMethod === "razorpay"
                  ? "border-brand-orange bg-brand-orange/5"
                  : "border-brand-border bg-white"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === "razorpay" ? "bg-brand-orange/15" : "bg-brand-bg"}`}>
                <Smartphone size={20} className={paymentMethod === "razorpay" ? "text-brand-orange" : "text-brand-medium"} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-bold text-brand-dark">Pay Online (Razorpay)</p>
                <p className="text-[11px] text-brand-light">UPI, Cards, Net Banking, Wallets</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === "razorpay" ? "border-brand-orange" : "border-brand-border"
              }`}>
                {paymentMethod === "razorpay" && <div className="h-2.5 w-2.5 rounded-full bg-brand-orange" />}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("cod")}
              className={`w-full flex items-center gap-3 rounded-xl p-3.5 border-2 transition-all ${
                paymentMethod === "cod"
                  ? "border-brand-green bg-brand-green/5"
                  : "border-brand-border bg-white"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${paymentMethod === "cod" ? "bg-brand-green/15" : "bg-brand-bg"}`}>
                <Banknote size={20} className={paymentMethod === "cod" ? "text-brand-green" : "text-brand-medium"} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[14px] font-bold text-brand-dark">Cash on Delivery</p>
                <p className="text-[11px] text-brand-light">Pay when you receive your order</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === "cod" ? "border-brand-green" : "border-brand-border"
              }`}>
                {paymentMethod === "cod" && <div className="h-2.5 w-2.5 rounded-full bg-brand-green" />}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Coins Discount */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
              <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${useCoinsDiscount ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
          {useCoinsDiscount && coinDiscount > 0 && (
            <p className="mt-2 text-[12px] text-brand-green font-semibold">-₹{coinDiscount} discount applied!</p>
          )}
        </motion.div>

        {/* Charity */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <Heart size={20} className="text-pink-500" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-brand-dark">Donate for Strays</h3>
              <p className="text-[11px] text-brand-light">Every small amount helps ❤️</p>
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
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
            <div className="flex justify-between text-[13px]">
              <span className="text-brand-light">Payment</span>
              <span className="text-brand-dark font-medium">{paymentMethod === "razorpay" ? "Online (Razorpay)" : "Cash on Delivery"}</span>
            </div>
            <div className="flex justify-between text-[16px] pt-2 border-t border-brand-bg">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="font-bold text-brand-orange">₹{total}</span>
            </div>
          </div>
          <button onClick={handlePlace} disabled={placing || items.length === 0} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
            {placing ? <><span className="spinner" /> Placing Order...</> : paymentMethod === "razorpay" ? <><CreditCard size={16} /> Pay ₹{total}</> : <><Banknote size={16} /> Place Order — ₹{total}</>}
          </button>
        </motion.div>
      </div>

      {/* Razorpay Simulation Modal */}
      <AnimatePresence>
        {showRazorpay && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowRazorpay(false)} />
            <motion.div
              className="relative w-full max-w-[380px] rounded-2xl bg-white overflow-hidden shadow-xl"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            >
              {/* Razorpay-style header */}
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

                {/* Mock payment options */}
                <div className="space-y-2 mb-5">
                  {[
                    { label: "UPI", desc: "Google Pay, PhonePe, Paytm", icon: "📱" },
                    { label: "Cards", desc: "Credit / Debit card", icon: "💳" },
                    { label: "Net Banking", desc: "All major banks", icon: "🏦" },
                    { label: "Wallet", desc: "Paytm, Mobikwik, etc.", icon: "👛" },
                  ].map((opt) => (
                    <div key={opt.label} className="flex items-center gap-3 p-3 rounded-xl bg-brand-bg">
                      <span className="text-lg">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-brand-dark">{opt.label}</p>
                        <p className="text-[11px] text-brand-light">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRazorpaySuccess}
                  disabled={placing}
                  className="w-full rounded-xl bg-[#072654] py-3.5 text-[14px] font-bold text-white flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
                >
                  {placing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><ShieldCheck size={16} /> Pay Securely ₹{total}</>}
                </button>

                <p className="mt-3 text-center text-[10px] text-brand-light">
                  🔒 Payments are 100% secure and encrypted
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
