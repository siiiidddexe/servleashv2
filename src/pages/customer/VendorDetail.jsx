import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Star, Clock, MapPin, Phone, ChevronRight, Store, Truck, CheckCircle, X } from "lucide-react";
import { api } from "../../lib/api";

const PLACEHOLDER = "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=2048x1572&vertical=center";

export default function VendorDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBookSheet, setShowBookSheet] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedMode, setSelectedMode] = useState("in_store");

  useEffect(() => {
    (async () => {
      try {
        const v = await api.getVendor(id);
        setVendor(v);
        try { const sv = await api.checkSaved(id, "vendor"); setSaved(sv.saved); } catch {}
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const toggleSave = async () => {
    try {
      if (saved) { await api.unsaveItem(id, "vendor"); setSaved(false); }
      else { await api.saveItem(id, "vendor"); setSaved(true); }
    } catch {}
  };

  const handleBook = () => {
    const services = vendor?.serviceDetails || [];
    if (services.length === 1) {
      setSelectedService(services[0]);
    }
    setShowBookSheet(true);
  };

  const confirmBook = () => {
    if (!selectedService) return;
    nav(`/customer/book?vendorId=${vendor.id}&serviceId=${selectedService.id}&mode=${selectedMode}`);
  };

  const price = selectedService
    ? (selectedMode === "home_delivery" && selectedService.homePrice ? selectedService.homePrice : selectedService.price)
    : 0;

  if (loading) return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center">
      <span className="spinner" style={{ borderTopColor: "#14B8A6", borderColor: "rgba(20,184,166,0.2)" }} />
    </div>
  );

  if (!vendor) return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-5">
      <p className="text-brand-medium font-semibold">Vendor not found</p>
      <button onClick={() => nav(-1)} className="btn-primary mt-4 px-8">Go Back</button>
    </div>
  );

  const services = vendor.serviceDetails || [];

  return (
    <div className="min-h-[100dvh] bg-white pb-28">
      {/* Hero */}
      <div className="relative h-60 bg-gray-100">
        <img src={vendor.image || PLACEHOLDER} alt={vendor.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        <button onClick={() => nav(-1)} className="absolute top-12 left-4 z-10 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <button onClick={toggleSave} className="absolute top-12 right-4 z-10 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
          <Heart size={20} className={saved ? "text-red-500 fill-red-500" : "text-gray-400"} />
        </button>
        {/* Vendor name overlay */}
        <div className="absolute bottom-4 left-5 right-5">
          <span className="inline-flex items-center rounded-lg bg-white/20 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wide">{vendor.category}</span>
          <h1 className="text-[22px] font-extrabold text-white mt-1.5 drop-shadow-sm">{vendor.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[13px] font-bold text-white">{vendor.rating}</span>
              <span className="text-[11px] text-white/70">({vendor.reviews})</span>
            </div>
            <span className="text-white/30">·</span>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-white/70" />
              <span className="text-[11px] text-white/80">{vendor.distance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div className="relative -mt-4 rounded-t-3xl bg-white" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {/* Address */}
        <div className="px-5 pt-5">
          <div className="flex items-start gap-2.5 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-brand-dark">{vendor.address}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">{vendor.city}</p>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {vendor.gallery?.length > 0 && (
          <div className="mt-5 px-5">
            <h3 className="text-[15px] font-extrabold text-brand-dark">Gallery</h3>
            <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar">
              {vendor.gallery.map((img, i) => (
                <div key={i} className="shrink-0 h-24 w-24 rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="mt-5 px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-brand-dark">Services Offered</h3>
            <span className="text-[12px] font-semibold text-gray-400">{services.length} service{services.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {services.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-6 text-center">
                <p className="text-[13px] text-gray-400 font-medium">No services listed yet</p>
              </div>
            ) : services.map((s) => (
              <button key={s.id} onClick={() => nav(`/customer/service/${s.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-3.5 text-left active:scale-[0.98] transition-all border border-gray-100">
                <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-white">
                  <img src={s.image || PLACEHOLDER} alt={s.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-brand-dark truncate">{s.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={11} className="text-gray-400" />
                    <span className="text-[11px] text-gray-400">{s.duration}</span>
                    <span className="text-gray-200">·</span>
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[11px] text-gray-500 font-medium">{s.rating}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-extrabold text-brand-dark">₹{s.price}</p>
                  {s.homePrice && <p className="text-[10px] text-gray-400 mt-0.5">Home: ₹{s.homePrice}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-5 py-4 flex gap-3 z-20">
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} className="btn-outline flex items-center justify-center gap-2 w-[30%]">
            <Phone size={16} /> Call
          </a>
        )}
        <button onClick={handleBook} className={`btn-primary flex-1 ${!vendor.phone ? 'w-full' : ''}`} disabled={services.length === 0}>
          {services.length > 0 ? "Book Service" : "No Services"}
        </button>
      </div>

      {/* ── Book bottom sheet ── */}
      <AnimatePresence>
        {showBookSheet && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookSheet(false)} />
            <motion.div
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-[17px] font-extrabold text-brand-dark">Book at {vendor.name}</h3>
                <button onClick={() => setShowBookSheet(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Service selection */}
              {services.length > 1 && (
                <div className="px-5 mt-2">
                  <p className="text-[13px] font-bold text-gray-500 mb-2">Choose a service</p>
                  <div className="space-y-2">
                    {services.map((s) => (
                      <button key={s.id} onClick={() => setSelectedService(s)}
                        className={`w-full flex items-center gap-3 rounded-2xl p-3.5 transition-all border-2 ${
                          selectedService?.id === s.id ? "bg-teal-50 border-teal-400" : "bg-gray-50 border-transparent"
                        }`}>
                        <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden">
                          <img src={s.image || PLACEHOLDER} alt={s.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-[13px] font-bold text-brand-dark truncate">{s.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={10} className="text-gray-400" />
                            <span className="text-[11px] text-gray-500">{s.duration} · ₹{s.price}</span>
                          </div>
                        </div>
                        {selectedService?.id === s.id && <CheckCircle size={18} className="text-teal-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode selection */}
              <div className="px-5 mt-4">
                <p className="text-[13px] font-bold text-gray-500 mb-2">Service mode</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => setSelectedMode("in_store")}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all border-2 ${
                      selectedMode === "in_store" ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-transparent"
                    }`}>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      selectedMode === "in_store" ? "bg-blue-500" : "bg-gray-200"
                    }`}>
                      <Store size={18} className={selectedMode === "in_store" ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-bold text-brand-dark">At Salon</p>
                      {selectedService && <p className="text-[16px] font-extrabold text-brand-dark mt-0.5">₹{selectedService.price}</p>}
                    </div>
                  </button>
                  <button onClick={() => setSelectedMode("home_delivery")}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all border-2 ${
                      selectedMode === "home_delivery" ? "bg-teal-50 border-teal-400" : "bg-gray-50 border-transparent"
                    }`}>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      selectedMode === "home_delivery" ? "bg-teal-500" : "bg-gray-200"
                    }`}>
                      <Truck size={18} className={selectedMode === "home_delivery" ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-bold text-brand-dark">Home Visit</p>
                      {selectedService && <p className="text-[16px] font-extrabold text-brand-dark mt-0.5">₹{selectedService.homePrice || selectedService.price}</p>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="px-5 pt-5 pb-8">
                <button onClick={confirmBook} disabled={!selectedService}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {selectedService ? `Continue — ₹${price}` : "Select a service"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
