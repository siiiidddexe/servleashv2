import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MapPin, Calendar, Phone, Scale, Palette, Clock } from "lucide-react";
import { api } from "../../lib/api";

export default function PetDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getPet(id);
        setPet(p);
        try { const s = await api.checkSaved(id, "pet"); setSaved(s.saved); } catch {}
      } catch { setPet(null); }
      setLoading(false);
    })();
  }, [id]);

  const toggleSave = async () => {
    try {
      if (saved) { await api.unsaveItem(id, "pet"); setSaved(false); }
      else { await api.saveItem(id, "pet"); setSaved(true); }
    } catch {}
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-brand-bg flex items-center justify-center">
      <span className="spinner" />
    </div>
  );

  if (!pet) return (
    <div className="min-h-[100dvh] bg-brand-bg flex flex-col items-center justify-center px-5">
      <p className="text-brand-medium text-[16px] font-semibold">Pet not found</p>
      <button onClick={() => nav(-1)} className="btn-primary mt-4 px-8">Go Back</button>
    </div>
  );

  const stats = [
    { label: "Weight", value: pet.weight, icon: Scale },
    { label: "Age", value: pet.age, icon: Clock },
    { label: "Color", value: pet.color, icon: Palette },
  ];

  return (
    <div className="min-h-[100dvh] bg-brand-bg">
      {/* Image area */}
      <div className="relative h-72 bg-gradient-to-br from-brand-orange/10 to-brand-bg flex items-center justify-center">
        <button onClick={() => nav(-1)} className="absolute top-12 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
          <ArrowLeft size={20} className="text-brand-dark" />
        </button>
        <button onClick={toggleSave} className="absolute top-12 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft">
          <Heart size={20} className={saved ? "text-brand-red fill-brand-red" : "text-brand-light"} />
        </button>
        <div className="text-center">
          <p className="text-[40px]">{pet.species === "Cat" ? "��" : "🐶"}</p>
          <p className="text-brand-light text-[12px] font-medium mt-2">{pet.breed}</p>
        </div>
      </div>

      {/* Content card */}
      <motion.div className="relative -mt-6 rounded-t-3xl bg-white min-h-[50vh] px-5 pt-6 pb-28" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-brand-dark">{pet.name}</h1>
            <p className="text-[14px] text-brand-medium mt-1">{pet.breed} &bull; {pet.gender}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${pet.available ? "bg-green-50 text-brand-green" : "bg-red-50 text-brand-red"}`}>
            {pet.available ? "Available" : "Adopted"}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-3 text-brand-light">
          <MapPin size={14} />
          <span className="text-[13px]">{pet.location}</span>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-brand-bg p-3 text-center">
                <Icon size={16} className="text-brand-orange mx-auto mb-1" />
                <p className="text-[11px] text-brand-light font-medium">{s.label}</p>
                <p className="text-[15px] font-bold text-brand-dark mt-0.5">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* About */}
        <div className="mt-6">
          <h3 className="section-title">About</h3>
          <p className="mt-2 text-[14px] text-brand-medium leading-relaxed">{pet.description}</p>
        </div>

        {/* Owner info */}
        {pet.owner && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-bg p-4">
            <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
              <span className="text-[18px] font-bold text-brand-orange">{pet.owner.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-brand-dark">{pet.owner.name}</p>
              <p className="text-[12px] text-brand-light mt-0.5">Pet Owner</p>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${pet.owner.phone}`} className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-soft">
                <Phone size={16} className="text-brand-orange" />
              </a>
              <button className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-soft">
                <Calendar size={16} className="text-brand-orange" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-brand-border-light px-5 py-4">
        <button className="btn-primary w-full" disabled={!pet.available}>
          {pet.available ? "Book Visit" : "Not Available"}
        </button>
      </div>
    </div>
  );
}
