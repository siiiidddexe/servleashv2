import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, MapPin, Scissors, Stethoscope, ShoppingBag, Dog,
  UtensilsCrossed, Dumbbell, Star, ChevronRight, Clock, Truck,
  Store, ShoppingCart, PawPrint, Play, Pause, ChevronDown, ChevronLeft,
  Video, Heart, Sparkles, X, Check, LocateFixed, Plus, ArrowLeft,
  Home, Briefcase, Users, HeartHandshake,
} from "lucide-react";
import BottomNav from "../../components/BottomNav";

const PLACEHOLDER = "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=2048x1572&vertical=center";

const TOP_TABS = [
  { id: "home_delivery", label: "Home Delivery", icon: Truck, color: "#14B8A6" },
  { id: "in_store", label: "In-Store", icon: Store, color: "#48c78e" },
  { id: "ecommerce", label: "E-Commerce", icon: ShoppingCart, color: "#4285F4" },
  { id: "my_pets", label: "My Pets", icon: PawPrint, color: "#9b59b6" },
];

const CATEGORIES = [
  { icon: Scissors, label: "Grooming", color: "#14B8A6", bg: "#f0fdfa" },
  { icon: Stethoscope, label: "Vet Visit", color: "#0d9488", bg: "#f0fdfa" },
  { icon: Dog, label: "Boarding", color: "#334155", bg: "#f8fafc" },
  { icon: UtensilsCrossed, label: "Meals", color: "#dc2626", bg: "#fef2f2" },
  { icon: Video, label: "Video Consult", color: "#4285F4", bg: "#eff6ff" },
  { icon: Dumbbell, label: "Training", color: "#7c3aed", bg: "#f5f3ff" },
];

const CITIES = [
  "Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Pune",
  "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Kochi", "Chandigarh",
];

