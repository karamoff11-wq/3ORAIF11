"use client";

import React from "react";
import { Vortex } from "@/components/Vortex";
import { useFeedbackStore } from "@/store/feedbackStore";

export function VortexDemoSecond() {
  const { lang } = useFeedbackStore();
  const isRtl = lang === "AR";

  return (
    <div className="w-[calc(100%-4rem)] mx-auto rounded-3xl h-[600px] overflow-hidden shadow-[0_0_80px_-20px_rgba(34,197,94,0.5)] border border-white/10 my-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <Vortex
        backgroundColor="black"
        rangeY={800}
        particleCount={500}
        baseHue={120} // Emerald / Cyan aurora
        className="flex items-center flex-col justify-center px-6 md:px-10 py-12 w-full h-full text-center"
      >
        <h2 className="text-white text-3xl md:text-6xl font-black tracking-tighter leading-tight drop-shadow-[0_0_30px_rgba(34,197,94,0.6)]">
          {isRtl ? 'ما هذا العالم المذهل؟' : 'The hell is this?'}
        </h2>
        <p className="text-white/80 text-base md:text-2xl max-w-xl mt-6 font-medium leading-relaxed">
          {isRtl 
            ? 'هذه تجربة بصرية مفعمة بالطاقة الديناميكية. ستأخذك في رحلة فريدة من الألوان والأبعاد اللامتناهية.' 
            : "This is chemical burn. It'll hurt more than you've ever been burned and you'll have a scar."
          }
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 z-20">
          <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 font-black rounded-2xl text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 uppercase tracking-widest text-sm">
            {isRtl ? 'اطلب الآن' : 'Order now'}
          </button>
          <button className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 font-bold rounded-2xl text-white hover:scale-105 active:scale-95 tracking-wide text-sm">
            {isRtl ? 'شاهد المقطع الدعائي' : 'Watch trailer'}
          </button>
        </div>
      </Vortex>
    </div>
  );
}
