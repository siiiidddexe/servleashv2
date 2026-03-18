import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

const PLACEHOLDER = "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=2048x1572&vertical=center";

const getImageSrc = (img) => {
  if (!img) return PLACEHOLDER;
  if (img.startsWith("http")) return img;
  return `/api${img}`;
};

// Cart items are enriched: { productId, qty, product: { name, price, image, ... } }
const itemName  = (i) => i.product?.name  || i.name  || "Unknown";
const itemPrice = (i) => i.product?.price || i.price || 0;
const itemImage = (i) => i.product?.image || i.image || null;

export default function Cart() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try { const c = await api.getCart(); setItems(c.items || []); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (productId, qty) => {
    if (qty < 1) return removeItem(productId);
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
    try { await api.updateCartItem(productId, qty); } catch { /* */ }
  };

  const removeItem = async (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
    try { await api.removeFromCart(productId); } catch { /* */ }
  };

  const total = items.reduce((s, i) => s + itemPrice(i) * (i.qty || 1), 0);

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-36">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">My Cart</h1>
          {items.length > 0 && (
            <span className="ml-auto inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-brand-orange text-white text-[11px] font-bold">
              {items.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <motion.div className="mt-20 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-24 w-24 rounded-full bg-teal-50 flex items-center justify-center">
              <ShoppingCart size={40} className="text-brand-orange" strokeWidth={1.5} />
            </div>
            <h2 className="text-[20px] font-bold text-brand-dark mt-6">Your cart is empty</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[240px] leading-relaxed">
              Add items from the shop to get started
            </p>
            <button
              onClick={() => nav("/customer/shop")}
              className="mt-6 flex items-center gap-2 rounded-full bg-brand-dark px-8 py-3.5 text-[14px] font-bold text-white active:opacity-80"
            >
              <ShoppingBag size={16} /> Browse Shop
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div key={item.productId} className="rounded-2xl bg-white shadow-soft overflow-hidden"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-center gap-3 p-3">
                  <div className="h-[72px] w-[72px] shrink-0 rounded-xl bg-brand-bg overflow-hidden">
                    <img src={getImageSrc(itemImage(item))} alt={itemName(item)} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-[14px] font-bold text-brand-dark truncate leading-tight">{itemName(item)}</h3>
                    <p className="text-[13px] font-bold text-brand-orange mt-1">₹{itemPrice(item)}</p>
                    <p className="text-[11px] text-brand-light mt-0.5">Subtotal: ₹{itemPrice(item) * item.qty}</p>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 self-start mt-1">
                    <Trash2 size={13} className="text-brand-red" />
                  </button>
                </div>
                {/* Qty stepper row */}
                <div className="flex items-center justify-between px-3 pb-3">
                  <span className="text-[11px] text-brand-light">Qty</span>
                  <div className="flex items-center gap-0 rounded-xl bg-brand-bg overflow-hidden">
                    <button onClick={() => updateQty(item.productId, item.qty - 1)} className="h-8 w-9 flex items-center justify-center active:bg-gray-200">
                      <Minus size={13} className="text-brand-medium" />
                    </button>
                    <span className="text-[14px] font-bold text-brand-dark w-8 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, item.qty + 1)} className="h-8 w-9 flex items-center justify-center active:bg-gray-200">
                      <Plus size={13} className="text-brand-medium" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30">
          <div className="max-w-[430px] mx-auto px-4 pb-2">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-elevated flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-brand-light leading-none mb-1">{items.length} {items.length === 1 ? "item" : "items"}</p>
                <p className="text-[22px] font-bold text-brand-dark leading-none">₹{total}</p>
              </div>
              <button onClick={() => nav("/customer/checkout")} className="flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-3 text-[14px] font-bold text-white active:opacity-80 shrink-0">
                Checkout <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav base="/customer" activeTab="shop" />
    </div>
  );
}
