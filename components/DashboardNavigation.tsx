"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useFeedbackStore, playSound } from "@/store/feedbackStore";
import { createClient } from "@/lib/supabaseClient";
import { useTranslator } from "@/lib/i18n";
import toast from "react-hot-toast";

export const NavIcon = {
  Home: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  User: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  Users: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Trophy: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
  ),
  Calendar: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  Store: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  ),
  Settings: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  ),
  CreditCard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
  ),
  LogOut: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
  ),
};

export type SidebarIconKey = keyof typeof NavIcon;

interface DashboardNavigationProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  profile?: any;
  userName?: string;
  finalAvatarUrl?: string | null;
}

export function DashboardNavigation({
  collapsed,
  setCollapsed,
  profile,
  userName,
  finalAvatarUrl,
}: DashboardNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslator();
  const { lang, accentColor } = useFeedbackStore();
  const isRtl = lang === "AR";
  const [hoveredTip, setHoveredTip] = useState<string | null>(null);

  const finalDisplay = userName || profile?.display_name || profile?.email?.split('@')[0] || "العُريف";

  const handleLogout = useCallback(async () => {
    playSound("click");
    await supabase.auth.signOut();
    router.push("/");
    toast.success(isRtl ? "تم تسجيل الخروج بنجاح" : "Successfully logged out");
  }, [supabase, router, isRtl]);

  const items: { labelKey: any; iconKey: SidebarIconKey; locked?: boolean; href?: string }[] = [
    { labelKey: "side_home", iconKey: "Home", href: "/dashboard" },
    { labelKey: "side_profile", iconKey: "User", href: "/dashboard/profile" },
    { labelKey: "side_billing", iconKey: "CreditCard", href: "/pricing" },
    { labelKey: "side_friends", iconKey: "Users", locked: true },
    { labelKey: "side_achievements", iconKey: "Trophy", href: "/dashboard/achievements" },
    { labelKey: "side_daily", iconKey: "Calendar", href: "/dashboard/daily" },
    { labelKey: "side_store", iconKey: "Store", href: "/dashboard/store" },
    { labelKey: "side_settings", iconKey: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <>
      {/* ══════════ DESKTOP SIDEBAR (GLASSMORPHISM) ══════════ */}
      <motion.aside
        animate={{ width: collapsed ? 92 : 285 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-40 h-screen shrink-0 hidden lg:flex flex-col select-none border-white/10"
        style={{
          background: "rgba(6, 4, 15, 0.75)",
          backdropFilter: "blur(40px)",
          [isRtl ? "borderLeft" : "borderRight"]: "1px solid rgba(255, 255, 255, 0.08)",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {/* Subtle Side Glow */}
        <div className={`absolute inset-y-0 ${isRtl ? "left-0" : "right-0"} w-0.5 bg-gradient-to-b from-transparent via-white/10 to-transparent`} />

        {/* Logo Section */}
        <div 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-4 p-7 shrink-0 cursor-pointer group/logo relative overflow-hidden"
        >
          <div
            className="w-12 h-12 rounded-[1.3rem] flex items-center justify-center text-xl font-black text-white shrink-0 overflow-hidden shadow-2xl transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:rotate-6 border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #EC4899)`,
              boxShadow: `0 8px 30px ${accentColor}50`,
            }}
          >
            {finalAvatarUrl ? (
              <Image src={finalAvatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span>{finalDisplay.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? 10 : -10 }}
                className="flex flex-col"
              >
                <span className="font-black text-2xl tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60">
                  {isRtl ? "أبو العُريف" : "Al-Areef"}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">
                  ⚡ Elite Edition
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {items.map((item, i) => {
            const active = item.href ? pathname === item.href || (item.href === '/dashboard' && pathname === '/') : false;
            const IconComp = NavIcon[item.iconKey];
            const labelStr = t(item.labelKey);

            return (
              <div
                key={i}
                className="relative"
                onMouseEnter={() => collapsed && setHoveredTip(labelStr)}
                onMouseLeave={() => collapsed && setHoveredTip(null)}
              >
                <motion.div
                  onClick={() => {
                    if (item.locked) return;
                    playSound("click");
                    if (item.href) router.push(item.href);
                  }}
                  whileHover={!item.locked ? { x: isRtl ? -4 : 4, scale: 1.02 } : {}}
                  whileTap={!item.locked ? { scale: 0.98 } : {}}
                  className={`flex items-center gap-3.5 px-3.5 py-3.5 rounded-[1.3rem] transition-all duration-300 relative group ${
                    active
                      ? "font-black text-white shadow-xl"
                      : item.locked
                      ? "opacity-30 cursor-not-allowed"
                      : "cursor-pointer text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100"
                  }`}
                  style={{
                    background: active ? `${accentColor}25` : "transparent",
                    border: active ? `1px solid ${accentColor}50` : "1px solid transparent",
                  }}
                >
                  {/* Active Indicator Bar as Flex Item (Zero Overlap Guaranteed) */}
                  {active ? (
                    <motion.div
                      layoutId="activeNavSide"
                      className="w-1.5 h-6 rounded-full shrink-0"
                      style={{
                        background: accentColor,
                        boxShadow: `0 0 16px 2px ${accentColor}`,
                      }}
                    />
                  ) : (
                    <div className="w-1.5 h-6 rounded-full shrink-0 bg-transparent transition-colors group-hover:bg-white/10" />
                  )}

                  <span
                    className="shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center"
                    style={{ color: active ? accentColor : "inherit" }}
                  >
                    <IconComp />
                  </span>

                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-bold flex-1 whitespace-nowrap tracking-wide"
                    >
                      {labelStr}
                    </motion.span>
                  )}

                  {!collapsed && item.locked && (
                    <span className="opacity-40">
                      <NavIcon.Lock />
                    </span>
                  )}
                </motion.div>

                {/* Collapsed Glass Tooltip */}
                <AnimatePresence>
                  {collapsed && hoveredTip === labelStr && (
                    <motion.div
                      initial={{ opacity: 0, x: isRtl ? -10 : 10, scale: 0.9 }}
                      animate={{ opacity: 1, x: isRtl ? -20 : 20, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`absolute ${isRtl ? "right-full mr-3" : "left-full ml-3"} top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-black/90 border border-white/20 text-white font-bold tracking-wide text-xs whitespace-nowrap z-50 shadow-2xl backdrop-blur-xl`}
                    >
                      {labelStr}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-4">
          <motion.div
            whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.15)", scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 rounded-[1.3rem] cursor-pointer transition-all border border-transparent hover:border-red-500/20 group text-red-500/60 hover:text-red-500"
          >
            <span className="shrink-0 group-hover:scale-110 transition-transform">
              <NavIcon.LogOut />
            </span>
            {!collapsed && (
              <span className="text-xs font-black uppercase tracking-widest">
                {t("side_logout")}
              </span>
            )}
          </motion.div>

          {/* Collapse Button */}
          <button
            onClick={() => {
              playSound("click");
              setCollapsed((p) => !p);
            }}
            className="w-full p-4 flex items-center justify-center transition-all hover:bg-white/10 rounded-[1.3rem] group border border-white/5 bg-white/5 hover:border-white/10"
            title={collapsed ? (isRtl ? "توسيع" : "Expand") : (isRtl ? "طي" : "Collapse")}
          >
            <motion.div
              animate={{ rotate: collapsed ? (isRtl ? -180 : 180) : 0 }}
              className="group-hover:scale-125 transition-transform text-white/60 group-hover:text-white"
            >
              {isRtl ? <NavIcon.ChevronRight /> : <NavIcon.ChevronLeft />}
            </motion.div>
          </button>
        </div>
      </motion.aside>

      {/* ══════════ MOBILE BOTTOM NAV (FLOATING GLASS PILL) ══════════ */}
      <nav
        className="fixed bottom-4 inset-x-4 z-50 lg:hidden flex items-center justify-around px-4 py-3 rounded-3xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        style={{
          background: "rgba(10, 8, 24, 0.85)",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {items.filter(it => !it.locked).slice(0, 4).map((item, i) => {
          const active = item.href ? pathname === item.href || (item.href === '/dashboard' && pathname === '/') : false;
          const IconComp = NavIcon[item.iconKey];

          return (
            <button
              key={i}
              onClick={() => {
                playSound("click");
                if (item.href) router.push(item.href);
              }}
              className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all relative active:scale-95 group"
              style={{
                color: active ? accentColor : "rgba(255, 255, 255, 0.5)",
              }}
            >
              {active && (
                <motion.div
                  layoutId="activeNavMobile"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full shadow-lg"
                  style={{ background: accentColor, boxShadow: `0 0 15px ${accentColor}` }}
                />
              )}
              <span className="group-hover:scale-115 transition-transform"><IconComp /></span>
              <span className="text-[10px] font-black tracking-wider">{t(item.labelKey)}</span>
            </button>
          );
        })}

        {/* Mobile Logout */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all text-red-500/60 hover:text-red-500 active:scale-95"
        >
          <NavIcon.LogOut />
          <span className="text-[10px] font-black tracking-wider">{t("side_logout")}</span>
        </button>
      </nav>
    </>
  );
}
