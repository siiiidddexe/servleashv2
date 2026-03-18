import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, ShoppingCart, Plus, Minus, Check, Package } from "lucide-react";
import { api } from "../../lib/api";

const PLACEHOLDER = "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=2048x1572&vertical=center";
const getImageSrc = (img) => {
  if (!img) return PLACEHOLDER;
  if (img.startsWith("http")) return img;
  return `/api${img}`;
};

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getProduct(id);
        setProduct(p);
        try { const sv = await api.checkSaved(id, "product"); setSaved(sv.saved); } catch {}
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const toggleSave = async () => {
    try {
      if (saved) { await api.unsaveItem(id, "product"); setSaved(false); }
      else { await api.saveItem(id, "product"); setSaved(true); }
    } catch {}
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await api.addToCart(id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {}
    setAdding(false);
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center">
      <span className="spinner" style={{ borderTopColor: "#14B8A6", borderColor: "rgba(20,184,166,0.2)" }} />
    </div>
  );

  if (!product) return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-5">
      <p className="text-brand-medium text-[16px] font-semibold">Product not found</p>
      <button onClick={() => nav(-1)} className="btn-primary mt-4 px-8">Go Back</button>
    </div>
  );

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="min-h-[100dvh] bg-white pb-32">
      {/* Hero image */}
      <div className="relative h-72 bg-gray-100">
        <img src={getImageSrc(product.image)} alt={product.name} className="h-full w-full object-cover" />
        {discount > 0 && (
          <div className="absolute top-14 left-4 rounded-lg bg-green-500 px-2.5 py-1 text-[11px] font-bold text-white">
            {discount}% OFF
          </div>
        )}
        <button onClick={() => nav(-1)} className="absolute top-12 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <button onClick={toggleSave} className="absolute top-12 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <Heart size={20} className={saved ? "text-red-500 fill-red-500" : "text-gray-400"} />
        </button>
        <button onClick={() => nav("/customer/cart")} className="absolute top-12 right-16 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <ShoppingCart size={20} className="text-brand-dark" />
        </button>
      </div>

      {/* Content */}
      <motion.div
        className="relative -mt-6 rounded-t-3xl bg-white px-5 pt-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Category badge */}
        <span className="inline-flex items-center rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-600 uppercase tracking-wide">
          {product.category}
        </span>

        <h1 className="text-[22px] font-extrabold text-brand-dark mt-2 leading-tight">{product.name}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={13} className={s <= Math.round(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
            ))}
          </div>
          <span className="text-[13px] font-bold text-brand-dark">{product.rating}</span>
          <span className="text-[12px] text-gray-400">({product.reviews} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-[28px] font-extrabold text-brand-dark">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="text-[16px] text-gray-400 line-through">₹{product.mrp}</span>
          )}
          {discount > 0 && (
            <span className="text-[13px] font-bold text-green-600">Save ₹{product.mrp - product.price}</span>
          )}
        </div>

        {/* Description */}
        <div className="mt-5">
          <h3 className="text-[15px] font-extrabold text-brand-dark">Description</h3>
          <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">{product.description || "No description available."}</p>
        </div>

        {/* Stock */}
        <div className="mt-4 flex items-center gap-2">
          <Package size={15} className="text-teal-500" />
          <span className="text-[13px] font-medium text-gray-600">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>

        {/* Qty selector */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-[14px] font-bold text-brand-dark">Quantity</span>
          <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-3 py-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm active:scale-95 transition-transform">
              <Minus size={14} className="text-brand-dark" />
            </button>
            <span className="text-[15px] font-bold text-brand-dark w-6 text-center">{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm active:scale-95 transition-transform">
              <Plus size={14} className="text-brand-dark" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4 z-20">
        <div className="flex gap-3">
          <button
            onClick={() => nav("/customer/cart")}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-dark py-3.5 text-[15px] font-bold text-brand-dark active:opacity-70"
          >
            <ShoppingCart size={18} /> View Cart
          </button>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-all ${
              added ? "bg-teal-500" : "bg-brand-dark active:opacity-80"
            } disabled:opacity-50`}
          >
            {added ? <><Check size={18} /> Added!</> : <><Plus size={18} /> Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}
