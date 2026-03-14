import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import PageWrap from "../../components/PageWrap";
import BackBtn from "../../components/BackBtn";
import { api } from "../../lib/api";

export default function ForgotPassword() {
  const location = useLocation();
  const role = location.state?.role || "customer";
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const appUrl = window.location.origin;
      await api.requestPasswordReset(email.trim().toLowerCase(), role, appUrl);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <PageWrap>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 pb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50"
          >
            <CheckCircle size={40} className="text-green-500" />
          </motion.div>

          <motion.div className="mt-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h1 className="text-[26px] font-extrabold text-brand-dark">Check your inbox</h1>
            <p className="mt-3 text-[15px] text-brand-medium leading-relaxed max-w-xs mx-auto">
              We've sent a reset link to{" "}
              <span className="font-bold text-brand-dark">{email}</span>.
              <br />Click the link in the email to continue.
            </p>
          </motion.div>

          <motion.div className="mt-8 w-full space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <button
              onClick={() => nav("/login")}
              className="btn-primary w-full"
            >
              Back to Login
            </button>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full py-3 text-[14px] font-semibold text-brand-medium hover:text-brand-dark transition-colors"
            >
              Try a different email
            </button>
          </motion.div>

          <motion.div
            className="mt-8 rounded-2xl bg-teal-50 border border-teal-100 p-4 w-full max-w-sm text-left"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          >
            <p className="text-[12px] text-teal-700 leading-relaxed">
              <strong>Didn't receive it?</strong> Check your spam/junk folder. The link expires in 1 hour.
              If you don't have an account with this email, no email will be sent.
            </p>
          </motion.div>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col bg-white px-6 pt-4 pb-8">
        <BackBtn />

        <motion.div
          className="mt-16 flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <Mail size={32} className="text-brand-orange" />
          </div>
        </motion.div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-[26px] font-extrabold text-brand-dark">Reset Access</h1>
          <p className="mt-2 text-[14px] text-brand-medium leading-relaxed">
            Enter your email and we'll send you a secure link to regain access to your account.
          </p>
        </motion.div>

        <div className="mt-8">
          <label className="block mb-2 text-[13px] font-semibold text-brand-medium">
            Email Address
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-light">
              <Mail size={18} />
            </span>
            <input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && isValid && !loading && handleSubmit()}
              className="input-field"
              style={{ paddingLeft: "2.75rem" }}
            />
          </div>
          {error && (
            <motion.p
              className="mt-2 text-[13px] font-semibold text-brand-red"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
        </div>

        <motion.button
          className="btn-primary mt-6 flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={!isValid || loading}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading
            ? <><span className="spinner" /> Sending link...</>
            : <>Send Reset Link <ArrowRight size={16} /></>}
        </motion.button>

        <motion.div
          className="mt-auto pt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => nav("/login")}
            className="text-[14px] text-brand-medium hover:text-brand-dark font-semibold transition-colors"
          >
            ← Back to Login
          </button>
        </motion.div>
      </div>
    </PageWrap>
  );
}
