import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Phone, Mail, MapPin, Lock, Eye, EyeOff, PawPrint } from "lucide-react";
import PageWrap from "../../components/PageWrap";
import { api } from "../../lib/api";

const ROLES = [
  { id: "customer", label: "Pet Parent" },
  { id: "vendor", label: "Vendor" },
  { id: "admin", label: "Admin" },
];

export default function Signup() {
  const nav = useNavigate();
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const emailValid = emailRegex.test(email);
  const pwMatch = password.length >= 6 && password === confirmPw;
  const isValid = name.trim() && emailValid && pwMatch;

  const handleSignup = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.register(email, password, role, { name, phone, city });
      nav("/otp", { state: { email, role, name, phone, city, devCode: data.devCode } });
    } catch (err) {
      setError(err.message || "Registration failed");
    }
    setLoading(false);
  };

  const fields = [
    { label: "Full Name", icon: User, value: name, set: setName, ph: "James Anderson", type: "text", req: true },
    { label: "Email Address", icon: Mail, value: email, set: setEmail, ph: "you@example.com", type: "email", req: true },
    { label: "Phone (optional)", icon: Phone, value: phone, set: setPhone, ph: "+91 98765 43210", type: "tel" },
    { label: "City", icon: MapPin, value: city, set: setCity, ph: "Mumbai", type: "text" },
  ];

  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col bg-white px-6 pt-4 pb-8">
        {/* Logo */}
        <motion.div className="mt-6 flex items-center gap-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark">
            <PawPrint size={22} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-brand-dark">servleash</span>
        </motion.div>

        <motion.div className="mt-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] font-extrabold text-brand-dark">Create Account</h1>
          <p className="mt-1.5 text-[15px] text-brand-medium">Join Servleash today</p>
        </motion.div>

        {/* Role tabs */}
        <motion.div className="mt-4 flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setRole(r.id)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${role === r.id ? "bg-brand-dark text-white" : "bg-brand-bg text-brand-medium"}`}
            >{r.label}</button>
          ))}
        </motion.div>

        <motion.div className="mt-5 space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label}>
                <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">
                  {f.label} {f.req && <span className="text-brand-red">*</span>}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-light"><Icon size={18} /></span>
                  <input type={f.type} inputMode={f.type === "tel" ? "numeric" : f.type === "email" ? "email" : undefined}
                    placeholder={f.ph} value={f.value}
                    onChange={(e) => f.set(f.type === "tel" ? e.target.value.replace(/[^\d+\s-]/g, "") : e.target.value)}
                    className="input-field" style={{ paddingLeft: "2.75rem" }} />
                </div>
              </div>
            );
          })}

          {/* Password */}
          <div>
            <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Password <span className="text-brand-red">*</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-light"><Lock size={18} /></span>
              <input type={showPw ? "text" : "password"} placeholder="Min 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-light">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1.5 text-[13px] font-semibold text-brand-medium">Confirm Password <span className="text-brand-red">*</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-light"><Lock size={18} /></span>
              <input type={showPw ? "text" : "password"} placeholder="Re-enter password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="input-field" style={{ paddingLeft: "2.75rem" }} />
            </div>
            {confirmPw && password !== confirmPw && (
              <p className="mt-1 text-[12px] text-brand-red">Passwords don't match</p>
            )}
          </div>
        </motion.div>

        <motion.label className="mt-4 flex items-start gap-3 cursor-pointer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-brand-orange" />
          <span className="text-[13px] text-brand-medium leading-relaxed">
            I agree to the <button className="font-bold text-brand-orange">Terms</button> and <button className="font-bold text-brand-orange">Privacy Policy</button>
          </span>
        </motion.label>

        {error && <motion.p className="mt-3 text-center text-[13px] font-semibold text-brand-red" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}

        <motion.button className="btn-primary mt-5 flex items-center justify-center gap-2"
          onClick={handleSignup} disabled={!isValid || loading}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} whileTap={{ scale: 0.98 }}>
          {loading ? <><span className="spinner" /> Creating...</> : "Create Account"}
        </motion.button>

        <motion.p className="mt-3 text-center text-[12px] text-brand-light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          A verification code will be sent to your email
        </motion.p>

        <div className="mt-auto pt-6 text-center">
          <p className="text-[14px] text-brand-medium">
            Already have an account?{" "}
            <button onClick={() => nav("/login")} className="font-bold text-brand-orange">Login</button>
          </p>
        </div>
      </div>
    </PageWrap>
  );
}
