import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, CheckCircle, Truck, X, AlertTriangle, Coins } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

const statusConfig = {
  confirmed:  { icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50",  label: "Confirmed"   },
  processing: { icon: Package,       color: "text-blue-600",   bg: "bg-blue-50",    label: "Processing"  },
  shipped:    { icon: Truck,         color: "text-purple-600", bg: "bg-purple-50",  label: "Shipped"     },
  delivered:  { icon: CheckCircle,   color: "text-brand-green",bg: "bg-green-50",   label: "Delivered"   },
  cancelled:  { icon: X,             color: "text-red-500",    bg: "bg-red-50",     label: "Cancelled"   },
  // legacy status aliases
  placed:     { icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50",  label: "Placed"      },
};

const canCancel = (status) => status === "confirmed" || status === "processing" || status === "placed";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null); // order id pending cancel confirm
  const [cancelling, setCancelling] = useState(null);
  const [refundToast, setRefundToast] = useState(null); // { coins }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try { const o = await api.getOrders(); setOrders(o); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    try {
      const res = await api.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
      if (res.coinsRefunded > 0) {
        setRefundToast({ coins: res.coinsRefunded });
        setTimeout(() => setRefundToast(null), 4000);
      }
    } catch (e) {
      alert(e.message || "Could not cancel order");
    }
    setCancelling(null);
    setConfirmId(null);
  };

  const confirmOrder = orders.find(o => o.id === confirmId);

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">My Orders</h1>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : orders.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center">
              <Package size={36} className="text-brand-orange" />
            </div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-5">No orders yet</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center">Your order history will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const cfg = statusConfig[order.status] || statusConfig.confirmed;
              const Icon = cfg.icon;
              const cancelable = canCancel(order.status);
              return (
                <motion.div key={order.id} className="rounded-2xl bg-white shadow-soft overflow-hidden"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div>
                      <p className="text-[13px] font-bold text-brand-dark">Order #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[11px] text-brand-light mt-0.5">
                        {new Date(order.created_at || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 pb-3 space-y-1.5 border-b border-brand-bg">
                    {(order.items || []).map((item, j) => (
                      <div key={j} className="flex items-center justify-between text-[13px]">
                        <span className="text-brand-medium">{item.name} <span className="text-brand-light">× {item.qty}</span></span>
                        <span className="text-brand-dark font-semibold">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                    {order.coinDiscount > 0 && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-yellow-600 flex items-center gap-1"><Coins size={11} /> Coins discount</span>
                        <span className="text-yellow-600 font-semibold">-₹{order.coinDiscount}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[11px] text-brand-light">Total paid</p>
                      <p className="text-[16px] font-bold text-brand-orange">₹{order.total}</p>
                    </div>
                    {order.status === "cancelled" ? (
                      <span className="text-[12px] text-brand-light italic">
                        {order.coinDiscount > 0 ? `₹${order.coinDiscount} coins refunded` : "Refund in 3–5 days"}
                      </span>
                    ) : cancelable ? (
                      <button
                        onClick={() => setConfirmId(order.id)}
                        className="px-4 py-2 rounded-xl bg-red-50 text-red-500 text-[12px] font-bold active:opacity-70"
                      >
                        Cancel Order
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation sheet */}
      <AnimatePresence>
        {confirmId && confirmOrder && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmId(null)} />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl px-5 pt-5 pb-10"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={26} className="text-red-500" />
                </div>
              </div>
              <h3 className="text-[18px] font-bold text-brand-dark text-center">Cancel Order?</h3>
              <p className="text-[13px] text-brand-light text-center mt-2 leading-relaxed max-w-[280px] mx-auto">
                Order #{confirmOrder.id.slice(-8).toUpperCase()} will be cancelled.
                {confirmOrder.coinDiscount > 0
                  ? ` Your ${confirmOrder.coinDiscount} coins will be refunded immediately.`
                  : confirmOrder.paymentMethod !== "cod"
                    ? " Refund will be processed in 3–5 business days."
                    : ""}
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmId(null)} className="flex-1 btn-outline">
                  Keep Order
                </button>
                <button
                  onClick={() => handleCancel(confirmId)}
                  disabled={cancelling === confirmId}
                  className="flex-1 rounded-2xl bg-red-500 text-white text-[14px] font-bold py-3.5 flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
                >
                  {cancelling === confirmId ? <><span className="spinner !border-white !border-t-transparent" /> Cancelling…</> : "Yes, Cancel"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Coins refund toast */}
      <AnimatePresence>
        {refundToast && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-5 py-3 rounded-2xl shadow-elevated flex items-center gap-2 text-[13px] font-bold"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          >
            <Coins size={16} /> {refundToast.coins} coins refunded to your wallet!
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav base="/customer" activeTab="shop" />
    </div>
  );
}
