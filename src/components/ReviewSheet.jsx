import { useState } from "react";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { api } from "../lib/api";

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function ReviewSheet({ targetId, targetType, targetName, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await api.submitReview({ targetId, targetType, rating, comment });
      onSuccess?.();
    } catch { /* */ }
    setSubmitting(false);
  };

  const display = hovered || rating;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl px-5 pt-5 pb-10 max-w-[430px] mx-auto"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[17px] font-bold text-brand-dark">Rate & Review</h3>
            <p className="text-[12px] text-brand-light mt-0.5 max-w-[240px] truncate">{targetName}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center shrink-0">
            <X size={15} className="text-brand-medium" />
          </button>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onTouchStart={() => setRating(s)}
              onClick={() => setRating(s)}
              className="active:scale-90 transition-transform"
            >
              <Star
                size={40}
                className={s <= display ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
              />
            </button>
          ))}
        </div>
        <p className={`text-center text-[14px] font-semibold mb-5 h-5 ${display ? "text-brand-dark" : "text-brand-light"}`}>
          {display ? LABELS[display] : "Tap a star to rate"}
        </p>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your experience (optional)…"
          className="w-full rounded-xl bg-brand-bg border border-gray-200 p-3.5 text-[13px] text-brand-dark resize-none h-[90px] outline-none focus:border-brand-orange transition-colors"
        />

        <button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="spinner" /> Submitting…</> : "Submit Review"}
        </button>
      </motion.div>
    </>
  );
}
