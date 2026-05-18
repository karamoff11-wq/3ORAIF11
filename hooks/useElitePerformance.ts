'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEDICATED WEB WORKER GAME CLOCK (DRIFT-FREE SUB-MS ACCURACY)
// ─────────────────────────────────────────────────────────────────────────────
export function useDriftFreeTimer({
  initialSeconds,
  running,
  onTick,
  onExpire,
}: {
  initialSeconds: number;
  running: boolean;
  onTick: (remainingSeconds: number) => void;
  onExpire: () => void;
}) {
  const workerRef = useRef<Worker | null>(null);
  const remainingRef = useRef(initialSeconds);
  remainingRef.current = initialSeconds;

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const workerCode = `
      let timerId = null;
      let targetTime = null;

      self.onmessage = function(e) {
        if (e.data.command === 'start') {
          if (timerId) clearInterval(timerId);
          targetTime = performance.now() + e.data.seconds * 1000;
          
          timerId = setInterval(() => {
            const now = performance.now();
            const left = Math.ceil((targetTime - now) / 1000);
            if (left <= 0) {
              clearInterval(timerId);
              timerId = null;
              self.postMessage({ type: 'expire' });
            } else {
              self.postMessage({ type: 'tick', left });
            }
          }, 250);
        } else if (e.data.command === 'stop') {
          if (timerId) clearInterval(timerId);
          timerId = null;
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === 'tick') {
        if (e.data.left !== remainingRef.current) {
          remainingRef.current = e.data.left;
          onTickRef.current(e.data.left);
        }
      } else if (e.data.type === 'expire') {
        remainingRef.current = 0;
        onExpireRef.current();
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (running && workerRef.current) {
      workerRef.current.postMessage({ command: 'start', seconds: remainingRef.current });
    } else if (!running && workerRef.current) {
      workerRef.current.postMessage({ command: 'stop' });
    }
  }, [running]);

  const adjustTimer = useCallback((newSeconds: number) => {
    remainingRef.current = newSeconds;
    if (workerRef.current && running) {
      workerRef.current.postMessage({ command: 'start', seconds: newSeconds });
    }
    onTickRef.current(newSeconds);
  }, [running]);

  return { adjustTimer };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ZERO-LATENCY ASSET & AUDIO PREFLIGHT CACHE
// ─────────────────────────────────────────────────────────────────────────────
export function usePreflightWarmup(questions: { question?: { image_url?: string | null } }[]) {
  useEffect(() => {
    if (typeof window === 'undefined' || !questions.length) return;

    // Warm up image textures into GPU cache
    const urls = new Set<string>();
    questions.forEach(q => { if (q.question?.image_url) urls.add(q.question.image_url); });

    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    // Warm up Web Audio Context
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001; // Silent warmup
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.01);
      }
    } catch (e) { }
  }, [questions]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SUB-MS ANTI-CHEAT & INPUT LATENCY GUARD
// ─────────────────────────────────────────────────────────────────────────────
export function useAntiCheatBuzzer(onValidBuzz: () => void) {
  const lastBuzzTimeRef = useRef<number>(0);

  const triggerBuzz = useCallback(() => {
    const now = performance.now();
    if (now - lastBuzzTimeRef.current < 250) {
      console.warn('[Anti-Cheat] Ignored rapid duplicate buzz / ghost click');
      return;
    }
    lastBuzzTimeRef.current = now;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch (e) { }
    }

    onValidBuzz();
  }, [onValidBuzz]);

  return { triggerBuzz };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. OPTIMISTIC AI / NEXT QUESTION PRE-FETCHER
// ─────────────────────────────────────────────────────────────────────────────
export function useOptimisticQuestionQueue(sessionQuestions: any[], currentQuestionId: string | null) {
  const prefetchQueueRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentQuestionId || !sessionQuestions.length) return;

    const currentIndex = sessionQuestions.findIndex(sq => sq.id === currentQuestionId);
    if (currentIndex !== -1 && currentIndex + 1 < sessionQuestions.length) {
      const nextQ = sessionQuestions[currentIndex + 1];
      if (nextQ && nextQ.question?.image_url && !prefetchQueueRef.current.has(nextQ.id)) {
        prefetchQueueRef.current.add(nextQ.id);
        const img = new Image();
        img.src = nextQ.question.image_url;
      }
    }
  }, [sessionQuestions, currentQuestionId]);
}
