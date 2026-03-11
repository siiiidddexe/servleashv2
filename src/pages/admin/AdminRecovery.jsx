import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, XCircle, Eye, Clock } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { api } from "../../lib/api";

export default function AdminRecovery() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try { const a = await api.getRecoveryAlerts(); setAlerts(a); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleApprove = async (id) => {
    try { await api.adminApproveRecovery(id); fetchAlerts(); } catch { /* */ }
  };

  const handleReject = async (id) => {
    if (!confirm("Reject this alert?")) return;
    try { await api.adminRejectRecovery(id); fetchAlerts(); } catch { /* */ }
  };

  const filtered = tab === "active" ? alerts.filter(a => a.status === "active") : alerts.filter(a => a.status === "resolved");

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20">
      <div className="bg-white px-5 pt-12 pb-0">
        <h1 className="text-[20px] font-bold text-brand-dark pb-4">Recovery Alerts</h1>
        <div className="flex gap-2 pb-3">
          {["active", "resolved"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-[12px] font-bold capitalize ${tab === t ? "bg-brand-orange text-white" : "bg-brand-bg text-brand-medium"}`}>
              {t} ({alerts.filter(a => a.status === t).length})
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="mt-12 flex justify-center"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-brand-light text-[14px] mt-12">No {tab} alerts</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert, i) => (
              <motion.div key={alert.id} className="rounded-2xl bg-white p-4 shadow-soft"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${alert.status === "resolved" ? "bg-green-50" : "bg-red-50"}`}>
                    {alert.status === "resolved" ? <Check size={18} className="text-brand-green" /> : <AlertTriangle size={18} className="text-brand-red" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-brand-dark">{alert.petName}</h3>
                    <p className="text-[12px] text-brand-light">{alert.species} · {alert.color} · {alert.area}</p>
                    {alert.description && <p className="text-[12px] text-brand-medium mt-1">{alert.description}</p>}
                    <p className="text-[11px] text-brand-light mt-1">📞 {alert.contactPhone}</p>
                    <p className="text-[10px] text-brand-light mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {alert.status === "active" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleApprove(alert.id)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-green py-2 text-[12px] font-bold text-white">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(alert.id)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2 text-[12px] font-bold text-brand-red">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AdminNav />
    </div>
  );
}
