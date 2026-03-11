import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Coins as CoinsIcon, Gift, Share2, Copy, Check, Sparkles, Calendar } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function CoinsPage() {
  const [data, setData] = useState({ balance: 0, transactions: [] });
  const [referralCode, setReferralCode] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const [coinData, code] = await Promise.all([api.getCoins(), api.getReferralCode()]);
      setData(coinData);
      setReferralCode(code.code || "");
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoins(); }, [fetchCoins]);

  const claimDaily = async () => {
    setClaiming(true);
    try {
      const res = await api.claimDailyCoins();
      if (res.coins !== undefined) {
        setData(prev => ({ ...prev, balance: prev.balance + (res.coins || 0) }));
        setClaimed(true);
      } else {
        alert(res.error || "Already claimed today!");
      }
    } catch { /* */ }
    setClaiming(false);
  };

  const useReferral = async () => {
    if (!referralInput.trim()) return;
    setRedeeming(true);
    try {
      const res = await api.useReferral(referralInput.trim());
      if (res.coins !== undefined) {
        alert(`🎉 You earned ${res.coins} coins!`);
        setReferralInput("");
        fetchCoins();
      } else {
        alert(res.error || "Invalid code");
      }
    } catch { /* */ }
    setRedeeming(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center"><span className="spinner" /></div>;

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-[20px] font-bold text-brand-dark">Servleash Coins 🪙</h1>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Balance Card */}
        <motion.div className="rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 p-6 shadow-soft text-white"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <CoinsIcon size={28} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] text-white/80">Your Balance</p>
              <p className="text-[32px] font-bold leading-tight">{data.balance}</p>
              <p className="text-[11px] text-white/70">1 coin = ₹1 discount (max ₹100/order)</p>
            </div>
          </div>
        </motion.div>

        {/* Daily Claim */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Calendar size={22} className="text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-brand-dark">Daily Login Reward</h3>
              <p className="text-[12px] text-brand-light">Earn 5 coins every day!</p>
            </div>
            <button onClick={claimDaily} disabled={claiming || claimed}
              className={`rounded-full px-5 py-2.5 text-[13px] font-bold transition-colors ${claimed ? "bg-brand-green text-white" : "bg-brand-orange text-white"} disabled:opacity-70`}>
              {claimed ? <span className="flex items-center gap-1"><Check size={14} /> Claimed</span> : claiming ? "..." : <span className="flex items-center gap-1"><Sparkles size={14} /> Claim</span>}
            </button>
          </div>
        </motion.div>

        {/* Referral */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-[15px] font-bold text-brand-dark flex items-center gap-2"><Gift size={18} className="text-brand-orange" /> Refer & Earn</h3>
          <p className="text-[12px] text-brand-light mt-1">Both you and your friend earn 50 coins!</p>

          {/* Your code */}
          <div className="mt-4 p-3 rounded-xl bg-brand-bg flex items-center justify-between">
            <div>
              <p className="text-[11px] text-brand-light">Your Referral Code</p>
              <p className="text-[18px] font-bold text-brand-dark tracking-wider">{referralCode || "—"}</p>
            </div>
            <button onClick={copyCode} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-brand-medium shadow-sm">
              {copied ? <><Check size={14} className="text-brand-green" /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>

          {/* Enter code */}
          <div className="mt-3 flex gap-2">
            <input type="text" value={referralInput} onChange={e => setReferralInput(e.target.value.toUpperCase())}
              className="input-field flex-1" placeholder="Enter friend's code" maxLength={10} />
            <button onClick={useReferral} disabled={redeeming || !referralInput.trim()}
              className="rounded-xl bg-brand-orange px-5 text-[13px] font-bold text-white disabled:opacity-50">
              {redeeming ? "..." : "Redeem"}
            </button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div className="rounded-2xl bg-white p-4 shadow-soft" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="text-[15px] font-bold text-brand-dark mb-3">History</h3>
          {(!data.transactions || data.transactions.length === 0) ? (
            <p className="text-[13px] text-brand-light text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {data.transactions.slice().reverse().map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-brand-bg last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark">{tx.desc}</p>
                    <p className="text-[11px] text-brand-light">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[14px] font-bold ${tx.amount > 0 ? "text-brand-green" : "text-brand-red"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav base="/customer" activeTab="coins" />
    </div>
  );
}
