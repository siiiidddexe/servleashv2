import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, MapPin, Scissors, Stethoscope, ShoppingBag, Dog,
  UtensilsCrossed, Dumbbell, Star, ChevronRight, Clock, Truck,
  Store, ShoppingCart, PawPrint, Play, Pause, ChevronDown, Mic, ChevronLeft,
} from "lucide-react";
import BottomNav from "../../components/BottomNav";

/* ── Top-level tabs ── */
const TOP_TABS = [
  { id: "home_delivery", label: "Home Delivery", icon: Truck, color: "#14B8A6" },
  { id: "in_store", label: "In-Store", icon: Store, color: "#48c78e" },
  { id: "ecommerce", label: "E-Commerce", icon: ShoppingCart, color: "#4285F4" },
  { id: "my_pets", label: "My Pets", icon: PawPrint, color: "#9b59b6" },
];

const FALLBACK_CATEGORIES = [
  { icon: Scissors, label: "Grooming", color: "#14B8A6", bg: "#14B8A615" },
  { icon: Stethoscope, label: "Vet Visit", color: "#48c78e", bg: "#48c78e15" },
  { icon: Dog, label: "Boarding", color: "#334155", bg: "#33415515" },
  { icon: UtensilsCrossed, label: "Meals", color: "#e53e3e", bg: "#e53e3e15" },
  { icon: ShoppingBag, label: "Shop", color: "#4285F4", bg: "#4285F415" },
  { icon: Dumbbell, label: "Training", color: "#9b59b6", bg: "#9b59b615" },
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
  const [searchFocused, setSearchFocused] = useState(false);

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

  const filteredServices = services.filter(s => {
    if (activeTab === "ecommerce" || activeTab === "my_pets") return false;
    const mode = s.serviceMode || "both";
    if (mode === "both") return true;
    if (activeTab === "home_delivery") return mode === "home_delivery";
    return mode === "in_store";
  });

  const bannerPromos = promoMedia.filter(p => (p.slot || "banner") === "banner");
  const dealPromos   = promoMedia.filter(p => p.slot === "deal");

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "User").split(" ")[0];

  return (
    <div className="min-h-[100dvh] bg-[#f4f4f4] pb-24">

      {/* ══════════ HEADER ══════════ */}
      <div className="bg-brand-dark px-5 pt-12 pb-0">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <button className="flex items-center gap-1 mb-0.5">
              <MapPin size={12} className="text-brand-orange" />
              <span className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">Delivering to</span>
              <ChevronDown size={12} className="text-white/50" />
            </button>
            <h1 className="text-[20px] font-extrabold text-white leading-tight">
              {user?.city || "Bangalore"}
            </h1>
            <p className="text-[12px] text-white/40 mt-0.5">{greeting}, {firstName}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white/10">
              <Bell size={18} className="text-white" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-orange" />
            </button>
            <div className="h-9 w-9 rounded-full bg-brand-orange/20 border-2 border-brand-orange flex items-center justify-center">
              <span className="text-brand-orange text-[13px] font-extrabold">
                {(user?.name || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light z-10" />
          <input
            type="text"
            placeholder="Search services, vendors, products..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            className="w-full rounded-2xl bg-white py-3 pl-11 pr-12 text-[13px] text-brand-dark placeholder:text-brand-light outline-none font-medium shadow-sm"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-xl bg-brand-orange flex items-center justify-center">
            <Mic size={13} className="text-white" />
          </button>
        </div>

        {/* Search dropdown */}
        <AnimatePresence>
          {searchResults && (
            <motion.div
              className="mt-1 rounded-2xl bg-white border border-brand-border-light shadow-elevated max-h-56 overflow-y-auto"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {searchResults.services?.length === 0 && searchResults.vendors?.length === 0 && searchResults.products?.length === 0 && (
                <p className="p-4 text-center text-[13px] text-brand-light">No results found</p>
              )}
              {(searchResults.services || []).slice(0, 3).map(s => (
                <button key={s.id} onClick={() => { setSearchQ(""); setSearchResults(null); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-gray-50">
                  <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Scissors size={14} className="text-brand-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-brand-dark truncate">{s.name}</p>
                    <p className="text-[11px] text-brand-light">{s.category} · ₹{s.price}</p>
                  </div>
                </button>
              ))}
              {(searchResults.vendors || []).slice(0, 3).map(v => (
                <button key={v.id} onClick={() => { setSearchQ(""); setSearchResults(null); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-gray-50">
                  <div className="h-8 w-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-brand-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-brand-dark truncate">{v.name}</p>
                    <p className="text-[11px] text-brand-light">{v.category} · {v.distance}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Category Tabs ══ */}
        <div className="mt-5 flex gap-4 overflow-x-auto no-scrollbar pb-5">
          {TOP_TABS.map((tab, i) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 flex flex-col items-center gap-2"
                whileTap={{ scale: 0.93 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className={`h-[60px] w-[60px] rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  active
                    ? "bg-brand-orange shadow-lg shadow-brand-orange/40"
                    : "bg-white/10"
                }`}>
                  <Icon size={24} className={active ? "text-white" : "text-white/60"} />
                </div>
                <span className={`text-[10px] font-bold leading-tight text-center max-w-[60px] ${
                  active ? "text-white" : "text-white/45"
                }`}>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══════════ PROMO CAROUSEL (banner slot) ══════════ */}
      {bannerPromos.length > 0 && <PromoCarousel items={bannerPromos} />}

      {/* ══════════ TAB CONTENT ══════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {(activeTab === "home_delivery" || activeTab === "in_store") && (
            <ServiceView services={filteredServices} vendors={vendors} activeTab={activeTab} nav={nav} dealItems={dealPromos} />
          )}
          {activeTab === "ecommerce" && <EcomView nav={nav} />}
          {activeTab === "my_pets" && <MyPetsView nav={nav} />}
        </motion.div>
      </AnimatePresence>

      <div className="h-6" />
      <BottomNav base="/customer" activeTab={activeTab} />
    </div>
  );
}

/* ══════════ PROMO CAROUSEL ══════════ */
function PromoCarousel({ items }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const item = items[idx];
  const isVideo = item?.type === "video";

  return (
    <div className="px-4 mt-4">
      <div className="relative rounded-3xl overflow-hidden bg-brand-dark h-44 shadow-elevated">
        {isVideo ? (
          <video src={item.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <img src={item.url} alt={item.title || "Promo"} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-4">
          {item.title && <p className="text-white font-extrabold text-[17px] leading-tight">{item.title}</p>}
          {item.subtitle && <p className="text-white/70 text-[12px] mt-0.5">{item.subtitle}</p>}
        </div>
        {items.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        )}
        <button onClick={() => setPaused(!paused)}
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/35 flex items-center justify-center">
          {paused ? <Play size={13} className="text-white ml-0.5" /> : <Pause size={13} className="text-white" />}
        </button>
      </div>
    </div>
  );
}

/* ══════════ SERVICE VIEW ══════════ */
function ServiceView({ services, vendors, activeTab, nav, dealItems = [] }) {
  return (
    <div className="pt-4">

      {/* ── Deal strip carousel ── */}
      <DealCarousel items={dealItems} />

      {/* ── Category icons (circular, horizontal scroll) ── */}
      <div className="mt-6 px-4">
        <SectionHeader title="What are you looking for?" />
        <div className="mt-3 flex gap-5 overflow-x-auto no-scrollbar pb-1">
          {FALLBACK_CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.button
                key={c.label}
                className="shrink-0 flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
                whileTap={{ scale: 0.93 }}
              >
                <div className="h-[60px] w-[60px] rounded-full flex items-center justify-center shadow-card"
                  style={{ background: c.bg }}>
                  <Icon size={26} style={{ color: c.color }} />
                </div>
                <span className="text-[11px] font-bold text-brand-medium text-center">{c.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Popular services ── */}
      {services.length > 0 && (
        <div className="mt-7">
          <div className="px-4">
            <SectionHeader title="Popular Services" action="See all" />
          </div>
          <div className="mt-3 px-4 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {services.slice(0, 6).map((svc, i) => (
              <motion.div
                key={svc.id}
                className="shrink-0 w-44 rounded-2xl bg-white shadow-card overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                onClick={() => nav(`/customer/service/${svc.id}`)}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05 }}
              >
                <div className="h-28 bg-gradient-to-br from-teal-50 to-teal-100 relative flex items-center justify-center overflow-hidden">
                  {svc.icon
                    ? <img src={svc.icon} alt={svc.name} className="h-full w-full object-cover" />
                    : <Scissors size={30} className="text-teal-300" />
                  }
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur rounded-lg px-2 py-0.5 shadow-sm">
                    <span className="text-[13px] font-extrabold text-brand-dark">₹{svc.price}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-[13px] font-bold text-brand-dark truncate">{svc.name}</h3>
                  <p className="text-[11px] text-brand-light mt-0.5">{svc.duration}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center gap-0.5 bg-green-500 rounded-md px-1.5 py-0.5">
                      <Star size={9} className="text-white fill-white" />
                      <span className="text-white text-[10px] font-extrabold">{svc.rating}</span>
                    </div>
                    <span className="text-[10px] text-brand-light">{svc.category}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Vendors near you ── */}
      <div className="mt-7 px-4">
        <SectionHeader
          title={activeTab === "home_delivery" ? "Top Rated Near You" : "Salons Near You"}
          action="See all"
        />
        <div className="mt-3 space-y-4">
          {vendors.length === 0
            ? [1, 2].map(n => (
                <div key={n} className="rounded-2xl bg-white shadow-card overflow-hidden">
                  <div className="h-40 w-full shimmer" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg shimmer" />
                    <div className="h-3 w-1/2 rounded-lg shimmer" />
                  </div>
                </div>
              ))
            : vendors.map((v, i) => (
                <motion.div
                  key={v.id}
                  className="rounded-2xl bg-white shadow-card overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => nav(`/customer/vendor/${v.id}`)}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }}
                >
                  {/* Image area */}
                  <div className="h-44 relative bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center overflow-hidden">
                    <span className="text-[32px] font-black text-brand-dark/8 select-none px-4 text-center">{v.name}</span>
                    {/* Rating badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 rounded-lg px-2 py-1 shadow-sm">
                      <Star size={10} className="text-white fill-white" />
                      <span className="text-white text-[11px] font-extrabold">{v.rating}</span>
                    </div>
                    {/* Category badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2.5 py-1">
                      <span className="text-[11px] font-bold text-brand-dark">{v.category}</span>
                    </div>
                    {/* Name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 pb-2.5">
                      <h3 className="text-white font-extrabold text-[15px]">{v.name}</h3>
                    </div>
                  </div>
                  {/* Info row */}
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-brand-light" />
                        <span className="text-[12px] text-brand-medium font-semibold">
                          {v.serviceDetails?.[0]?.duration || "30 min"}
                        </span>
                      </div>
                      <span className="text-brand-border text-sm">·</span>
                      <span className="text-[12px] text-brand-medium font-semibold">{v.distance}</span>
                      <span className="text-brand-border text-sm">·</span>
                      <span className="text-[11px] text-brand-light">({v.reviews} reviews)</span>
                    </div>
                    <ChevronRight size={16} className="text-brand-border shrink-0" />
                  </div>
                </motion.div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

/* ══════════ ECOM VIEW ══════════ */
function EcomView({ nav }) {
  const cats = [
    { label: "Food & Treats", emoji: "🦴", gradient: "from-teal-500/10 to-teal-50", accent: "#14B8A6" },
    { label: "Toys", emoji: "🧸", gradient: "from-pink-100 to-rose-50", accent: "#f43f5e" },
    { label: "Health", emoji: "💊", gradient: "from-green-50 to-emerald-100", accent: "#10b981" },
    { label: "Accessories", emoji: "🎀", gradient: "from-purple-50 to-violet-100", accent: "#8b5cf6" },
  ];

  return (
    <div className="pt-4 px-4">
      {/* Banner */}
      <motion.div
        className="h-36 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-400 p-5 flex flex-col justify-end shadow-elevated"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Pet Store</p>
        <h2 className="text-white text-[20px] font-extrabold mt-1 leading-tight">Shop food, toys & accessories</h2>
        <p className="text-white/70 text-[12px] mt-1">Free delivery on orders above ₹499</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {cats.map((cat, i) => (
          <motion.button
            key={cat.label}
            className={`rounded-2xl bg-gradient-to-br ${cat.gradient} p-5 text-left shadow-soft active:scale-[0.97] transition-transform`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
            onClick={() => nav("/customer/shop")}
          >
            <span className="text-3xl">{cat.emoji}</span>
            <p className="mt-2 text-[14px] font-extrabold" style={{ color: cat.accent }}>{cat.label}</p>
            <p className="text-[11px] text-brand-light mt-0.5">Shop now →</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ══════════ MY PETS VIEW ══════════ */
function MyPetsView({ nav }) {
  const items = [
    { label: "Add a Pet", desc: "Register a new pet profile", icon: PawPrint, color: "#9b59b6", bg: "bg-purple-50", path: "/customer/my-pets" },
    { label: "Health Records", desc: "Vaccination & medical history", icon: Stethoscope, color: "#14B8A6", bg: "bg-teal-50", path: "/customer/my-pets" },
    { label: "QR Tag", desc: "Lost pet? Generate a QR tag", icon: Dog, color: "#334155", bg: "bg-slate-100", path: "/customer/my-pets" },
  ];

  return (
    <div className="pt-4 px-4">
      <motion.div
        className="h-36 rounded-3xl bg-gradient-to-r from-violet-600 to-purple-400 p-5 flex flex-col justify-end shadow-elevated"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">My Pets</p>
        <h2 className="text-white text-[20px] font-extrabold mt-1 leading-tight">Manage your furry family</h2>
        <p className="text-white/70 text-[12px] mt-1">Health records, QR tags & more</p>
      </motion.div>

      <div className="mt-5 space-y-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={() => nav(item.path)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-card text-left active:scale-[0.98] transition-transform"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
            >
              <div className={`h-12 w-12 shrink-0 rounded-2xl ${item.bg} flex items-center justify-center`}>
                <Icon size={22} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-extrabold text-brand-dark">{item.label}</h3>
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

/* ══════════ DEAL CAROUSEL (video/image, admin-managed) ══════════ */
function DealCarousel({ items }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;

  const item = items[idx];

  return (
    <div className="px-4 mb-2">
      <div className="relative rounded-2xl overflow-hidden h-[110px] bg-brand-dark shadow-card">
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            className="h-full w-full object-cover"
            autoPlay loop muted playsInline
          />
        ) : (
          <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

        {/* Text */}
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          {item.title && (
            <p className="text-white font-extrabold text-[24px] leading-tight">{item.title}</p>
          )}
          {item.subtitle && (
            <p className="text-white/70 text-[12px] font-semibold mt-0.5">{item.subtitle}</p>
          )}
        </div>

        {/* Prev / Next arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + items.length) % items.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/30 flex items-center justify-center">
              <ChevronLeft size={14} className="text-white" />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % items.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/30 flex items-center justify-center">
              <ChevronRight size={14} className="text-white" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section header with optional "See all" ── */
function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] font-bold text-brand-orange">{action}</button>
      )}
    </div>
  );
}
