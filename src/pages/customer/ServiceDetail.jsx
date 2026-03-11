import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, Clock, MapPin, ChevronRight, Truck, Store } from "lucide-react";
import { api } from "../../lib/api";

export default function ServiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [svc, setSvc] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="min-h-[100dvh] bg-brand-bg flex items-center justify-center"><span className="spinner" /></div>;
  if (!svc) return (
    <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-5">
      <p className="text-brand-medium text-[16px] font-semibold">Service not found</p>
      <button onClick={() => nav(-1)} className="btn-primary mt-4 px-8">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-28">
      <div className="relative h-56 bg-gradient-to-br from-brand-orange/15 to-orange-50 flex items-center justify-center">
        <button onClick={() => nav(-1)} className="absolute top-12 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <button onClick={toggleSave} className="absolute top-12 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
          <Heart size={20} className={saved ? "text-brand-red fill-brand-red" : "text-brand-light"} />
        </button>
        {svc.image ? <img src={svc.image} alt={svc.name} className="h-full w-full object-cover" /> : <span className="text-5xl">✨</span>}
      </div>

      <motion.div className="relative -mt-6 rounded-t-3xl bg-white min-h-[40vh] px-5 pt-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <span className="badge-orange">{svc.category}</span>
        <h1 className="text-[22px] font-bold text-brand-dark mt-2">{svc.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-[14px] font-semibold text-brand-dark">{svc.rating}</span>
            <span className="text-[12px] text-brand-light">({svc.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-brand-light" />
            <span className="text-[12px] text-brand-light">{svc.duration}</span>
          </div>
        </div>

        <p className="mt-4 text-[14px] text-brand-medium leading-relaxed">{svc.description}</p>

        {/* Pricing */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-bg p-4">
            <div className="flex items-center gap-2 mb-2"><Store size={16} className="text-brand-green" /><span className="text-[12px] font-bold text-brand-medium">In-Store</span></div>
            <p className="text-[22px] font-bold text-brand-dark">₹{svc.price}</p>
          </div>
          {svc.homePrice && (
            <div className="rounded-xl bg-brand-bg p-4">
              <div className="flex items-center gap-2 mb-2"><Truck size={16} className="text-brand-orange" /><span className="text-[12px] font-bold text-brand-medium">Home Delivery</span></div>
              <p className="text-[22px] font-bold text-brand-dark">₹{svc.homePrice}</p>
            </div>
          )}
        </div>

        {/* Available vendors */}
        <div className="mt-6">
          <h3 className="section-title">Available Vendors</h3>
          <div className="mt-3 space-y-3">
            {vendors.length === 0 ? (
              <p className="text-[13px] text-brand-light text-center py-4">No vendors available for this service</p>
            ) : vendors.map((v) => (
              <button key={v.id} onClick={() => nav(`/customer/vendor/${v.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-brand-bg p-4 text-left active:scale-[0.98] transition-transform">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-white flex items-center justify-center">
                  <span className="text-[11px] font-bold text-brand-orange">{v.name.split(" ")[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-brand-dark truncate">{v.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-[12px] font-semibold text-brand-medium">{v.rating}</span>
                    <span className="text-brand-border">·</span>
                    <span className="text-[12px] text-brand-light">{v.distance}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-brand-border" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-brand-border-light px-5 py-4">
        <button onClick={() => { if (vendors[0]) nav(`/customer/book?serviceId=${svc.id}&vendorId=${vendors[0].id}`); }}
          className="btn-primary w-full" disabled={vendors.length === 0}>
          {vendors.length > 0 ? `Book Now — ₹${svc.price}` : "No Vendors Available"}
        </button>
      </div>
    </div>
  );
}
