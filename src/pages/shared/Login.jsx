import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Lock, Eye, EyeOff, PawPrint } from "lucide-react";
import PageWrap from "../../components/PageWrap";
import { api } from "../../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email, password);
      nav("/otp", { state: { email, role: data.role, devCode: data.devCode } });
    } catch (err) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col bg-white px-6 pt-4 pb-8">
        {/* Logo */}
        <motion.div className="mt-10 flex items-center gap-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark">
            <PawPrint size={22} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-brand-dark">servleash</span>
        </motion.div>

        <motion.div className="mt-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-[28px] font-extrabold text-brand-dark leading-tight">Welcome back</h1>
          <p className="mt-2 text-[15px] text-brand-medium">Sign in with your email &amp; password</p>
        </motion.div>

        <motion.div className="mt-6 space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          {/* Email */}
          <div>
            <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Email</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-light"><Mail size={18} /></span>
              <input type="email" inputMode="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="input-field" style={{ paddingLeft: "2.75rem" }} autoFocus />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-light"><Lock size={18} /></span>
              <input type={showPw ? "text" : "password"} placeholder="Min 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-light">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </motion.div>

        {error && <motion.p className="mt-3 text-center text-[13px] font-semibold text-brand-red" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

        <motion.button className="btn-primary mt-6 flex items-center justify-center gap-2"
          onClick={handleLogin} disabled={!isValid || loading}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} whileTap={{ scale: 0.98 }}>
          {loading ? <><span className="spinner" /> Verifying...</> : <>Login <ArrowRight size={16} /></>}
        </motion.button>

        <motion.p className="mt-3 text-center text-[13px] text-brand-light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          You'll receive a 6-digit OTP to confirm
        </motion.p>

        <motion.div className="mt-2 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button onClick={() => nav("/forgot-password")} className="text-[13px] text-brand-orange font-semibold hover:underline">
            Forgot password?
          </button>
        </motion.div>

        <div className="mt-auto pt-8 text-center">
          <p className="text-[14px] text-brand-medium">
            Don't have an account?{" "}
            <button onClick={() => nav("/signup")} className="font-bold text-brand-orange">Register</button>
          </p>
        </div>
      </div>
    </PageWrap>
  );
}
