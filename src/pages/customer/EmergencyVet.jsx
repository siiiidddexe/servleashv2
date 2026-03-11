import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Ambulance, Search, ChevronDown } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function EmergencyVet() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchStates = useCallback(async () => {
    try {
      const s = await api.getEmergencyVetStates();
      setStates(s);
      if (s.length > 0) setSelectedState(s[0]);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchStates(); }, [fetchStates]);

  const fetchVets = useCallback(async () => {
    if (!selectedState) return;
    setLoading(true);
    try { const v = await api.getEmergencyVets(selectedState); setVets(v); } catch { /* */ }
    setLoading(false);
  }, [selectedState]);

  useEffect(() => { fetchVets(); }, [fetchVets]);

  const filtered = vets.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase()) ||
    v.type.toLowerCase().includes(search.toLowerCase())
  );

  const typeIcon = (type) => {
    switch (type) {
      case "ambulance": return "🚑";
      case "shelter": return "🏠";
      default: return "🏥";
    }
  };

  const typeColor = (type) => {
    switch (type) {
      case "ambulance": return "bg-red-50 text-brand-red";
      case "shelter": return "bg-purple-50 text-purple-600";
      default: return "bg-blue-50 text-blue-600";
    }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <div>
            <h1 className="text-[20px] font-bold text-brand-dark">Emergency Vets 🚨</h1>
            <p className="text-[12px] text-brand-light">Find nearby vets, ambulances & shelters</p>
          </div>
        </div>

        {/* State selector */}
        <div className="mt-4 relative">
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
            className="input-field appearance-none pr-10">
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-light pointer-events-none" />
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Search by name, city or type..." />
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <motion.div className="mt-12 flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-brand-light text-[14px]">No results found</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((vet, i) => (
              <motion.div key={vet.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-2xl bg-brand-bg">
                    {typeIcon(vet.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-brand-dark truncate">{vet.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${typeColor(vet.type)}`}>{vet.type}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-brand-light shrink-0" />
                      <p className="text-[12px] text-brand-light truncate">{vet.city}, {vet.state}</p>
                    </div>
                    {vet.address && <p className="text-[11px] text-brand-light mt-0.5 truncate">{vet.address}</p>}
                    {vet.hours && <p className="text-[11px] text-brand-green font-medium mt-0.5">{vet.hours}</p>}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <a href={`tel:${vet.phone}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-green py-2.5 text-[12px] font-bold text-white active:opacity-80">
                    <Phone size={14} /> Call Now
                  </a>
                  {vet.phone2 && (
                    <a href={`tel:${vet.phone2}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-bg py-2.5 text-[12px] font-semibold text-brand-medium active:bg-gray-100">
                      <Phone size={14} /> Alt Number
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav base="/customer" activeTab="emergency" />
    </div>
  );
}
