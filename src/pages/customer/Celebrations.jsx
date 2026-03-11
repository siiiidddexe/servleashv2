import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Calendar, X, Check, Sparkles } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function Celebrations() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(null);
  const [form, setForm] = useState({ petName: "", date: "", notes: "" });
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showDIY, setShowDIY] = useState(false);
  const [diyForm, setDiyForm] = useState({ description: "", budget: "", date: "" });

  const fetchPkgs = useCallback(async () => {
    setLoading(true);
    try { const p = await api.getCelebrations(); setPackages(p); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPkgs(); }, [fetchPkgs]);

  const handleBook = async () => {
    if (!form.petName || !form.date) return;
    setBooking(true);
    try {
      await api.bookCelebration({ packageId: showBook.id, ...form });
      setBooked(true);
    } catch { /* */ }
    setBooking(false);
  };

  const packageEmojis = ["🎂", "📸", "🎈", "👑"];

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <div>
            <h1 className="text-[20px] font-bold text-brand-dark">Celebrations 🎉</h1>
            <p className="text-[12px] text-brand-light">Birthday parties & special events for pets</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : (
          <>
            <div className="space-y-3">
              {packages.map((pkg, i) => (
                <motion.div key={pkg.id} className="rounded-2xl bg-white p-5 shadow-soft"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center text-3xl">
                      {packageEmojis[i % packageEmojis.length]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[16px] font-bold text-brand-dark">{pkg.name}</h3>
                      <p className="text-[12px] text-brand-light mt-1">{pkg.description}</p>
                      {pkg.includes && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {pkg.includes.map((item, j) => (
                            <span key={j} className="text-[10px] bg-brand-bg rounded-full px-2.5 py-1 text-brand-medium font-medium">{item}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-[18px] font-bold text-brand-orange">₹{pkg.price}</p>
                    <button onClick={() => { setShowBook(pkg); setBooked(false); setForm({ petName: "", date: "", notes: "" }); }}
                      className="rounded-full bg-brand-orange px-5 py-2.5 text-[13px] font-bold text-white active:opacity-80">
                      Book Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* DIY Request */}
            <motion.div className="mt-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-5 shadow-soft"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-purple-500" />
                <div>
                  <h3 className="text-[15px] font-bold text-brand-dark">Custom / DIY Party</h3>
                  <p className="text-[12px] text-brand-light">Design your own celebration!</p>
                </div>
              </div>
              <button onClick={() => setShowDIY(true)} className="mt-3 w-full rounded-xl bg-white py-2.5 text-[13px] font-bold text-purple-600 shadow-sm active:bg-gray-50">
                Request Custom Package
              </button>
            </motion.div>
          </>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBook && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowBook(null)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              {booked ? (
                <div className="flex flex-col items-center py-6">
                  <div className="h-16 w-16 rounded-full bg-brand-green flex items-center justify-center"><Check size={32} className="text-white" /></div>
                  <h2 className="text-[18px] font-bold text-brand-dark mt-4">Booked! 🎉</h2>
                  <p className="text-[13px] text-brand-light mt-2 text-center">We'll contact you to finalize the details</p>
                  <button onClick={() => setShowBook(null)} className="btn-primary mt-5 px-8">Done</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[18px] font-bold text-brand-dark">Book: {showBook.name}</h2>
                    <button onClick={() => setShowBook(null)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Pet Name *</label>
                      <input type="text" value={form.petName} onChange={e => setForm(p => ({...p, petName: e.target.value}))} className="input-field" placeholder="e.g. Buddy" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Preferred Date *</label>
                      <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="input-field" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Special Requests</label>
                      <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="input-field min-h-[80px]" placeholder="Any allergies, themes, etc." />
                    </div>
                  </div>
                  <button onClick={handleBook} disabled={booking || !form.petName || !form.date} className="btn-primary mt-5 w-full flex items-center justify-center gap-2">
                    {booking ? <><span className="spinner" /> Booking...</> : <><PartyPopper size={16} /> Confirm Booking — ₹{showBook.price}</>}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIY Modal */}
      <AnimatePresence>
        {showDIY && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDIY(false)} />
            <motion.div className="relative w-full max-w-[430px] rounded-t-3xl bg-white px-5 pt-5 pb-8"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-brand-dark">Custom Party Request</h2>
                <button onClick={() => setShowDIY(false)} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">What do you have in mind?</label>
                  <textarea value={diyForm.description} onChange={e => setDiyForm(p => ({...p, description: e.target.value}))} className="input-field min-h-[100px]" placeholder="Describe your dream pet party..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Budget</label>
                    <input type="text" value={diyForm.budget} onChange={e => setDiyForm(p => ({...p, budget: e.target.value}))} className="input-field" placeholder="₹5000" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Date</label>
                    <input type="date" value={diyForm.date} onChange={e => setDiyForm(p => ({...p, date: e.target.value}))} className="input-field" />
                  </div>
                </div>
              </div>
              <button onClick={() => { alert("Request submitted! We'll contact you soon."); setShowDIY(false); }} className="btn-primary mt-5 w-full">Submit Request</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav base="/customer" activeTab="celebrations" />
    </div>
  );
}
