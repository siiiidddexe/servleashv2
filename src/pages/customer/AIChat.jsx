import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import BackBtn from "../../components/BackBtn";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [presets, setPresets] = useState([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef();

  const fetchPresets = useCallback(async () => {
    try { const p = await api.getChatPresets(); setPresets(p); } catch { /* */ }
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    setSending(true);
    try {
      const res = await api.sendChatMessage(msg);
      setMessages(prev => [...prev, { role: "bot", text: res.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, I couldn't process that. Please try again!" }]);
    }
    setSending(false);
  };

  return (
    <div className="min-h-[100dvh] bg-brand-bg pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <BackBtn />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-brand-dark">Pet AI Assistant</h1>
              <p className="text-[11px] text-brand-green font-medium">● Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Welcome */}
        {messages.length === 0 && (
          <motion.div className="flex flex-col items-center mt-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center">
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-brand-dark mt-4">Hi! I&apos;m your Pet AI 🐾</h2>
            <p className="text-[13px] text-brand-light mt-2 text-center max-w-[280px]">
              Ask me anything about pet care, nutrition, training, or health concerns!
            </p>

            {/* Presets */}
            {presets.length > 0 && (
              <div className="mt-6 w-full space-y-2">
                <p className="text-[12px] font-semibold text-brand-medium text-center">Quick Questions</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {presets.map((p, i) => (
                    <button key={i} onClick={() => sendMessage(p.text)} className="rounded-full bg-white px-4 py-2 text-[12px] font-medium text-brand-dark shadow-soft active:bg-brand-bg transition-colors">
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <motion.div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {msg.role === "bot" && (
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              msg.role === "user"
                ? "bg-brand-dark text-white rounded-br-md"
                : "bg-white text-brand-dark shadow-soft rounded-bl-md"
            }`}>
              <p className="text-[13px] leading-relaxed whitespace-pre-line">{msg.text}</p>
            </div>
            {msg.role === "user" && (
              <div className="h-7 w-7 shrink-0 rounded-full bg-brand-bg flex items-center justify-center">
                <User size={14} className="text-brand-medium" />
              </div>
            )}
          </motion.div>
        ))}

        {sending && (
          <motion.div className="flex items-center gap-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-soft">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-brand-light animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-brand-light animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-brand-light animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white px-5 py-3 border-t border-brand-bg mb-16">
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !sending && sendMessage()}
            className="input-field flex-1" placeholder="Ask about pet care..." disabled={sending} />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
            className="h-11 w-11 shrink-0 rounded-full bg-brand-dark flex items-center justify-center disabled:opacity-50">
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>

      <BottomNav base="/customer" activeTab="ai_chat" />
    </div>
  );
}
