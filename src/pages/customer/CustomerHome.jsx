import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, MapPin, Scissors, Stethoscope, ShoppingBag, Dog,
  UtensilsCrossed, Dumbbell, Star, ChevronRight, Clock, Truck,
  Store, ShoppingCart, PawPrint, Play, Pause,
} from "lucide-react";
import BottomNav from "../../components/BottomNav";

/* ── Top-level tabs (Swiggy-style) ── */
const TOP_TABS = [
  { id: "home_delivery", label: "Home Delivery", icon: Truck, color: "#FC8019", desc: "At your doorstep" },
  { id: "in_store", label: "In-Store", icon: Store, color: "#48c78e", desc: "Visit & book" },
  { id: "ecommerce", label: "E-Commerce", icon: ShoppingCart, color: "#4285F4", desc: "Shop pet products" },
  { id: "my_pets", label: "My Pets", icon: PawPrint, color: "#9b59b6", desc: "Manage your pets" },
];

/* ── Category icons (used for in_store / home_delivery views) ── */
const FALLBACK_CATEGORIES = [
  { icon: Scissors, label: "Grooming", color: "#FC8019" },
  { icon: Stethoscope, label: "Vet Visit", color: "#48c78e" },
  { icon: Dog, label: "Boarding", color: "#686b78" },
  { icon: UtensilsCrossed, label: "Meals", color: "#e53e3e" },
  { icon: ShoppingBag, label: "Shop", color: "#4285F4" },
  { icon: Dumbbell, label: "Training", color: "#9b59b6" },
];

