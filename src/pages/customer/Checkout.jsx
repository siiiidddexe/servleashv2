import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Coins, Heart, MapPin, Check } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

export default function Checkout() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [coins, setCoins] = useState({ balance: 0 });
  const [useCoinsDiscount, setUseCoinsDiscount] = useState(false);
  const [charityAmount, setCharityAmount] = useState(0);
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handlePlace = async () => {
    if (!address.trim()) return alert("Please enter delivery address");
    setPlacing(true);
    try {
      await api.createOrder({ address, useCoins: useCoinsDiscount, charityAmount });
      setOrderPlaced(true);
    } catch { /* */ }
    setPlacing(false);
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;

  if (orderPlaced) {
    return (
      <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-8">
        <motion.div className="flex flex-col items-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="h-20 w-20 rounded-full bg-brand-green flex items-center justify-center"><Check size={40} className="text-white" /></div>
          <h1 className="text-[24px] font-bold text-brand-dark mt-6">Order Placed! 🎉</h1>
          <p className="text-[14px] text-brand-light mt-3 text-center">Your order has been placed successfully. You can track it in your orders.</p>
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
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors ${charityAmount === amt ? "bg-brand-orange text-white" : "bg-brand-bg text-brand-medium"}`}>
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
            <div className="flex justify-between text-[16px] pt-2 border-t border-brand-bg">
              <span className="font-bold text-brand-dark">Total</span>
              <span className="font-bold text-brand-orange">₹{total}</span>
            </div>
          </div>
          <button onClick={handlePlace} disabled={placing || items.length === 0} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
            {placing ? <><span className="spinner" /> Placing Order...</> : <><CreditCard size={16} /> Place Order — ₹{total}</>}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
