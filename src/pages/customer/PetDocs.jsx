import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Trash2, X, Eye, FilePlus, FileImage,
  File, FileVideo, AlertCircle, CheckCircle2, Loader2, Plus,
} from "lucide-react";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

const DOC_TYPES = [
  "Vaccination Record", "Medical History", "Prescription",
  "Lab Report", "Insurance", "License", "Adoption Papers", "X-Ray / Scan", "Other",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOCS = 10;

function fileIcon(name = "", mime = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "bmp", "svg"].includes(ext) || mime.startsWith("image/"))
    return { Icon: FileImage, color: "text-blue-500", bg: "bg-blue-50" };
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext) || mime.startsWith("video/"))
    return { Icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50" };
  if (ext === "pdf" || mime === "application/pdf")
    return { Icon: FileText, color: "text-red-500", bg: "bg-red-50" };
  if (["doc", "docx"].includes(ext))
    return { Icon: FileText, color: "text-blue-600", bg: "bg-blue-50" };
  return { Icon: File, color: "text-slate-500", bg: "bg-slate-100" };
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PetDocs() {
  const { petId } = useParams();
  const [pet, setPet]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [docType, setDocType]   = useState(DOC_TYPES[0]);
  const [queue, setQueue]       = useState([]); // { file, error, status: "pending"|"uploading"|"done"|"error" }
  const [uploadProgress, setUploadProgress] = useState(""); // "3 / 5" etc.
  const inputRef = useRef();

  const fetchPet = useCallback(async () => {
    setLoading(true);
    try {
      const pets = await api.getMyPets();
      setPet(pets.find(p => p.id === petId) || null);
    } catch { /* */ }
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchPet(); }, [fetchPet]);

  const openSheet = () => {
    setQueue([]);
    setUploadProgress("");
    setDocType(DOC_TYPES[0]);
    setShowSheet(true);
  };

  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const docs = pet?.documents || [];
    const slots = MAX_DOCS - docs.length;
    const incoming = files.slice(0, slots).map(file => ({
      file,
      error: file.size > MAX_SIZE ? `Exceeds 5 MB (${fmtSize(file.size)})` : "",
      status: "pending",
    }));
    setQueue(prev => {
      const combined = [...prev, ...incoming];
      return combined.slice(0, slots);
    });
    e.target.value = "";
  };

  const removeFromQueue = (idx) => setQueue(prev => prev.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    const valid = queue.filter(q => !q.error && q.status === "pending");
    if (!valid.length) return;
    let done = 0;
    for (let i = 0; i < queue.length; i++) {
      const entry = queue[i];
      if (entry.error || entry.status !== "pending") continue;
      setQueue(prev => prev.map((q, qi) => qi === i ? { ...q, status: "uploading" } : q));
      setUploadProgress(`${done + 1} / ${valid.length}`);
      try {
        await api.uploadPetDocument(petId, entry.file, docType);
        setQueue(prev => prev.map((q, qi) => qi === i ? { ...q, status: "done" } : q));
        done++;
      } catch (err) {
        const msg = err?.message || "Upload failed";
        setQueue(prev => prev.map((q, qi) => qi === i ? { ...q, status: "error", error: msg } : q));
      }
    }
    setUploadProgress("");
    await fetchPet();
    // Close sheet only if all succeeded
    if (queue.filter(q => q.status === "error").length === 0) {
      setTimeout(() => setShowSheet(false), 600);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api.deletePetDocument(petId, docId);
      fetchPet();
    } catch { /* */ }
  };

  const docs = pet?.documents || [];
  const slotsLeft = MAX_DOCS - docs.length;
  const hasValidPending = queue.some(q => !q.error && q.status === "pending");
  const isUploading = queue.some(q => q.status === "uploading");

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-8">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackBtn />
            <div>
              <h1 className="text-[18px] font-bold text-brand-dark">Pet Records</h1>
              {pet && (
                <p className="text-[12px] text-brand-light">
                  {pet.name} · {docs.length}/{MAX_DOCS} files
                </p>
              )}
            </div>
          </div>
          {!loading && pet && slotsLeft > 0 && (
            <button onClick={openSheet}
              className="flex items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2 text-[13px] font-bold text-white active:opacity-80">
              <Plus size={14} /> Add Files
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
          <motion.div className="mt-16 flex flex-col items-center"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
              <FilePlus size={34} className="text-blue-400" />
            </div>
            <h2 className="text-[16px] font-bold text-brand-dark mt-5">No records yet</h2>
            <p className="text-[13px] text-brand-light mt-2 text-center max-w-[240px]">
              Upload vaccination records, prescriptions, scans — any file type, up to 5 MB each
            </p>
            <button onClick={openSheet} className="btn-primary mt-6 px-8">Add Records</button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc, i) => {
              const { Icon, color, bg } = fileIcon(doc.name || doc.originalName, doc.mimetype);
              return (
                <motion.div key={doc.id}
                  className="rounded-2xl bg-white p-4 shadow-soft flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className={`h-11 w-11 shrink-0 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={20} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold text-brand-dark truncate">
                      {doc.name || doc.originalName || "Untitled"}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full">
                        {doc.type}
                      </span>
                      {doc.size && (
                        <span className="text-[11px] text-brand-light">{fmtSize(doc.size)}</span>
                      )}
                      <span className="text-[11px] text-brand-light">
                        {doc.uploadedAt
                          ? new Date(doc.uploadedAt).toLocaleDateString()
                          : doc.uploaded_at
                            ? new Date(doc.uploaded_at).toLocaleDateString()
                            : ""}
                      </span>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer"
                    className="h-8 w-8 rounded-lg bg-brand-bg flex items-center justify-center shrink-0">
                    <Eye size={14} className="text-brand-medium" />
                  </a>
                  <button onClick={() => handleDelete(doc.id)}
                    className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <Trash2 size={14} className="text-brand-red" />
                  </button>
                </motion.div>
              );
            })}
            {slotsLeft > 0 && (
              <button onClick={openSheet}
                className="w-full rounded-2xl border-2 border-dashed border-gray-200 py-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-brand-light active:bg-gray-50">
                <Plus size={15} /> Add more ({slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Sheet */}
      <AnimatePresence>
        {showSheet && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => !isUploading && setShowSheet(false)} />
            <motion.div
              className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-10 max-h-[85vh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              {/* Sheet header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h2 className="text-[18px] font-bold text-brand-dark">Add Records</h2>
                  <p className="text-[12px] text-brand-light mt-0.5">
                    Any file type · Max 5 MB each · {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
                  </p>
                </div>
                {!isUploading && (
                  <button onClick={() => setShowSheet(false)}
                    className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center">
                    <X size={16} className="text-brand-medium" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Doc type selector */}
                <div className="mb-4">
                  <label className="block mb-1.5 text-[12px] font-bold text-brand-light uppercase tracking-wider">Record Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-brand-dark outline-none border border-transparent focus:border-brand-orange">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Drop zone */}
                <label
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-orange/30 p-6 cursor-pointer active:bg-orange-50/40 transition-colors mb-4"
                  onClick={() => inputRef.current?.click()}>
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Upload size={22} className="text-brand-orange" />
                  </div>
                  <span className="text-[14px] font-semibold text-brand-dark">Tap to select files</span>
                  <span className="text-[12px] text-brand-light">Any file type · up to 5 MB each</span>
                </label>
                <input ref={inputRef} type="file" className="hidden" multiple onChange={onFilesSelected} />

                {/* Queue list */}
                {queue.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-[12px] font-bold text-brand-light uppercase tracking-wider mb-2">
                      {queue.length} file{queue.length !== 1 ? "s" : ""} selected
                    </p>
                    {queue.map((entry, i) => {
                      const { Icon, color, bg } = fileIcon(entry.file.name, entry.file.type);
                      const isDone = entry.status === "done";
                      const isErr  = entry.status === "error" || !!entry.error;
                      const isUp   = entry.status === "uploading";
                      return (
                        <div key={i}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                            isDone ? "bg-green-50" : isErr ? "bg-red-50" : "bg-gray-50"
                          }`}>
                          <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                            <Icon size={16} className={color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-brand-dark truncate">{entry.file.name}</p>
                            <p className={`text-[11px] ${isErr ? "text-red-500" : "text-brand-light"}`}>
                              {isErr ? entry.error : fmtSize(entry.file.size)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {isUp  && <Loader2 size={16} className="text-brand-orange animate-spin" />}
                            {isDone && <CheckCircle2 size={16} className="text-green-500" />}
                            {isErr  && !isUp && <AlertCircle size={16} className="text-red-400" />}
                            {!isUp && !isDone && (
                              <button onClick={() => removeFromQueue(i)}
                                className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <X size={11} className="text-brand-medium" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="pt-3 shrink-0">
                <button
                  onClick={uploadAll}
                  disabled={!hasValidPending || isUploading}
                  className="w-full rounded-2xl bg-brand-orange text-white text-[14px] font-bold py-4 flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50">
                  {isUploading
                    ? <><Loader2 size={16} className="animate-spin" /> Uploading {uploadProgress}…</>
                    : <><Upload size={15} /> Upload {queue.filter(q => !q.error && q.status === "pending").length || ""} File{queue.filter(q => !q.error && q.status === "pending").length !== 1 ? "s" : ""}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
