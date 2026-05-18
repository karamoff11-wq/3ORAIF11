"use client";
import React, { useState } from "react";
import { useTranslator } from "@/lib/i18n";

interface PremiumSearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  lang?: string;
  accentColor?: string;
}

export function PremiumSearchBar({
  value,
  onChange,
  placeholder,
  lang = "AR",
  accentColor = "#10B981",
}: PremiumSearchBarProps) {
  const t = useTranslator();
  const isRtl = lang === "AR";
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-md mx-auto transition-all duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orbitSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      ` }} />

      {/* Ambient glow matching accentColor */}
      <div 
        className={`absolute -inset-1 rounded-2xl filter blur-xl transition-opacity duration-500 pointer-events-none ${isFocused ? "opacity-80" : "opacity-40"}`} 
        style={{ backgroundColor: accentColor }}
      />

      {/* Rotating conic border matching accentColor */}
      <div className="absolute -inset-[1.5px] rounded-2xl overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-50% left-50% w-[250%] h-[250%]"
          style={{
            top: '50%',
            left: '50%',
            background: `conic-gradient(from 0deg, transparent, ${accentColor}, #ffffff, ${accentColor}, transparent 80%)`,
            animation: `orbitSpin 5s linear infinite`
          }}
        />
      </div>

      <div className="relative flex items-center w-full bg-black/30 rounded-2xl overflow-hidden px-4 shadow-2xl border border-white/20 backdrop-blur-3xl z-10 py-1.5">
        <span 
          className={`absolute ${isRtl ? "right-4" : "left-4"} pointer-events-none transition-all duration-300 ${isFocused ? "scale-125" : "text-white/60"}`}
          style={{ color: isFocused ? accentColor : undefined }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || (isRtl ? "ابحث عن فئة..." : "Search category...")}
          className={`w-full bg-transparent text-white font-black text-sm py-2 ${isRtl ? "pr-10 pl-10" : "pl-10 pr-10"} focus:outline-none placeholder:text-white/40 tracking-wide`}
          style={{ direction: isRtl ? "rtl" : "ltr" }}
        />

        {value && (
          <button
            onClick={() => onChange({ target: { value: "" } } as any)}
            className={`absolute ${isRtl ? "left-3" : "right-3"} p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors font-black text-base`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
