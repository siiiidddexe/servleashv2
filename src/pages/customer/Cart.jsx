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
          <span className="ml-auto text-[13px] text-brand-light">{items.length} items</span>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center">
              <ShoppingCart size={36} className="text-brand-orange" />
            </div>
            <h2 className="text-[18px] font-bold text-brand-dark mt-5">Cart is empty</h2>
            <p className="text-[14px] text-brand-light mt-2 text-center max-w-[260px]">Browse our pet shop and add items to your cart</p>
            <button onClick={() => nav("/customer/shop")} className="btn-primary mt-5 px-8 flex items-center gap-2"><ShoppingBag size={16} /> Shop Now</button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div key={item.productId} className="rounded-2xl bg-white p-4 shadow-soft flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="h-16 w-16 shrink-0 rounded-xl bg-brand-bg overflow-hidden">
                  <img src={getImageSrc(itemImage(item))} alt={itemName(item)} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-brand-dark truncate">{itemName(item)}</h3>
                  <p className="text-[13px] font-bold text-brand-orange mt-0.5">₹{itemPrice(item)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.productId, item.qty - 1)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center active:bg-gray-100">
                    <Minus size={14} className="text-brand-medium" />
                  </button>
                  <span className="text-[14px] font-bold text-brand-dark w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.productId, item.qty + 1)} className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center active:bg-gray-100">
                    <Plus size={14} className="text-brand-medium" />
                  </button>
                  <button onClick={() => removeItem(item.productId)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center ml-1">
                    <Trash2 size={14} className="text-brand-red" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30">
          <div className="max-w-[430px] mx-auto px-5">
            <div className="bg-white rounded-2xl p-4 shadow-elevated flex items-center justify-between">
              <div>
                <p className="text-[12px] text-brand-light">Total</p>
                <p className="text-[20px] font-bold text-brand-dark">₹{total}</p>
              </div>
              <button onClick={() => nav("/customer/checkout")} className="flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-[14px] font-bold text-white active:opacity-80">
                Checkout <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav base="/customer" activeTab="shop" />
    </div>
  );
}
