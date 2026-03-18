import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Star, Clock, MapPin, ChevronRight, Truck, Store, CheckCircle, X } from "lucide-react";
import { api } from "../../lib/api";

const PLACEHOLDER = "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=2048x1572&vertical=center";

export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [svc, setSvc] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBookSheet, setShowBookSheet] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getService(id);
        setSvc(s);
        const v = await api.getVendors(s.category);
        setVendors(v.filter(vv => vv.services?.includes(id)));
        try { const sv = await api.checkSaved(id, "service"); setSaved(sv.saved); } catch {}
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const toggleSave = async () => {
    try {
      if (saved) { await api.unsaveItem(id, "service"); setSaved(false); }
      else { await api.saveItem(id, "service"); setSaved(true); }
    } catch {}
  };

  // Home delivery: skip vendor selection, system assigns whoever is available
  const handleBookHome = () => {
    nav(`/customer/book?serviceId=${svc.id}&mode=home_delivery`);
  };

  // In-store: if multiple vendors, show picker sheet; if one, go straight to booking
  const handleBookInStore = () => {
    if (vendors.length === 0) {
      nav(`/customer/book?serviceId=${svc.id}&mode=in_store`);
      return;
    }
    if (vendors.length === 1) {
      nav(`/customer/book?serviceId=${svc.id}&vendorId=${vendors[0].id}&mode=in_store`);
      return;
    }
    setSelectedVendor(null);
    setShowBookSheet(true);
  };

  const confirmBook = () => {
    if (!selectedVendor) return;
    nav(`/customer/book?serviceId=${svc.id}&vendorId=${selectedVendor.id}&mode=in_store`);
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center">
      <span className="spinner" style={{ borderTopColor: "#14B8A6", borderColor: "rgba(20,184,166,0.2)" }} />
    </div>
  );

  if (!svc) return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-5">
      <p className="text-brand-medium text-[16px] font-semibold">Service not found</p>
      <button onClick={() => nav(-1)} className="btn-primary mt-4 px-8">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-white pb-28">
      {/* Hero image */}
      <div className="relative h-60 bg-gray-100">
        <img src={svc.image || PLACEHOLDER} alt={svc.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <button onClick={() => nav(-1)} className="absolute top-12 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <button onClick={toggleSave} className="absolute top-12 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <Heart size={20} className={saved ? "text-red-500 fill-red-500" : "text-gray-400"} />
        </button>
      </div>

      {/* Content card */}
      <motion.div className="relative -mt-6 rounded-t-3xl bg-white min-h-[40vh]" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="px-5 pt-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-600 uppercase tracking-wide">{svc.category}</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-brand-dark mt-2 leading-tight">{svc.name}</h1>
          <div className="flex items-center gap-4 mt-2.5">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[14px] font-bold text-brand-dark">{svc.rating}</span>
              <span className="text-[12px] text-gray-400">({svc.reviews})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" />
              <span className="text-[12px] text-gray-500 font-medium">{svc.duration}</span>
            </div>
          </div>

          <p className="mt-4 text-[14px] text-gray-500 leading-relaxed">{svc.description}</p>

          {/* Pricing cards */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Store size={14} className="text-blue-600" />
                </div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">In-Store</span>
              </div>
              <p className="text-[24px] font-extrabold text-brand-dark">₹{svc.price}</p>
            </div>
            {svc.homePrice && (
              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Truck size={14} className="text-teal-600" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Home Visit</span>
                </div>
                <p className="text-[24px] font-extrabold text-brand-dark">₹{svc.homePrice}</p>
              </div>
            )}
          </div>

          {/* Vendors list */}
          <div className="mt-6">
            <h3 className="text-[16px] font-extrabold text-brand-dark">Available Providers</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""} near you</p>
            <div className="mt-3 space-y-2.5">
              {vendors.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-6 text-center">
                  <p className="text-[13px] text-gray-400 font-medium">No vendors available for this service yet</p>
                </div>
              ) : vendors.map((v) => (
                <button key={v.id} onClick={() => nav(`/customer/vendor/${v.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-3.5 text-left active:scale-[0.98] transition-all border border-gray-100">
                  <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-white">
                    <img src={v.image || PLACEHOLDER} alt={v.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-brand-dark truncate">{v.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[12px] font-semibold text-gray-600">{v.rating}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[12px] text-gray-400">{v.distance}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-5 py-4 z-20">
        {svc.homePrice ? (
          <div className="flex gap-3">
            <button onClick={handleBookHome}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-teal-50 border-2 border-teal-400 py-3 active:opacity-80">
              <div className="flex items-center gap-1.5">
                <Truck size={14} className="text-teal-600" />
                <span className="text-[13px] font-bold text-teal-700">Home Visit</span>
              </div>
              <span className="text-[16px] font-extrabold text-teal-700">₹{svc.homePrice}</span>
            </button>
            <button onClick={handleBookInStore}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-brand-dark py-3 active:opacity-80">
              <div className="flex items-center gap-1.5">
                <Store size={14} className="text-white" />
                <span className="text-[13px] font-bold text-white">At Salon</span>
              </div>
              <span className="text-[16px] font-extrabold text-white">₹{svc.price}</span>
            </button>
          </div>
        ) : (
          <button onClick={handleBookInStore} className="btn-primary w-full flex items-center justify-center gap-2">
            <Store size={15} /> Book at Salon — ₹{svc.price}
          </button>
        )}
      </div>

      {/* ── Book bottom sheet ── */}
      <AnimatePresence>
        {showBookSheet && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookSheet(false)} />
            <motion.div
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-[17px] font-extrabold text-brand-dark">Choose a Store</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Pick where you'd like to visit</p>
                </div>
                <button onClick={() => setShowBookSheet(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Vendor selection */}
              <div className="px-5 mt-2 pb-2">
                <div className="space-y-2">
                  {vendors.map((v) => (
                    <button key={v.id} onClick={() => setSelectedVendor(v)}
                      className={`w-full flex items-center gap-3 rounded-2xl p-3.5 transition-all border-2 ${
                        selectedVendor?.id === v.id ? "bg-teal-50 border-teal-400" : "bg-gray-50 border-transparent"
                      }`}>
                      <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-white">
                        <img src={v.image || PLACEHOLDER} alt={v.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="text-[14px] font-bold text-brand-dark truncate">{v.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[12px] text-gray-500 font-semibold">{v.rating}</span>
                          <span className="text-gray-300">·</span>
                          <MapPin size={11} className="text-gray-400" />
                          <span className="text-[12px] text-gray-400">{v.city || v.address}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[15px] font-extrabold text-brand-dark">₹{svc.price}</p>
                        {selectedVendor?.id === v.id && <CheckCircle size={16} className="text-teal-500 ml-auto mt-1" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm */}
              <div className="px-5 pt-3 pb-8">
                <button onClick={confirmBook} disabled={!selectedVendor}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  Book at {selectedVendor?.name || "Selected Store"} — ₹{svc.price}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
