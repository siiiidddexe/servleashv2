import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, Clock, MapPin, Phone, ChevronRight, Image } from "lucide-react";
import { api } from "../../lib/api";

export default function VendorDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await api.getVendor(id);
        setVendor(v);
        try { const sv = await api.checkSaved(id, "vendor"); setSaved(sv.saved); } catch { /* */ }
      } catch { /* */ }
      setLoading(false);
    })();
  }, [id]);

  const toggleSave = async () => {
    try {
      if (saved) { await api.unsaveItem(id, "vendor"); setSaved(false); }
      else { await api.saveItem(id, "vendor"); setSaved(true); }
    } catch { /* */ }
  };

  if (loading) return <div className="min-h-[100dvh] bg-brand-bg flex items-center justify-center"><span className="spinner" /></div>;
  if (!vendor) return (
    <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-5">
      <p className="text-brand-medium font-semibold">Vendor not found</p>
      <button onClick={() => nav(-1)} className="btn-primary mt-4 px-8">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-28">
      <div className="relative h-56 bg-gradient-to-br from-brand-green/15 to-green-50 flex items-center justify-center">
        <button onClick={() => nav(-1)} className="absolute top-12 left-4 z-10 h-10 w-10 rounded-full bg-white shadow-soft flex items-center justify-center">
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <button onClick={toggleSave} className="absolute top-12 right-4 z-10 h-10 w-10 rounded-full bg-white shadow-soft flex items-center justify-center">
          <Heart size={20} className={saved ? "text-brand-red fill-brand-red" : "text-brand-light"} />
        </button>
        {vendor.image ? <img src={vendor.image} alt={vendor.name} className="h-full w-full object-cover" /> :
          <span className="text-[16px] font-bold text-brand-green/40">{vendor.name}</span>}
      </div>

      <motion.div className="relative -mt-6 rounded-t-3xl bg-white min-h-[40vh] px-5 pt-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <span className="badge-green">{vendor.category}</span>
        <h1 className="text-[22px] font-bold text-brand-dark mt-2">{vendor.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-[14px] font-semibold text-brand-dark">{vendor.rating}</span>
            <span className="text-[12px] text-brand-light">({vendor.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-brand-light" />
            <span className="text-[12px] text-brand-light">{vendor.distance}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-brand-medium">
          <MapPin size={14} />
          <span className="text-[13px]">{vendor.address}, {vendor.city}</span>
        </div>

        {/* Gallery */}
        {vendor.gallery?.length > 0 && (
          <div className="mt-5">
            <h3 className="section-title">Gallery</h3>
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {vendor.gallery.map((img, i) => (
                <div key={i} className="shrink-0 h-24 w-24 rounded-xl overflow-hidden bg-brand-bg">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services offered */}
        <div className="mt-6">
          <h3 className="section-title">Services Offered</h3>
          <div className="mt-3 space-y-2">
            {(vendor.serviceDetails || []).length === 0 ? (
              <p className="text-[13px] text-brand-light py-2">No services listed</p>
            ) : vendor.serviceDetails.map((s) => (
              <button key={s.id} onClick={() => nav(`/customer/service/${s.id}`)}
                className="flex w-full items-center gap-3 rounded-xl bg-brand-bg p-3 text-left active:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-brand-dark">{s.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} className="text-brand-light" />
                    <span className="text-[12px] text-brand-light">{s.duration}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-brand-orange">₹{s.price}</p>
                  <div className="flex items-center gap-0.5 justify-end mt-0.5">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[11px] text-brand-medium">{s.rating}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-brand-border" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-brand-border-light px-5 py-4 flex gap-3">
        <a href={`tel:${vendor.phone}`} className="btn-outline flex items-center justify-center gap-2 w-1/3">
          <Phone size={16} /> Call
        </a>
        <button onClick={() => { if (vendor.serviceDetails?.[0]) nav(`/customer/book?vendorId=${vendor.id}&serviceId=${vendor.serviceDetails[0].id}`); }}
          className="btn-primary flex-1" disabled={!vendor.serviceDetails?.length}>
          Book Service
        </button>
      </div>
    </div>
  );
}
