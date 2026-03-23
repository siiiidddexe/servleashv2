import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Copy, Check, Download, ToggleLeft, ToggleRight } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

const QR_TOGGLES = [
  { key: "showName",       label: "Pet Name" },
  { key: "showPhoto",      label: "Pet Photo" },
  { key: "showBreed",      label: "Breed & Species" },
  { key: "showAge",        label: "Age" },
  { key: "showGender",     label: "Gender" },
  { key: "showColor",      label: "Color / Markings" },
  { key: "showWeight",     label: "Weight" },
  { key: "showOwnerName",  label: "Owner Name" },
  { key: "showOwnerPhone", label: "Owner Phone" },
  { key: "showOwnerEmail", label: "Owner Email" },
];

export default function PetQR() {
  const { petId } = useParams();
  const [pet, setPet]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]  = useState(false);

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

  const toggleQrEnabled = async () => {
    const newVal = !pet.qrEnabled;
    setPet(prev => ({ ...prev, qrEnabled: newVal }));
    try { await api.updateMyPet(petId, { qrEnabled: newVal }); } catch { /* */ }
  };

  const qrUrl = `${window.location.origin}/pet-qr/${petId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById("pet-qr-svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${pet.name || "pet"}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
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

        {/* QR enabled toggle */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="text-[14px] font-bold text-brand-dark">QR Profile Active</p>
            <p className="text-[12px] text-brand-light mt-0.5">Allow this QR code to show pet info</p>
          </div>
          <button onClick={toggleQrEnabled}
            className={`h-7 w-12 rounded-full transition-colors ${pet.qrEnabled ? "bg-brand-green" : "bg-gray-200"}`}>
            <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${pet.qrEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </motion.div>

        {/* QR Code */}
        <motion.div className="rounded-2xl bg-white p-6 shadow-soft flex flex-col items-center"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <div className={`p-4 rounded-2xl border-2 ${pet.qrEnabled ? "border-brand-orange/30 bg-white" : "border-gray-200 bg-gray-50 opacity-50"}`}>
            <QRCodeSVG
              id="pet-qr-svg"
              value={qrUrl}
              size={160}
              level="H"
              includeMargin={false}
              fgColor="#1a1a2e"
              bgColor="transparent"
            />
          </div>
          {!pet.qrEnabled && (
            <p className="text-[12px] text-brand-light mt-3 text-center">Enable QR Profile above so the link works when scanned</p>
          )}
          <p className="text-[11px] text-brand-light mt-3 text-center break-all px-2">{qrUrl}</p>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={copyLink}
              className="flex items-center gap-1.5 rounded-full bg-brand-bg px-4 py-2 text-[12px] font-semibold text-brand-medium active:bg-gray-100">
              {copied ? <><Check size={14} className="text-brand-green" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </button>
            <button onClick={downloadQR}
              className="flex items-center gap-1.5 rounded-full bg-brand-bg px-4 py-2 text-[12px] font-semibold text-brand-medium active:bg-gray-100">
              <Download size={14} /> Download
            </button>
          </div>
        </motion.div>

        {/* Lost Mode */}
        <motion.div className={`rounded-2xl p-4 shadow-soft ${pet.lostMode ? "bg-red-50 border border-red-200" : "bg-white"}`}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${pet.lostMode ? "bg-red-100" : "bg-teal-50"}`}>
                <AlertTriangle size={20} className={pet.lostMode ? "text-brand-red" : "text-brand-orange"} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-brand-dark">Lost Mode</h3>
                <p className="text-[11px] text-brand-light">Shows alert + contact info when scanned</p>
              </div>
            </div>
            <button onClick={toggleLostMode}
              className={`h-7 w-12 rounded-full transition-colors ${pet.lostMode ? "bg-brand-red" : "bg-gray-200"}`}>
              <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${pet.lostMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {pet.lostMode && (
            <p className="mt-3 text-[12px] text-red-600 bg-red-100 rounded-xl px-3 py-2">
              Owner contact details are always shown when Lost Mode is active, even if hidden below.
            </p>
          )}
        </motion.div>

        {/* Toggle Fields */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-1">Visible on QR Profile</h3>
          <p className="text-[12px] text-brand-light mb-4">Choose what info is shown when someone scans</p>
          <div className="space-y-0.5">
            {QR_TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-brand-bg last:border-0">
                <span className="text-[13px] text-brand-dark font-medium">{label}</span>
                <button onClick={() => toggleField(key)}
                  className={`h-6 w-10 rounded-full transition-colors ${pet.qrToggles[key] ? "bg-brand-green" : "bg-gray-200"}`}>
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
