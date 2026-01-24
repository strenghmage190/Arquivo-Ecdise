import { isExtendedPerformanceMode, getOptimizedInterval, markPerfKeep } from './performance';

export { markPerfKeep };

export function throttle<T extends (...args: any[]) => void>(fn: T, wait = 100) {
  let last = 0;
  let timer: any = null;
  return function throttled(this: any, ...args: any[]) {
    const now = Date.now();
    const effWait = getOptimizedInterval(wait, isExtendedPerformanceMode() ? 3 : 1);
    if (now - last >= effWait) {
      last = now;
      fn.apply(this, args);
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      last = Date.now();
      fn.apply(this, args);
    }, effWait - (now - last));
  } as T;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let timer: any = null;
  return function debounced(this: any, ...args: any[]) {
    clearTimeout(timer);
    const effWait = getOptimizedInterval(wait, isExtendedPerformanceMode() ? 3 : 1);
    timer = setTimeout(() => fn.apply(this, args), effWait);
  } as T;
}

export function startAdaptiveLoop(cb: (dt: number) => void, targetFps = 30) {
  let rafId = 0;
  let last = performance.now();
  let running = true;
  const minDt = 1000 / targetFps;

  function loop(now: number) {
    if (!running) return;
    const dt = now - last;
    const effMinDt = getOptimizedInterval(minDt, isExtendedPerformanceMode() ? 2 : 1);
    if (dt >= effMinDt) {
      cb(dt);
      last = now;
    }
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
  return {
    stop() { running = false; if (rafId) cancelAnimationFrame(rafId); },
    start() { if (!running) { running = true; last = performance.now(); rafId = requestAnimationFrame(loop); } },
  };
}

export function createCanvasController(canvas: HTMLCanvasElement | null, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (!canvas) {
    return { start: () => {}, stop: () => {}, setScale: (_: number) => {} };
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return { start: () => {}, stop: () => {}, setScale: (_: number) => {} };

  let running = false;
  let scale = 1;
  let raf = 0;

  function paint() {
    if (!running) return;
    try {
      const dpr = Math.max(1, (window.devicePixelRatio || 1) * scale);
      const w = Math.floor(canvas.width * dpr);
      const h = Math.floor(canvas.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${w / dpr}px`;
        canvas.style.height = `${h / dpr}px`;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      draw(ctx);
    } catch (e) { /* swallow draw errors */ }
    raf = requestAnimationFrame(paint);
  }

  return {
    start() { if (!running) { running = true; raf = requestAnimationFrame(paint); } },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); },
    setScale(s: number) { scale = s; },
    markKeep(el: HTMLElement | null) { return markPerfKeep(el); },
  };
}

