import { useRef, useState } from "react";

export default function OtpInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const refs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[i] = val;
    setValues(next);
    if (val && i < length - 1) refs.current[i + 1]?.focus();
    const code = next.join("");
    if (code.length === length && !next.includes("")) onComplete(code);
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !values[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    const next = [...values];
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setValues(next);
    const focusIdx = Math.min(text.length, length - 1);
    refs.current[focusIdx]?.focus();
    if (text.length === length) onComplete(text);
  };

  return (
    <div className="flex justify-center gap-3">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="otp-input"
        />
      ))}
    </div>
  );
}
