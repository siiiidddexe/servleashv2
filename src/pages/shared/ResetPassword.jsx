import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, AlertCircle, Loader } from "lucide-react";
import PageWrap from "../../components/PageWrap";
import { api } from "../../lib/api";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [status, setStatus] = useState("verifying"); // verifying | valid | processing | done | error
  const [tokenData, setTokenData] = useState(null);   // { email, role }
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Verify the token is valid
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No reset token found. Please request a new reset link.");
      return;
    }
    api.verifyResetToken(token)
      .then((data) => {
        setTokenData(data);
        setStatus("valid");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Reset link has expired or is invalid.");
      });
  }, [token]);

  // Step 2: User clicks confirm → clears sessions + sends fresh OTP → redirect to OTP page
  const handleConfirm = async () => {
    setStatus("processing");
    try {
      const result = await api.resetPassword(token);
      setStatus("done");
      // Brief pause so user sees success, then redirect to OTP verify
      setTimeout(() => {
        nav(`/${result.role}/otp`, {
          state: {
            email: result.email,
            fromReset: true,
          },
          replace: true,
        });
      }, 1800);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to process reset. Please try again.");
    }
  };

  // ── Verifying ──
  if (status === "verifying") {
    return (
      <PageWrap>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader size={36} className="text-brand-orange" />
          </motion.div>
          <p className="mt-4 text-[15px] font-semibold text-brand-medium">Verifying your reset link…</p>
        </div>
      </PageWrap>
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <PageWrap>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <AlertCircle size={40} className="text-red-500" />
          </motion.div>
          <h1 className="mt-6 text-[24px] font-extrabold text-brand-dark">Link Invalid</h1>
          <p className="mt-3 text-[14px] text-brand-medium leading-relaxed max-w-xs">
            {errorMsg}
          </p>
          <button
            onClick={() => nav("/customer/forgot-password")}
            className="btn-primary mt-8 w-full max-w-xs"
          >
            Request New Reset Link
          </button>
          <button
            onClick={() => nav("/customer/login")}
            className="mt-3 text-[14px] font-semibold text-brand-medium hover:text-brand-dark transition-colors"
          >
            Back to Login
          </button>
        </div>
      </PageWrap>
    );
  }

  // ── Done ──
  if (status === "done") {
    return (
      <PageWrap>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <ShieldCheck size={40} className="text-green-500" />
          </motion.div>
          <h1 className="mt-6 text-[24px] font-extrabold text-brand-dark">Sessions Cleared!</h1>
          <p className="mt-3 text-[14px] text-brand-medium">
            Sending a new login code to your email…
          </p>
          <div className="mt-4">
            <span className="spinner" style={{ display: "inline-block" }} />
          </div>
        </div>
      </PageWrap>
    );
  }

  // ── Processing ──
  if (status === "processing") {
    return (
      <PageWrap>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader size={36} className="text-brand-orange" />
          </motion.div>
          <p className="mt-4 text-[15px] font-semibold text-brand-medium">Processing reset…</p>
        </div>
      </PageWrap>
    );
  }

  // ── Valid — confirm screen ──
  return (
    <PageWrap>
      <div className="flex min-h-[100dvh] flex-col bg-white px-6 pt-16 pb-8">
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <ShieldCheck size={32} className="text-brand-orange" />
          </div>
        </motion.div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-[26px] font-extrabold text-brand-dark">Reset Your Access</h1>
          <p className="mt-2 text-[14px] text-brand-medium leading-relaxed">
            Logged in as{" "}
            <span className="font-bold text-brand-dark">{tokenData?.email}</span>
          </p>
        </motion.div>

        <motion.div
          className="mt-8 rounded-2xl bg-brand-bg border border-brand-border-light p-5 space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-[14px] font-bold text-brand-dark">What happens when you confirm:</p>
          <ul className="space-y-2 text-[13px] text-brand-medium">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-orange font-bold">1.</span>
              All your active sessions will be signed out immediately.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-orange font-bold">2.</span>
              A fresh 6-digit login code will be sent to your email.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-orange font-bold">3.</span>
              You'll be redirected to enter that code and log back in.
            </li>
          </ul>
        </motion.div>

        <motion.button
          className="btn-primary mt-8 flex items-center justify-center gap-2"
          onClick={handleConfirm}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShieldCheck size={16} />
          Confirm & Send Login Code
        </motion.button>

        <motion.div
          className="mt-auto pt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => nav(`/${tokenData?.role || "customer"}/login`)}
            className="text-[14px] font-semibold text-brand-medium hover:text-brand-dark transition-colors"
          >
            Cancel — Back to Login
          </button>
        </motion.div>
      </div>
    </PageWrap>
  );
}
