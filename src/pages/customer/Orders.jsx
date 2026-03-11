import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try { const o = await api.getOrders(); setOrders(o); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const statusConfig = {
    placed: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Placed" },
    processing: { icon: Package, color: "text-blue-600", bg: "bg-blue-50", label: "Processing" },
    shipped: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", label: "Shipped" },
    delivered: { icon: CheckCircle, color: "text-brand-green", bg: "bg-green-50", label: "Delivered" },
  };

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
            <div className="h-20 w-20 rounded-full bg-orange-50 flex items-center justify-center">
              <Package size={36} className="text-brand-orange" />
            </div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-5">No orders yet</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center">Your order history will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const cfg = statusConfig[order.status] || statusConfig.placed;
              const Icon = cfg.icon;
              return (
                <motion.div key={order.id} className="rounded-2xl bg-white p-4 shadow-soft"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[12px] text-brand-light">Order #{order.id.slice(-8)}</p>
                      <p className="text-[11px] text-brand-light">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(order.items || []).map((item, j) => (
                      <div key={j} className="flex items-center justify-between text-[13px]">
                        <span className="text-brand-medium">{item.name} × {item.qty}</span>
                        <span className="text-brand-dark font-medium">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-bg">
                    <span className="text-[13px] text-brand-light">Total</span>
                    <span className="text-[16px] font-bold text-brand-orange">₹{order.total}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav base="/customer" activeTab="shop" />
    </div>
  );
}
