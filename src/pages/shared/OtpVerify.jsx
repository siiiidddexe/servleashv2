import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Mail } from "lucide-react";
import PageWrap from "../../components/PageWrap";
import BackBtn from "../../components/BackBtn";
import OtpInput from "../../components/OtpInput";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function OtpVerify() {
  const location = useLocation();
  const nav = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email || "user@example.com";
  const role = location.state?.role || "customer";
  const fromReset = location.state?.fromReset || false;
  const signupData = {
    name: location.state?.name || null,
    phone: location.state?.phone || null,
    city: location.state?.city || null,
  };

  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleComplete = async (code) => {
    setError("");
    setVerifying(true);
    try {
      const data = await api.verifyOtp(email, role, code, signupData);
      login(data.user, data.token);
      // Route based on role
      const homeMap = { admin: "/admin/home", vendor: "/vendor/home", customer: "/customer/home" };
      nav(homeMap[role] || "/customer/home", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid verification code");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      await api.requestOtp(email, role);
      setResent(true);
    } catch {}
    setResending(false);
    setTimeout(() => setResent(false), 4000);
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c);

  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col bg-white px-6 pt-4 pb-8">
        <BackBtn />

        <motion.div className="mt-16 flex justify-center" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <ShieldCheck size={32} className="text-brand-orange" />
          </div>
        </motion.div>

        <motion.div className="mt-6 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <h1 className="text-[26px] font-extrabold text-brand-dark">
            {fromReset ? "New Login Code Sent" : "Check your email"}
          </h1>
          <p className="mt-2 text-[14px] text-brand-medium">
            {fromReset ? "Your sessions were cleared. Enter the code to log back in." : "We sent a 6-digit code to"}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <Mail size={14} className="text-brand-orange" />
            <p className="text-[14px] font-bold text-brand-dark">{maskedEmail}</p>
          </div>
        </motion.div>

        <div className="mt-10">
          <OtpInput length={6} onComplete={handleComplete} />
          {error && (
            <motion.p className="mt-4 text-center text-[13px] font-semibold text-brand-red" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </motion.p>
          )}
          {verifying && !error && (
            <motion.p className="mt-4 text-center text-[13px] font-semibold text-brand-green" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Verifying...
            </motion.p>
          )}
        </div>

        <motion.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="text-[13px] text-brand-light">Didn't receive it? Check spam or</p>
          <button onClick={handleResend} disabled={resending} className="mt-1 text-[14px] font-bold text-brand-orange disabled:opacity-50">
            {resending ? "Sending..." : resent ? "Sent!" : "Resend Code"}
          </button>
        </motion.div>

        <div className="mt-auto pt-8">
          <div className="rounded-2xl bg-brand-bg border border-brand-border-light p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={14} className="text-brand-orange" />
              <p className="text-[11px] font-bold text-brand-light uppercase tracking-wider">Email Verification</p>
            </div>
            <p className="text-[12px] text-brand-medium leading-relaxed">
              A real OTP has been sent to your email. Enter the 6-digit code to verify your account. Code expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
