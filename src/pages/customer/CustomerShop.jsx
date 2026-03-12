import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ShoppingCart, SlidersHorizontal, Star, Plus } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

const cats = ["All", "Food", "Toys", "Treats", "Hygiene", "Accessories"];

export default function CustomerShop() {
  const nav = useNavigate();
  const [active, setActive] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [adding, setAdding] = useState(null);

  const fetchProducts = async (cat) => {
    setLoading(true);
    try { const p = await api.getProducts(cat); setProducts(p); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProducts(cats[active]); }, [active]);

  const filtered = searchQ
    ? products.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()))
    : products;

  const handleAddToCart = async (productId) => {
    setAdding(productId);
    try { await api.addToCart(productId, 1); } catch {}
    setTimeout(() => setAdding(null), 600);
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <h1 className="text-[20px] font-bold text-brand-dark">Shop</h1>
          </div>
          <button onClick={() => nav("/customer/cart")} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-bg">
            <ShoppingCart size={20} className="text-brand-dark" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-light" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full rounded-xl bg-brand-bg border-0 py-2.5 pl-10 pr-4 text-[14px] text-brand-dark placeholder:text-brand-light outline-none"
            />
          </div>
          <button className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-brand-dark">
            <SlidersHorizontal size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto px-5 mt-4 pb-1 no-scrollbar">
        {cats.map((c, i) => (
          <button
            key={c}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
              active === i ? "bg-brand-dark text-white" : "bg-white text-brand-medium shadow-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {loading ? (
          [1, 2, 3, 4].map(n => (
            <div key={n} className="rounded-2xl bg-white p-3 shadow-soft">
              <div className="h-28 rounded-xl bg-brand-bg shimmer" />
              <div className="mt-3 h-3.5 w-3/4 rounded bg-brand-bg shimmer" />
              <div className="mt-2 h-3 w-1/2 rounded bg-brand-bg shimmer" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-16 text-center">
            <p className="text-brand-light text-[14px]">No products found</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p.id}
              className="rounded-2xl bg-white p-3 shadow-soft"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="h-28 rounded-xl bg-gradient-to-br from-teal-500/5 to-teal-50 flex items-center justify-center">
                <ShoppingCart size={28} className="text-brand-orange/30" />
              </div>
              <h3 className="mt-3 text-[13px] font-bold text-brand-dark truncate">{p.name}</h3>
              <div className="mt-1 flex items-center gap-1">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[11px] font-semibold text-brand-medium">{p.rating}</span>
                <span className="text-[11px] text-brand-light">({p.reviews})</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[15px] font-bold text-brand-dark">₹{p.price}</span>
                  {p.mrp > p.price && (
                    <span className="ml-1.5 text-[11px] text-brand-light line-through">₹{p.mrp}</span>
                  )}
                </div>
                <button onClick={() => handleAddToCart(p.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${adding === p.id ? "bg-brand-green" : "bg-brand-dark"}`}>
                  <Plus size={16} className="text-white" />
                </button>
              </div>
              {p.mrp > p.price && (
                <span className="mt-1 inline-block text-[10px] font-bold text-brand-green">
                  {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
                </span>
              )}
            </motion.div>
          ))
        )}
      </div>

      <BottomNav base="/customer" />
    </div>
  );
}
