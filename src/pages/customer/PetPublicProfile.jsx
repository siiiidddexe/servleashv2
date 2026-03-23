import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Phone, Mail, PawPrint, Heart, Shield } from "lucide-react";

const PLACEHOLDER = "https://cdn.dribbble.com/userupload/3848536/file/original-4f623bccd6f252547abb165cb87a86ae.jpeg?resize=400x400&vertical=center";

export default function PetPublicProfile() {
  const { petId } = useParams();
  const [pet, setPet]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState("");

  useEffect(() => {
    fetch(`/api/pet-qr/${petId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setPet(data);
      })
      .catch(() => setError("Could not load pet profile"))
      .finally(() => setLoading(false));
  }, [petId]);

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-brand-bg">
      <span className="spinner" />
    </div>
  );

  if (error) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-brand-bg px-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <PawPrint size={28} className="text-brand-light" />
      </div>
      <h2 className="text-[17px] font-bold text-brand-dark mb-2">Profile Unavailable</h2>
      <p className="text-[13px] text-brand-light">This QR profile has been disabled or does not exist.</p>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-10">
      {/* Lost Mode Banner */}
      {pet.lostMode && (
        <motion.div
          className="bg-red-500 px-5 py-4 flex items-center gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertTriangle size={22} className="text-white shrink-0" />
          <div>
            <p className="text-[14px] font-extrabold text-white">⚠️ THIS PET IS LOST</p>
            <p className="text-[12px] text-red-100 mt-0.5">Please contact the owner immediately</p>
          </div>
        </motion.div>
      )}

      {/* Pet card */}
      <div className="px-5 pt-6 space-y-4">
        <motion.div className="rounded-3xl bg-white shadow-soft overflow-hidden"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Photo */}
          <div className="relative h-52 bg-brand-bg">
            <img
              src={pet.image ? (pet.image.startsWith("http") ? pet.image : `/api${pet.image}`) : PLACEHOLDER}
              alt={pet.name || "Pet"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <h1 className="text-[26px] font-extrabold text-white leading-tight">{pet.name || "Unknown"}</h1>
              {(pet.breed || pet.species) && (
                <p className="text-[13px] text-white/80 font-medium">{[pet.breed, pet.species].filter(Boolean).join(" • ")}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {pet.age && (
                <div className="rounded-xl bg-brand-bg p-3">
                  <p className="text-[10px] font-bold text-brand-light uppercase tracking-wider">Age</p>
                  <p className="text-[14px] font-bold text-brand-dark mt-0.5">{pet.age}</p>
                </div>
              )}
              {pet.gender && (
                <div className="rounded-xl bg-brand-bg p-3">
                  <p className="text-[10px] font-bold text-brand-light uppercase tracking-wider">Gender</p>
                  <p className="text-[14px] font-bold text-brand-dark mt-0.5">{pet.gender}</p>
                </div>
              )}
              {pet.color && (
                <div className="rounded-xl bg-brand-bg p-3">
                  <p className="text-[10px] font-bold text-brand-light uppercase tracking-wider">Color</p>
                  <p className="text-[14px] font-bold text-brand-dark mt-0.5">{pet.color}</p>
                </div>
              )}
              {pet.weight && (
                <div className="rounded-xl bg-brand-bg p-3">
                  <p className="text-[10px] font-bold text-brand-light uppercase tracking-wider">Weight</p>
                  <p className="text-[14px] font-bold text-brand-dark mt-0.5">{pet.weight}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Owner contact */}
        {(pet.ownerName || pet.ownerPhone || pet.ownerEmail) && (
          <motion.div className="rounded-2xl bg-white shadow-soft p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center">
                <Shield size={14} className="text-brand-orange" />
              </div>
              <h2 className="text-[15px] font-bold text-brand-dark">Owner Contact</h2>
            </div>
            {pet.ownerName && (
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                  <Heart size={14} className="text-brand-orange" />
                </div>
                <div>
                  <p className="text-[11px] text-brand-light">Name</p>
                  <p className="text-[14px] font-semibold text-brand-dark">{pet.ownerName}</p>
                </div>
              </div>
            )}
            {pet.ownerPhone && (
              <a href={`tel:${pet.ownerPhone}`}
                className="flex items-center gap-3 mb-3 rounded-2xl bg-teal-50 px-4 py-3 active:opacity-70">
                <div className="h-9 w-9 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-brand-orange" />
                </div>
                <div>
                  <p className="text-[11px] text-brand-light">Phone</p>
                  <p className="text-[14px] font-bold text-brand-orange">{pet.ownerPhone}</p>
                </div>
              </a>
            )}
            {pet.ownerEmail && (
              <a href={`mailto:${pet.ownerEmail}`}
                className="flex items-center gap-3 rounded-2xl bg-brand-bg px-4 py-3 active:opacity-70">
                <div className="h-9 w-9 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-brand-medium" />
                </div>
                <div>
                  <p className="text-[11px] text-brand-light">Email</p>
                  <p className="text-[14px] font-semibold text-brand-dark">{pet.ownerEmail}</p>
                </div>
              </a>
            )}
          </motion.div>
        )}

        {/* Lost mode emergency message */}
        {pet.emergencyMessage && (
          <motion.div className="rounded-2xl bg-red-50 border border-red-200 p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <p className="text-[13px] text-red-600 font-semibold">{pet.emergencyMessage}</p>
          </motion.div>
        )}

        {/* Powered by */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-brand-light">Powered by <span className="font-bold text-brand-orange">Servleash</span></p>
        </div>
      </div>
    </div>
  );
}
