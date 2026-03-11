import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Star } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function Breeders() {
  const nav = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("All");

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try { const p = await api.getPets(); setPets(p); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const filtered = pets.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.breed || "").toLowerCase().includes(search.toLowerCase());
    const matchSpecies = species === "All" || p.species === species;
    return matchSearch && matchSpecies;
  });

  const speciesOptions = ["All", ...new Set(pets.map(p => p.species))];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <div>
            <h1 className="text-[20px] font-bold text-brand-dark">Pet Breeders 🐾</h1>
            <p className="text-[12px] text-brand-light">Find your perfect companion</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-light" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Search breed, name..." />
        </div>

        {/* Species Filter */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {speciesOptions.map(s => (
            <button key={s} onClick={() => setSpecies(s)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition-colors ${species === s ? "bg-brand-orange text-white" : "bg-brand-bg text-brand-medium"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-brand-light text-[14px] mt-12">No pets found</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((pet, i) => (
              <motion.div key={pet.id} onClick={() => nav(`/customer/pet/${pet.id}`)}
                className="rounded-2xl bg-white shadow-soft overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div className="h-36 bg-brand-bg overflow-hidden">
                  {pet.image ? (
                    <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {pet.species === "Cat" ? "🐱" : pet.species === "Bird" ? "🐦" : "🐶"}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-[14px] font-bold text-brand-dark truncate">{pet.name}</h3>
                  <p className="text-[11px] text-brand-light mt-0.5">{pet.breed || pet.species} · {pet.age}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[14px] font-bold text-brand-orange">₹{pet.breederPrice || pet.price}</p>
                    {pet.location && (
                      <span className="flex items-center gap-0.5 text-[10px] text-brand-light"><MapPin size={10} />{pet.location}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav base="/customer" activeTab="breeders" />
    </div>
  );
}
