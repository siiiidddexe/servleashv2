import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode, Eye, EyeOff, AlertTriangle, Phone, MapPin, Copy, Check } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

const QR_TOGGLES = [
  { key: "showSpecies", label: "Species" },
  { key: "showBreed", label: "Breed" },
  { key: "showAge", label: "Age" },
  { key: "showGender", label: "Gender" },
  { key: "showColor", label: "Color" },
  { key: "showWeight", label: "Weight" },
  { key: "showOwnerName", label: "Owner Name" },
  { key: "showOwnerPhone", label: "Owner Phone" },
  { key: "showOwnerEmail", label: "Owner Email" },
];

export default function PetQR() {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchPet = useCallback(async () => {
    setLoading(true);
    try {
      const pets = await api.getMyPets();
      const found = pets.find(p => p.id === petId);
      if (found) {
        if (!found.qrToggles) found.qrToggles = {};
        setPet(found);
      }
    } catch { /* */ }
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchPet(); }, [fetchPet]);

  const toggleField = async (key) => {
    const updated = { ...pet.qrToggles, [key]: !pet.qrToggles[key] };
    setPet(prev => ({ ...prev, qrToggles: updated }));
    try { await api.updateMyPet(petId, { qrToggles: updated }); } catch { /* */ }
  };

  const toggleLostMode = async () => {
    const newVal = !pet.lostMode;
    setPet(prev => ({ ...prev, lostMode: newVal }));
    try { await api.updateMyPet(petId, { lostMode: newVal }); } catch { /* */ }
  };

  const qrUrl = `${window.location.origin}/pet-qr/${petId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;
  if (!pet) return <div className="min-h-[100dvh] flex flex-col items-center justify-center"><p className="text-brand-light">Pet not found</p></div>;

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-8">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[18px] font-bold text-brand-dark">QR Pet Tag — {pet.name}</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* QR Display */}
        <motion.div className="rounded-2xl bg-white p-6 shadow-soft flex flex-col items-center"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="h-40 w-40 rounded-2xl bg-brand-bg flex items-center justify-center border-2 border-brand-orange/20">
            <QrCode size={80} className="text-brand-orange" />
          </div>
          <p className="text-[12px] text-brand-light mt-3 text-center">Scan this QR code to view {pet.name}&apos;s public profile</p>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={copyLink} className="flex items-center gap-1.5 rounded-full bg-brand-bg px-4 py-2 text-[12px] font-semibold text-brand-medium active:bg-gray-100">
              {copied ? <><Check size={14} className="text-brand-green" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </button>
          </div>
        </motion.div>

        {/* Lost Mode */}
        <motion.div className={`rounded-2xl p-4 shadow-soft ${pet.lostMode ? "bg-red-50 border border-red-200" : "bg-white"}`}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${pet.lostMode ? "bg-red-100" : "bg-orange-50"}`}>
                <AlertTriangle size={20} className={pet.lostMode ? "text-brand-red" : "text-brand-orange"} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-brand-dark">Lost Mode</h3>
                <p className="text-[11px] text-brand-light">Shows alert & contact info on QR scan</p>
              </div>
            </div>
            <button onClick={toggleLostMode} className={`h-7 w-12 rounded-full transition-colors ${pet.lostMode ? "bg-brand-red" : "bg-gray-200"}`}>
              <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${pet.lostMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </motion.div>

        {/* Toggle Fields */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">Visible on QR Profile</h3>
          <p className="text-[12px] text-brand-light mb-4">Choose what info is shown when someone scans your pet&apos;s QR code</p>
          <div className="space-y-2">
            {QR_TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-brand-bg last:border-0">
                <span className="text-[13px] text-brand-dark font-medium">{label}</span>
                <button onClick={() => toggleField(key)} className={`h-6 w-10 rounded-full transition-colors ${pet.qrToggles[key] ? "bg-brand-green" : "bg-gray-200"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${pet.qrToggles[key] ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