export default function CustomerHome() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState("home_delivery");
  const [vendors, setVendors] = useState([]);
  const [services, setServices] = useState([]);
  const [promoMedia, setPromoMedia] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedCity, setSelectedCity] = useState(user?.city || "");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState(null);
  // Location picker state
  const [pickerView, setPickerView] = useState("main"); // "main" | "add"
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [deliveryLabel, setDeliveryLabel] = useState(() => localStorage.getItem("servleash_delivery_label") || "");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [addForm, setAddForm] = useState({ label: "Home", customLabel: "", name: "", flat: "", street: "", landmark: "", city: "", pincode: "", lat: null, lng: null });
  const [savingAddr, setSavingAddr] = useState(false);

  // SSE notification listener for booking accepted events (fetch-based for auth headers)
  useEffect(() => {
    const token = localStorage.getItem("servleash_token");
    if (!token) return;
    let controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/customer/stream", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const evt = JSON.parse(line.slice(6));
                if (evt.type === "booking_accepted") {
                  setToast({ message: evt.message, type: "success" });
                  setTimeout(() => setToast(null), 5000);
                }
              } catch { /* */ }
            }
          }
        }
      } catch { /* aborted or network error */ }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    api.getVendors().then(setVendors).catch(() => {});
    api.getServices().then(setServices).catch(() => {});
    api.getPromo().then(setPromoMedia).catch(() => {});
  }, []);

  // Prompt location if not set
  useEffect(() => {
    if (!user?.city) setShowLocationPicker(true);
  }, [user?.city]);

  // Search with debounce
  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try { const r = await api.search(searchQ); setSearchResults(r); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  // Load saved addresses when picker opens
  useEffect(() => {
    if (showLocationPicker) {
      api.getSavedAddresses().then(setSavedAddresses).catch(() => {});
      setPickerView("main");
      setGpsError("");
    }
  }, [showLocationPicker]);

  const handleCitySelect = useCallback(async (city, label = "", lat = null, lng = null) => {
    setSelectedCity(city);
    const lbl = label || city;
    setDeliveryLabel(lbl);
    localStorage.setItem("servleash_delivery_label", lbl);
    setShowLocationPicker(false);
    try {
      const res = await api.updateProfile({ city });
      if (res.user) {
        const token = localStorage.getItem("servleash_token");
        login(res.user, token);
      }
    } catch {}
  }, [login]);

  const handleGpsLocate = useCallback(async () => {
    if (!navigator.geolocation) { setGpsError("GPS not supported on this device"); return; }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const geo = await resp.json();
          const a = geo.address || {};
          const city = a.city || a.town || a.village || a.county || "";
          const street = [a.road, a.suburb, a.neighbourhood].filter(Boolean).join(", ");
          const pincode = a.postcode || "";
          setAddForm(f => ({ ...f, flat: "", street, city, pincode, lat, lng }));
          setPickerView("add");
        } catch {
          setGpsError("Could not fetch address. Please enter manually.");
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.code === 1 ? "Location permission denied. Please allow access in your browser settings." : "Could not get location. Try again.");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const handleSaveNewAddress = useCallback(async () => {
    const { label, customLabel, name, flat, street, city, pincode, lat, lng } = addForm;
    const finalLabel = label === "Custom" ? customLabel.trim() : label;
    if (!finalLabel || !city) return;
    setSavingAddr(true);
    try {
      const res = await api.saveAddress({ label: finalLabel, name, flat, street, landmark: addForm.landmark, city, pincode, lat, lng });
      setSavedAddresses(prev => [res.address, ...prev]);
      // Auto-select the newly saved address
      handleCitySelect(city, finalLabel, lat, lng);
      setAddForm({ label: "Home", customLabel: "", name: "", flat: "", street: "", landmark: "", city: "", pincode: "", lat: null, lng: null });
      setPickerView("main");
    } catch (e) {
      setGpsError(e.message || "Could not save address");
    }
    setSavingAddr(false);
  }, [addForm, handleCitySelect]);

  const filteredServices = services.filter(s => {
    if (activeTab === "ecommerce" || activeTab === "my_pets") return false;
    const mode = s.serviceMode || "both";
    const modeOk = mode === "both" || (activeTab === "home_delivery" ? mode === "home_delivery" : mode === "in_store");
    const catOk = !selectedCategory || s.category === selectedCategory;
    return modeOk && catOk;
  });

  const bannerPromos = promoMedia.filter(p => (p.slot || "banner") === "banner");
  const dealPromos = promoMedia.filter(p => p.slot === "deal");

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "User").split(" ")[0];
  const displayCity = deliveryLabel || user?.city || selectedCity || "";

  return (
    <div className="min-h-[100dvh] bg-[#f4f4f4] pb-24">

      {/* ══════════ HEADER ══════════ */}
      <div className="bg-brand-dark px-5 pt-12 pb-0">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <button
              className="flex items-center gap-1 mb-0.5"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin size={12} className="text-brand-orange" />
              <span className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">Delivering to</span>
              <ChevronDown size={12} className="text-white/50" />
            </button>
            {displayCity ? (
              <h1 className="text-[20px] font-extrabold text-white leading-tight">{displayCity}</h1>
            ) : (
              <button onClick={() => setShowLocationPicker(true)}
                className="text-[16px] font-bold text-brand-orange leading-tight flex items-center gap-1">
                Set your location <ChevronRight size={14} />
              </button>
            )}
            <p className="text-[12px] text-white/40 mt-0.5">{greeting}, {firstName}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => nav("/customer/appointments")}
              className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white/10">
              <Bell size={18} className="text-white" />
            </button>
            <button onClick={() => nav("/customer/profile")}
              className="h-9 w-9 rounded-full bg-brand-orange/20 border-2 border-brand-orange flex items-center justify-center">
              <span className="text-brand-orange text-[13px] font-extrabold">
                {(user?.name || "U")[0].toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative z-20">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light z-10" />
          <input
            type="text"
            placeholder="Search services, vendors, products..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-[13px] text-brand-dark placeholder:text-brand-light outline-none font-medium shadow-sm"
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(""); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={12} className="text-brand-medium" />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        <AnimatePresence>
          {searchResults && (
            <motion.div
              className="relative z-30 mt-1 rounded-2xl bg-white border border-brand-border-light shadow-elevated max-h-64 overflow-y-auto"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {searchResults.services?.length === 0 && searchResults.vendors?.length === 0 && searchResults.products?.length === 0 && (
                <p className="p-4 text-center text-[13px] text-brand-light">No results found</p>
              )}
              {(searchResults.services || []).slice(0, 3).map(s => (
                <button key={s.id} onClick={() => { setSearchQ(""); setSearchResults(null); nav(`/customer/service/${s.id}`); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-gray-50">
                  <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Scissors size={14} className="text-brand-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-brand-dark truncate">{s.name}</p>
                    <p className="text-[11px] text-brand-light">{s.category} · ₹{s.price}</p>
                  </div>
                  <span className="text-[10px] text-brand-orange font-bold shrink-0">Service</span>
                </button>
              ))}
              {(searchResults.vendors || []).slice(0, 3).map(v => (
                <button key={v.id} onClick={() => { setSearchQ(""); setSearchResults(null); nav(`/customer/vendor/${v.id}`); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-gray-50">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-brand-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-brand-dark truncate">{v.name}</p>
                    <p className="text-[11px] text-brand-light">{v.category} · {v.distance}</p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold shrink-0">Vendor</span>
                </button>
              ))}
              {(searchResults.products || []).slice(0, 3).map(p => (
                <button key={p.id} onClick={() => { setSearchQ(""); setSearchResults(null); nav("/customer/shop"); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors border-b border-gray-50">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <ShoppingBag size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-brand-dark truncate">{p.name}</p>
                    <p className="text-[11px] text-brand-light">{p.category} · ₹{p.price}</p>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold shrink-0">Product</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Top Tabs ══ */}
        <div className="mt-5 flex gap-3 overflow-x-auto no-scrollbar pb-5">
          {TOP_TABS.map((tab, i) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); }}
                className="shrink-0 flex flex-col items-center gap-2"
                whileTap={{ scale: 0.93 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  active ? "bg-brand-orange shadow-teal" : "bg-white/10"
                }`}>
                  <Icon size={22} className={active ? "text-white" : "text-white/60"} />
                </div>
                <span className={`text-[10px] font-bold leading-tight text-center max-w-[60px] ${
                  active ? "text-white" : "text-white/45"
                }`}>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ══════════ PROMO CAROUSEL ══════════ */}
      {bannerPromos.length > 0 && <PromoCarousel items={bannerPromos} />}

      {/* ══════════ TAB CONTENT ══════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {(activeTab === "home_delivery" || activeTab === "in_store") && (
            <ServiceView
              services={filteredServices}
              vendors={vendors}
              activeTab={activeTab}
              nav={nav}
              dealItems={dealPromos}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          )}
          {activeTab === "ecommerce" && <EcomView nav={nav} />}
          {activeTab === "my_pets" && <MyPetsView nav={nav} />}
        </motion.div>
      </AnimatePresence>

      {/* ══════════ LOCATION PICKER MODAL ══════════ */}
      <AnimatePresence>
        {showLocationPicker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => displayCity && setShowLocationPicker(false)} />
            <motion.div
              className="relative w-full max-w-[430px] bg-white rounded-t-3xl overflow-hidden"
              style={{ maxHeight: "88vh" }}
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <AnimatePresence mode="wait">
                {pickerView === "main" ? (
                  <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col" style={{ maxHeight: "88vh" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                      <div>
                        <h3 className="text-[18px] font-extrabold text-brand-dark">Delivering to</h3>
                        <p className="text-[13px] text-brand-light mt-0.5">Pick a saved address or choose your city</p>
                      </div>
                      {displayCity && (
                        <button onClick={() => setShowLocationPicker(false)}
                          className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <X size={16} className="text-brand-medium" />
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1 px-6 pb-10">
                      {/* Saved addresses */}
                      {savedAddresses.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[11px] font-bold text-brand-light uppercase tracking-wider mb-2">Saved Addresses</p>
                          <div className="space-y-2">
                            {savedAddresses.map(addr => {
                              const addrLabel = addr.label || "";
                              const isActive = deliveryLabel === addrLabel && (user?.city || selectedCity) === addr.city;
                              const LabelIcon = addrLabel === "Home" ? Home : addrLabel === "Work" ? Briefcase : addrLabel === "Parents" ? Users : addrLabel === "Partner" ? HeartHandshake : MapPin;
                              return (
                                <button key={addr.id}
                                  onClick={() => handleCitySelect(addr.city, addrLabel, addr.lat, addr.lng)}
                                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all border-2 ${
                                    isActive ? "bg-teal-50 border-brand-orange" : "bg-gray-50 border-transparent"
                                  }`}>
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-brand-orange/10" : "bg-white"}`}>
                                    <LabelIcon size={16} className={isActive ? "text-brand-orange" : "text-brand-medium"} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] font-bold ${isActive ? "text-brand-orange" : "text-brand-dark"}`}>{addrLabel}</p>
                                    <p className="text-[11px] text-brand-light truncate">
                                      {[addr.flat, addr.street, addr.city].filter(Boolean).join(", ")}
                                    </p>
                                  </div>
                                  {isActive && <Check size={16} className="text-brand-orange shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* GPS + Add address buttons */}
                      <div className="flex gap-2.5 mb-5">
                        <button
                          onClick={handleGpsLocate}
                          disabled={gpsLoading}
                          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-orange/10 py-3.5 text-[13px] font-bold text-brand-orange active:opacity-70 disabled:opacity-60"
                        >
                          {gpsLoading
                            ? <><span className="spinner !border-brand-orange !border-t-transparent !h-4 !w-4" /> Locating…</>
                            : <><LocateFixed size={15} /> Use my location</>}
                        </button>
                        <button
                          onClick={() => { setPickerView("add"); setGpsError(""); }}
                          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-100 py-3.5 text-[13px] font-bold text-brand-dark active:opacity-70"
                        >
                          <Plus size={15} /> Add address
                        </button>
                      </div>

                      {gpsError && (
                        <p className="text-[12px] text-red-500 mb-4 bg-red-50 rounded-xl px-3 py-2">{gpsError}</p>
                      )}

                      {/* Divider */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <p className="text-[11px] text-brand-light font-semibold">Or select a city</p>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      {/* City grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {CITIES.map(city => {
                          const isSelected = !deliveryLabel && (user?.city || selectedCity) === city;
                          return (
                            <button key={city} onClick={() => handleCitySelect(city)}
                              className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-left transition-all border-2 ${
                                isSelected ? "bg-teal-50 border-brand-orange" : "bg-gray-50 border-transparent"
                              }`}>
                              <MapPin size={14} className={isSelected ? "text-brand-orange" : "text-brand-light"} />
                              <span className={`text-[13px] font-semibold ${isSelected ? "text-brand-orange" : "text-brand-dark"}`}>{city}</span>
                              {isSelected && <Check size={13} className="text-brand-orange ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="add" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                    className="flex flex-col" style={{ maxHeight: "88vh" }}>
                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
                      <button onClick={() => { setPickerView("main"); setGpsError(""); setAddForm({ label: "Home", customLabel: "", name: "", flat: "", street: "", landmark: "", city: "", pincode: "", lat: null, lng: null }); }}
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <ArrowLeft size={16} className="text-brand-medium" />
                      </button>
                      <div>
                        <h3 className="text-[17px] font-extrabold text-brand-dark">Add delivery address</h3>
                        <p className="text-[12px] text-brand-light mt-0.5">This will be saved for quick checkout</p>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 px-6 pb-10">
                      {/* GPS autofill */}
                      <button onClick={handleGpsLocate} disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-teal-50 border border-teal-200 py-3 mb-5 text-[13px] font-bold text-teal-700 active:opacity-70 disabled:opacity-60">
                        {gpsLoading
                          ? <><span className="spinner !border-teal-600 !border-t-transparent !h-4 !w-4" /> Getting location…</>
                          : <><LocateFixed size={14} /> Autofill with GPS</>}
                      </button>

                      {gpsError && (
                        <p className="text-[12px] text-red-500 mb-4 bg-red-50 rounded-xl px-3 py-2">{gpsError}</p>
                      )}

                      {/* Label chips */}
                      <p className="text-[12px] font-bold text-brand-dark mb-2">Save as</p>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {[
                          { key: "Home", icon: Home },
                          { key: "Work", icon: Briefcase },
                          { key: "Parents", icon: Users },
                          { key: "Partner", icon: HeartHandshake },
                          { key: "Custom", icon: Plus },
                        ].map(({ key, icon: Icon }) => (
                          <button key={key}
                            onClick={() => setAddForm(f => ({ ...f, label: key }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                              addForm.label === key ? "bg-brand-orange text-white border-brand-orange" : "bg-gray-100 text-brand-medium border-transparent"
                            }`}>
                            <Icon size={11} /> {key}
                          </button>
                        ))}
                      </div>
                      {addForm.label === "Custom" && (
                        <input
                          value={addForm.customLabel}
                          onChange={e => setAddForm(f => ({ ...f, customLabel: e.target.value }))}
                          placeholder="e.g. Gym, Hotel…"
                          className="w-full rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-brand-dark outline-none border border-transparent focus:border-brand-orange mb-4"
                        />
                      )}

                      {/* Form fields */}
                      {[
                        { field: "name", label: "Full Name", placeholder: "Your name", type: "text" },
                        { field: "flat", label: "Flat / House No.", placeholder: "e.g. 12B, 3rd floor", type: "text" },
                        { field: "street", label: "Street / Area", placeholder: "e.g. MG Road, Koramangala", type: "text" },
                        { field: "landmark", label: "Landmark (optional)", placeholder: "e.g. Near Metro station", type: "text" },
                      ].map(({ field, label, placeholder, type }) => (
                        <div key={field} className="mb-3">
                          <p className="text-[11px] font-bold text-brand-light uppercase tracking-wider mb-1">{label}</p>
                          <input
                            type={type}
                            value={addForm[field]}
                            onChange={e => setAddForm(f => ({ ...f, [field]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-brand-dark outline-none border border-transparent focus:border-brand-orange"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2.5 mb-3">
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-brand-light uppercase tracking-wider mb-1">City</p>
                          <input value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                            placeholder="City" className="w-full rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-brand-dark outline-none border border-transparent focus:border-brand-orange" />
                        </div>
                        <div className="w-[120px]">
                          <p className="text-[11px] font-bold text-brand-light uppercase tracking-wider mb-1">Pincode</p>
                          <input value={addForm.pincode} onChange={e => setAddForm(f => ({ ...f, pincode: e.target.value }))}
                            placeholder="560001" inputMode="numeric" maxLength={6}
                            className="w-full rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-brand-dark outline-none border border-transparent focus:border-brand-orange" />
                        </div>
                      </div>
                      {addForm.lat && (
                        <div className="flex items-center gap-2 mb-4 rounded-xl bg-teal-50 px-3 py-2.5">
                          <LocateFixed size={13} className="text-teal-600 shrink-0" />
                          <p className="text-[11px] text-teal-700 font-medium">GPS: {addForm.lat.toFixed(4)}, {addForm.lng.toFixed(4)}</p>
                        </div>
                      )}

                      <button
                        onClick={handleSaveNewAddress}
                        disabled={savingAddr || !(addForm.label === "Custom" ? addForm.customLabel.trim() : addForm.label) || !addForm.city}
                        className="w-full rounded-2xl bg-brand-orange text-white text-[14px] font-bold py-4 flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50 mt-2"
                      >
                        {savingAddr ? <><span className="spinner !border-white !border-t-transparent" /> Saving…</> : "Save & Deliver Here"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-6" />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[380px] rounded-2xl bg-brand-dark px-5 py-4 shadow-elevated"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-green/20 flex items-center justify-center shrink-0">
                <Check size={16} className="text-brand-green" />
              </div>
              <p className="text-[13px] font-semibold text-white flex-1">{toast.message}</p>
              <button onClick={() => setToast(null)} className="text-white/50 shrink-0">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div className="relative rounded-2xl overflow-hidden bg-brand-dark h-40 shadow-card">
        {isVideo ? (
          <video src={item.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <img src={item.url || PLACEHOLDER} alt={item.title || "Promo"} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-4">
          {item.title && <p className="text-white font-extrabold text-[16px] leading-tight">{item.title}</p>}
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
          className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/30 flex items-center justify-center">
          {paused ? <Play size={12} className="text-white ml-0.5" /> : <Pause size={12} className="text-white" />}
        </button>
      </div>
    </div>
  );
}

/* ══════════ SERVICE VIEW ══════════ */
function ServiceView({ services, vendors, activeTab, nav, dealItems = [], selectedCategory, setSelectedCategory }) {

  const getImageSrc = (img) => {
    if (!img) return PLACEHOLDER;
    if (img.startsWith("http")) return img;
    return `/api${img}`;
  };

  return (
    <div className="pt-4">
      {/* ── Deal strip ── */}
      {dealItems.length > 0 && <DealCarousel items={dealItems} />}

      {/* ── Category filter chips ── */}
      <div className="mt-5 px-4">
        <h2 className="section-title">Browse by category</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            const active = selectedCategory === c.label;
            return (
              <motion.button
                key={c.label}
                onClick={() => setSelectedCategory(active ? null : c.label)}
                className="shrink-0 flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 + i * 0.03 }}
                whileTap={{ scale: 0.93 }}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
                  active ? "bg-brand-orange shadow-teal" : "shadow-card"
                }`} style={{ background: active ? undefined : c.bg }}>
                  <Icon size={22} style={{ color: active ? "#fff" : c.color }} />
                </div>
                <span className={`text-[10px] font-bold text-center ${active ? "text-brand-orange" : "text-brand-medium"}`}>
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Services ── */}
      <div className="mt-6">
        <div className="px-4 flex items-center justify-between">
          <h2 className="section-title">
            {selectedCategory ? selectedCategory : "Popular Services"}
          </h2>
          <span className="text-[12px] text-brand-light font-semibold">{services.length} available</span>
        </div>

        {services.length === 0 ? (
          <div className="mt-6 px-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Scissors size={24} className="text-gray-300" />
            </div>
            <p className="text-[14px] font-semibold text-brand-medium">No services found</p>
            <p className="text-[12px] text-brand-light mt-1">Try a different category or delivery mode</p>
          </div>
        ) : activeTab === "home_delivery" ? (
          /* ── 2×2 Grid for Home Delivery ── */
          <div className="mt-3 px-4 grid grid-cols-2 gap-3">
            {services.map((svc, i) => (
              <motion.div
                key={svc.id}
                className="rounded-2xl overflow-hidden bg-white shadow-card cursor-pointer active:scale-[0.97] transition-transform"
                onClick={() => nav(`/customer/service/${svc.id}`)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              >
                <div className="h-28 relative overflow-hidden">
                  <img src={getImageSrc(svc.image)} alt={svc.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>
                <div className="px-3 py-2.5">
                  <h3 className="text-[13px] font-bold text-brand-dark leading-tight line-clamp-2">{svc.name}</h3>
                  <p className="text-[11px] text-brand-light mt-0.5">{svc.duration}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* ── Horizontal scroll for In-Store ── */
          <div className="mt-3 px-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {services.slice(0, 8).map((svc, i) => (
              <motion.div
                key={svc.id}
                className="shrink-0 w-40 rounded-2xl bg-white shadow-card overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                onClick={() => nav(`/customer/service/${svc.id}`)}
                initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              >
                <div className="h-24 relative overflow-hidden">
                  <img src={getImageSrc(svc.image)} alt={svc.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur rounded-lg px-2 py-0.5">
                    <span className="text-[12px] font-extrabold text-brand-dark">₹{svc.price}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="text-[12px] font-bold text-brand-dark truncate">{svc.name}</h3>
                  <p className="text-[10px] text-brand-light mt-0.5">{svc.duration} · {svc.category}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-bold text-brand-medium">{svc.rating}</span>
                    <span className="text-[9px] text-brand-light">({svc.reviews})</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Vendors near you (In-Store only) ── */}
      {activeTab === "in_store" && (
        <div className="mt-7 px-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Visit In-Store</h2>
            <span className="text-[12px] text-brand-light font-semibold">{vendors.length} vendors</span>
          </div>
          <div className="mt-3 space-y-3">
            {vendors.length === 0 ? (
              [1, 2].map(n => (
                <div key={n} className="rounded-2xl bg-white shadow-card overflow-hidden">
                  <div className="h-36 w-full shimmer" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 rounded-lg shimmer" />
                    <div className="h-3 w-1/2 rounded-lg shimmer" />
                  </div>
                </div>
              ))
            ) : (
              vendors.map((v, i) => (
                <motion.div
                  key={v.id}
                  className="rounded-2xl bg-white shadow-card overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => nav(`/customer/vendor/${v.id}`)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}
                >
                  <div className="h-36 relative overflow-hidden">
                    <img src={v.image || PLACEHOLDER} alt={v.name} className="h-full w-full object-cover" />
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur rounded-lg px-2 py-1">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-brand-dark text-[11px] font-extrabold">{v.rating}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-brand-orange rounded-lg px-2.5 py-1">
                      <span className="text-[10px] font-bold text-white">{v.category}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5">
                      <h3 className="text-white font-extrabold text-[15px]">{v.name}</h3>
                      <p className="text-white/70 text-[11px]">{v.address}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[12px] text-brand-medium font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-brand-light" />
                        {v.serviceDetails?.[0]?.duration || "30 min"}
                      </span>
                      <span className="text-brand-border">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-brand-light" />
                        {v.distance}
                      </span>
                      <span className="text-brand-border">·</span>
                      <span className="text-[11px] text-brand-light">{v.reviews} reviews</span>
                    </div>
                    <ChevronRight size={16} className="text-brand-border shrink-0" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════ ECOM VIEW ══════════ */
function EcomView({ nav }) {
  const cats = [
    { label: "Food & Treats", emoji: "🦴", bg: "bg-gradient-to-br from-teal-50 to-emerald-50", accent: "#14B8A6" },
    { label: "Toys", emoji: "🧸", bg: "bg-gradient-to-br from-rose-50 to-pink-50", accent: "#f43f5e" },
    { label: "Health & Hygiene", emoji: "💊", bg: "bg-gradient-to-br from-emerald-50 to-green-50", accent: "#10b981" },
    { label: "Accessories", emoji: "🎀", bg: "bg-gradient-to-br from-violet-50 to-purple-50", accent: "#8b5cf6" },
  ];

  return (
    <div className="pt-4 px-4">
      <div className="h-32 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-700 p-5 flex flex-col justify-end shadow-card overflow-hidden relative">
        <img src={PLACEHOLDER} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Pet Store</p>
          <h2 className="text-white text-[18px] font-extrabold mt-1 leading-tight">Shop food, toys & accessories</h2>
          <p className="text-white/60 text-[11px] mt-1">Free delivery on orders above ₹499</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {cats.map((cat, i) => (
          <motion.button
            key={cat.label}
            className={`rounded-2xl ${cat.bg} p-5 text-left shadow-card active:scale-[0.97] transition-transform`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 + i * 0.04 }}
            onClick={() => nav("/customer/shop")}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <p className="mt-2 text-[13px] font-extrabold" style={{ color: cat.accent }}>{cat.label}</p>
            <p className="text-[11px] text-brand-light mt-0.5">Shop now →</p>
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={() => nav("/customer/shop")}
        className="mt-4 w-full rounded-2xl bg-brand-dark py-3.5 text-center text-[14px] font-bold text-white shadow-card active:scale-[0.98] transition-transform"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      >
        <ShoppingBag size={16} className="inline mr-2 -mt-0.5" />
        Browse All Products
      </motion.button>
    </div>
  );
}

/* ══════════ MY PETS VIEW ══════════ */
function MyPetsView({ nav }) {
  const [pets, setPets] = useState([]);
  useEffect(() => { api.getMyPets().then(setPets).catch(() => {}); }, []);

  const quickActions = [
    { label: "Pet-O-Gram", desc: "Share pet moments", icon: Heart, color: "#f43f5e", bg: "bg-rose-50", path: "/customer/petogram" },
    { label: "Emergency Vet", desc: "Find help fast", icon: Stethoscope, color: "#dc2626", bg: "bg-red-50", path: "/customer/emergency-vet" },
    { label: "Lost & Found", desc: "Recovery network", icon: Sparkles, color: "#f59e0b", bg: "bg-amber-50", path: "/customer/lost-found" },
    { label: "Celebrations", desc: "Pet parties", icon: PawPrint, color: "#7c3aed", bg: "bg-violet-50", path: "/customer/celebrations" },
  ];

  return (
    <div className="pt-4 px-4">
      {/* My Pets */}
      <div className="flex items-center justify-between">
        <h2 className="section-title">My Pets</h2>
        <button onClick={() => nav("/customer/my-pets")} className="text-[12px] font-bold text-brand-orange">Manage →</button>
      </div>

      {pets.length === 0 ? (
        <motion.button
          onClick={() => nav("/customer/my-pets")}
          className="mt-3 w-full rounded-2xl bg-white shadow-card p-5 text-center active:scale-[0.98] transition-transform"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center mb-2">
            <PawPrint size={24} className="text-brand-orange" />
          </div>
          <p className="text-[14px] font-bold text-brand-dark">Add your first pet</p>
          <p className="text-[12px] text-brand-light mt-0.5">Get personalised care recommendations</p>
        </motion.button>
      ) : (
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {pets.map((pet, i) => (
            <motion.button
              key={pet.id}
              onClick={() => nav("/customer/my-pets")}
              className="shrink-0 w-28 rounded-2xl bg-white shadow-card p-3 text-center active:scale-[0.97] transition-transform"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            >
              <div className="mx-auto h-12 w-12 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center">
                {pet.image ? (
                  <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
                ) : (
                  <PawPrint size={20} className="text-brand-orange" />
                )}
              </div>
              <p className="mt-1.5 text-[12px] font-bold text-brand-dark truncate">{pet.name}</p>
              <p className="text-[10px] text-brand-light">{pet.species}</p>
            </motion.button>
          ))}
          <motion.button
            onClick={() => nav("/customer/my-pets")}
            className="shrink-0 w-28 rounded-2xl bg-white shadow-card p-3 text-center border-2 border-dashed border-brand-border active:scale-[0.97] transition-transform flex flex-col items-center justify-center"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pets.length * 0.05 }}
          >
            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
              <span className="text-2xl text-brand-light">+</span>
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-brand-light">Add Pet</p>
          </motion.button>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="section-title mt-7">Quick Actions</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {quickActions.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={() => nav(item.path)}
              className="rounded-2xl bg-white shadow-card p-4 text-left active:scale-[0.97] transition-transform"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
            >
              <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <p className="mt-2 text-[13px] font-bold text-brand-dark">{item.label}</p>
              <p className="text-[10px] text-brand-light mt-0.5">{item.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════ DEAL CAROUSEL ══════════ */
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
      <div className="relative rounded-2xl overflow-hidden h-24 bg-brand-dark shadow-card">
        {item.type === "video" ? (
          <video key={item.url} src={item.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <img src={item.url || PLACEHOLDER} alt={item.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          {item.title && <p className="text-white font-extrabold text-[18px] leading-tight">{item.title}</p>}
          {item.subtitle && <p className="text-white/70 text-[11px] font-semibold mt-0.5">{item.subtitle}</p>}
        </div>
        {items.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + items.length) % items.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/30 flex items-center justify-center">
              <ChevronLeft size={12} className="text-white" />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % items.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/30 flex items-center justify-center">
              <ChevronRight size={12} className="text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
