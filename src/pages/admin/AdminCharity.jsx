import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Image, Plus, Trash2, Upload } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

export default function AdminCharity() {
  const [data, setData] = useState({ totalDonations: 0, media: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const c = await api.getCharity(); setData(c); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.adminAddCharityMedia(file, caption);
      setCaption("");
      fetchData();
    } catch { /* */ }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this media?")) return;
    try { await api.adminDeleteCharityMedia(id); fetchData(); } catch { /* */ }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <h1 className="text-[20px] font-bold text-brand-dark">Charity Gallery</h1>
        <p className="text-[12px] text-brand-light mt-1">Total donations: ₹{data.totalDonations}</p>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Upload */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">Add Media</h3>
          <input type="text" value={caption} onChange={e => setCaption(e.target.value)} className="input-field mb-3" placeholder="Caption for the photo..." />
          <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-orange/30 py-4 cursor-pointer active:bg-brand-orange/5">
            <Upload size={18} className="text-brand-orange" />
            <span className="text-[13px] font-semibold text-brand-medium">{uploading ? "Uploading..." : "Select Photo"}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </motion.div>

        {/* Media Grid */}
        {loading ? (
          <div className="mt-8 flex justify-center"><span className="spinner" /></div>
        ) : data.media.length === 0 ? (
          <p className="text-center text-brand-light text-[14px]">No media yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {data.media.map((item, i) => (
              <motion.div key={item.id} className="rounded-2xl bg-white shadow-soft overflow-hidden"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-pink-50 flex items-center justify-center text-3xl">🐾</div>
                )}
                <div className="p-3 flex items-start justify-between gap-2">
                  <p className="text-[11px] text-brand-medium line-clamp-2 flex-1">{item.caption || "No caption"}</p>
                  <button onClick={() => handleDelete(item.id)} className="shrink-0 h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <Trash2 size={12} className="text-brand-red" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AdminNav />
    </div>
  );
}