export default function CustomerHome() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState("home_delivery");
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [promoMedia, setPromoMedia] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    api.getVendors().then(setVendors).catch(() => {});
    api.getServices().then(setServices).catch(() => {});
    api.getPromo().then(setPromoMedia).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try { const r = await api.search(searchQ); setSearchResults(r); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  /* Filter services by tab mode */
  const filteredServices = services.filter(s => {
    if (activeTab === "ecommerce" || activeTab === "my_pets") return false;
    const mode = s.serviceMode || "both";
    if (mode === "both") return true;
    if (activeTab === "home_delivery") return mode === "home_delivery";
    return mode === "in_store";
  });

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      {/* ── Header ── */}
      <div className="bg-white px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-brand-light font-medium">{greeting}</p>
            <h1 className="text-[20px] font-bold text-brand-dark">{user?.name || "User"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[12px] text-brand-medium bg-brand-bg rounded-full px-3 py-1.5">
              <MapPin size={13} />
              <span className="font-semibold">{user?.city || "Bangalore"}</span>
            </div>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-bg">
              <Bell size={20} className="text-brand-dark" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-orange" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Tabs (Swiggy-style) ── */}
      <div className="bg-white px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TOP_TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 min-w-[88px] transition-all ${
                  active ? "bg-brand-orange/10 ring-2 ring-brand-orange" : "bg-brand-bg"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-brand-orange" : "bg-white"}`}>
                  <Icon size={20} className={active ? "text-white" : "text-brand-medium"} />
                </div>
                <span className={`text-[11px] font-bold leading-tight text-center ${active ? "text-brand-orange" : "text-brand-medium"}`}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="bg-white px-5 pb-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light" />
          <input type="text" placeholder="Search services, vendors, products..." value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full rounded-xl bg-brand-bg border-0 py-3 pl-11 pr-4 text-[14px] text-brand-dark placeholder:text-brand-light outline-none" />
        </div>

        {/* Search dropdown */}
        {searchResults && (
          <motion.div className="mt-2 rounded-xl bg-white border border-brand-border-light shadow-lg max-h-64 overflow-y-auto" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            {searchResults.services?.length === 0 && searchResults.vendors?.length === 0 && searchResults.products?.length === 0 && (
              <p className="p-4 text-center text-[13px] text-brand-light">No results found</p>
            )}
            {(searchResults.services || []).slice(0, 3).map(s => (
              <button key={s.id} onClick={() => { setSearchQ(""); setSearchResults(null); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-brand-bg">
                <Scissors size={16} className="text-brand-orange shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark truncate">{s.name}</p>
                  <p className="text-[12px] text-brand-light">{s.category} · ₹{s.price}</p>
                </div>
              </button>
            ))}
            {(searchResults.vendors || []).slice(0, 3).map(v => (
              <button key={v.id} onClick={() => { setSearchQ(""); setSearchResults(null); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-brand-bg">
                <MapPin size={16} className="text-brand-green shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark truncate">{v.name}</p>
                  <p className="text-[12px] text-brand-light">{v.category} · {v.distance}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Promo Video/Photo Widget ── */}
      {promoMedia.length > 0 && <PromoCarousel items={promoMedia} />}

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {(activeTab === "home_delivery" || activeTab === "in_store") && (
            <ServiceView services={filteredServices} vendors={vendors} activeTab={activeTab} nav={nav} />
          )}
          {activeTab === "ecommerce" && <EcomView nav={nav} />}
          {activeTab === "my_pets" && <MyPetsView nav={nav} />}
        </motion.div>
      </AnimatePresence>

      <div className="h-8" />
      <BottomNav base="/customer" activeTab={activeTab} />
    </div>
  );
}

/* ── Promo Carousel ── */
function PromoCarousel({ items }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [paused, items.length]);

  const item = items[idx];
  const isVideo = item?.type === "video";

  return (
    <div className="px-5 mt-3 mb-2">
      <div className="relative rounded-2xl overflow-hidden bg-brand-dark h-40">
        {isVideo ? (
          <video src={item.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <img src={item.url} alt={item.title || "Promo"} className="h-full w-full object-cover" />
        )}
        {/* Overlay text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
          {item.title && <p className="text-white font-bold text-[15px]">{item.title}</p>}
          {item.subtitle && <p className="text-white/80 text-[12px]">{item.subtitle}</p>}
        </div>
        {/* Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        )}
        {/* Pause/play */}
        <button onClick={() => setPaused(!paused)} className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center">
          {paused ? <Play size={14} className="text-white" /> : <Pause size={14} className="text-white" />}
        </button>
      </div>
    </div>
  );
}

/* ── Service / Booking View (Home Delivery & In-Store) ── */
function ServiceView({ services, vendors, activeTab, nav }) {
  return (
    <>
      {/* Offer banner */}
      <motion.div className="mx-5 mt-3 h-28 rounded-2xl bg-gradient-to-r from-brand-orange to-orange-400 p-4 flex flex-col justify-end cursor-pointer"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">
          {activeTab === "home_delivery" ? "Doorstep Service" : "Visit In-Store"}
        </p>
        <h2 className="text-white text-lg font-extrabold mt-0.5">
          {activeTab === "home_delivery" ? "Book grooming at home — 50% off" : "Walk-in to top-rated salons near you"}
        </h2>
      </motion.div>

      {/* Service icons grid */}
      <div className="px-5 mt-5">
        <h2 className="section-title">Services</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {FALLBACK_CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            const matchCount = services.filter(s => s.category === c.label).length;
            return (
              <motion.button key={c.label}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-soft active:scale-[0.97] transition-transform"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: c.color + "12" }}>
                  <Icon size={22} style={{ color: c.color }} />
                </div>
                <span className="text-[12px] font-semibold text-brand-dark">{c.label}</span>
                {matchCount > 0 && <span className="text-[10px] text-brand-light -mt-1">{matchCount} available</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Popular services row */}
      {services.length > 0 && (
        <div className="px-5 mt-6">
          <h2 className="section-title">Popular Services</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {services.slice(0, 6).map((svc, i) => (
              <motion.div key={svc.id} className="shrink-0 w-44 rounded-2xl bg-white p-3 shadow-soft cursor-pointer active:scale-[0.97] transition-transform"
                onClick={() => nav(`/customer/service/${svc.id}`)}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <div className="h-20 rounded-xl bg-gradient-to-br from-brand-orange/10 to-orange-50 flex items-center justify-center overflow-hidden">
                  {svc.icon ? (
                    <img src={svc.icon} alt={svc.name} className="h-full w-full object-cover" />
                  ) : (
                    <Scissors size={24} className="text-brand-orange/50" />
                  )}
                </div>
                <h3 className="mt-2.5 text-[13px] font-bold text-brand-dark truncate">{svc.name}</h3>
                <p className="text-[11px] text-brand-light mt-0.5">{svc.category} · {svc.duration}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[15px] font-bold text-brand-orange">₹{svc.price}</span>
                  <div className="flex items-center gap-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-[11px] font-semibold text-brand-medium">{svc.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Vendors near you */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Near You</h2>
          <button className="text-[13px] font-bold text-brand-orange">See all</button>
        </div>
        <div className="mt-3 space-y-3">
          {vendors.length === 0 ? (
            [1, 2].map(n => (
              <div key={n} className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft">
                <div className="h-20 w-20 shrink-0 rounded-xl bg-brand-bg shimmer" />
                <div className="flex-1 py-1">
                  <div className="h-3.5 w-3/4 rounded bg-brand-bg shimmer" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-brand-bg shimmer" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-brand-bg shimmer" />
                </div>
              </div>
            ))
          ) : vendors.map((v, i) => (
            <motion.div key={v.id}
              className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => nav(`/customer/vendor/${v.id}`)}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <div className="h-20 w-20 shrink-0 rounded-xl bg-gradient-to-br from-brand-orange/8 to-orange-50 flex items-center justify-center">
                <span className="text-[11px] font-bold text-brand-orange/40 text-center px-1">{v.name.split(" ")[0]}</span>
              </div>
              <div className="flex-1 py-0.5 min-w-0">
                <h3 className="text-[15px] font-bold text-brand-dark truncate">{v.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-brand-light">{v.category}</span>
                  <span className="text-brand-border">·</span>
                  <span className="text-[12px] text-brand-light">{v.distance}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-0.5">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-[12px] font-semibold text-brand-dark">{v.rating}</span>
                    <span className="text-[11px] text-brand-light">({v.reviews})</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Clock size={11} className="text-brand-light" />
                    <span className="text-[11px] text-brand-light">{v.serviceDetails?.[0]?.duration || "30 min"}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-brand-border self-center shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── E-Commerce View ── */
function EcomView({ nav }) {
  return (
    <div className="px-5 mt-4">
      <motion.div className="h-32 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-400 p-5 flex flex-col justify-end"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">Pet Store</p>
        <h2 className="text-white text-lg font-extrabold mt-0.5">Shop food, toys & accessories</h2>
        <p className="text-white/80 text-[13px] mt-0.5">Free delivery on orders above ₹499</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: "Food & Treats", emoji: "🦴", bg: "from-amber-50 to-orange-50" },
          { label: "Toys", emoji: "🧸", bg: "from-pink-50 to-rose-50" },
          { label: "Health", emoji: "💊", bg: "from-green-50 to-emerald-50" },
          { label: "Accessories", emoji: "🎀", bg: "from-purple-50 to-violet-50" },
        ].map((cat, i) => (
          <motion.button key={cat.label}
            className={`rounded-2xl bg-gradient-to-br ${cat.bg} p-5 text-center shadow-soft active:scale-[0.97] transition-transform`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
            onClick={() => nav("/customer/shop")}>
            <span className="text-3xl">{cat.emoji}</span>
            <p className="mt-2 text-[13px] font-bold text-brand-dark">{cat.label}</p>
          </motion.button>
        ))}
      </div>

      <motion.p className="mt-8 text-center text-[14px] text-brand-light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        Full shop coming soon — stay tuned! 🐾
      </motion.p>
    </div>
  );
}

/* ── My Pets View ── */
function MyPetsView({ nav }) {
  return (
    <div className="px-5 mt-4">
      <motion.div className="rounded-2xl bg-gradient-to-r from-purple-500 to-violet-400 p-5 flex flex-col justify-end h-32"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">My Pets</p>
        <h2 className="text-white text-lg font-extrabold mt-0.5">Manage your furry family</h2>
        <p className="text-white/80 text-[13px] mt-0.5">Health records, QR tags & more</p>
      </motion.div>

      <div className="mt-6 space-y-3">
        {[
          { label: "Add a Pet", desc: "Register a new pet profile", icon: PawPrint, path: "/customer/my-pets" },
          { label: "Health Records", desc: "Vaccination & medical history", icon: Stethoscope, path: "/customer/my-pets" },
          { label: "QR Tag", desc: "Lost pet? Generate a QR tag", icon: Dog, path: "/customer/my-pets" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button key={item.label} onClick={() => nav(item.path)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-soft text-left active:scale-[0.98] transition-transform"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                <Icon size={22} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-brand-dark">{item.label}</h3>
                <p className="text-[12px] text-brand-light mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={18} className="text-brand-border shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
