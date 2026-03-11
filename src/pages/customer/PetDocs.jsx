import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Trash2, X, Eye } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

const DOC_TYPES = ["Vaccination Record", "Medical History", "Prescription", "Lab Report", "Insurance", "License", "Adoption Papers", "Other"];

export default function PetDocs() {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);

  const fetchPet = useCallback(async () => {
    setLoading(true);
    try {
      const pets = await api.getMyPets();
      setPet(pets.find(p => p.id === petId) || null);
    } catch { /* */ }
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchPet(); }, [fetchPet]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadPetDocument(petId, file, docType);
      setShowUpload(false);
      fetchPet();
    } catch { /* */ }
    setUploading(false);
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.deletePetDocument(petId, docId);
      fetchPet();
    } catch { /* */ }
  };

  const docs = pet?.documents || [];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-8">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <div>
              <h1 className="text-[18px] font-bold text-brand-dark">Pet Documents</h1>
              {pet && <p className="text-[12px] text-brand-light">{pet.name} · {docs.length}/10 docs</p>}
            </div>
          </div>
          {docs.length < 10 && (
            <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-[13px] font-bold text-white">
              <Upload size={14} /> Upload
            </button>
          )}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : !pet ? (
          <p className="text-center mt-12 text-brand-light">Pet not found</p>
        ) : docs.length === 0 ? (
          <motion.div className="mt-16 flex flex-col items-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText size={36} className="text-blue-500" />
            </div>
            <h2 className="text-[16px] font-bold text-brand-dark mt-5">No documents yet</h2>
            <p className="text-[13px] text-brand-light mt-2 text-center max-w-[240px]">Upload vaccination records, prescriptions, and more</p>
            <button onClick={() => setShowUpload(true)} className="btn-primary mt-5 px-8">Upload First Document</button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc, i) => (
              <motion.div key={doc.id} className="rounded-2xl bg-white p-4 shadow-soft flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText size={20} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-brand-dark truncate">{doc.filename}</h3>
                  <p className="text-[11px] text-brand-light">{doc.type} · {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center"><Eye size={14} className="text-brand-medium" /></a>
                <button onClick={() => handleDeleteDoc(doc.id)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={14} className="text-brand-red" /></button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpload(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">Upload Document</h2>
                <button onClick={() => setShowUpload(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Document Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)} className="input-field">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <label className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-orange/30 p-6 cursor-pointer active:bg-brand-orange/5 transition-colors">
                  <Upload size={28} className="text-brand-orange" />
                  <span className="text-[14px] font-semibold text-brand-dark">{uploading ? "Uploading..." : "Tap to select file"}</span>
                  <span className="text-[12px] text-brand-light">PDF, JPG, PNG up to 5MB</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
