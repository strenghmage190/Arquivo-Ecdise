import React, { useState, useRef } from 'react';

export default function ForensicBenchmark({ defaultSrc = '' }: { defaultSrc?: string }) {
  const [src, setSrc] = useState<string>(defaultSrc);
  const [channel, setChannel] = useState<'all' | 'r' | 'g' | 'b'>('r');
  const [runs, setRuns] = useState<number>(5);
  const [workerTimes, setWorkerTimes] = useState<number[] | null>(null);
  const [mainTimes, setMainTimes] = useState<number[] | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const MAX_DIM = 800;

  async function runMainThread() {
    if (!src) return;
    setRunning(true);
    setMainTimes(null);
    try {
      const resp = await fetch(src, { mode: 'cors' });
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      const naturalW = bmp.width || 1024;
      const naturalH = bmp.height || 768;
      const scale = Math.min(1, MAX_DIM / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-ctx');

      const times: number[] = [];
      for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let p = 0, len = d.length; p < len; p += 4) {
          const r = d[p], g = d[p + 1], b = d[p + 2];
          let intensity = 0, cr = 0, cg = 0, cb = 0;
          if (channel === 'r') { intensity = r; cr = 255; }
          else if (channel === 'g') { intensity = g; cg = 255; }
          else if (channel === 'b') { intensity = b; cb = 255; }
          d[p] = cr; d[p + 1] = cg; d[p + 2] = cb;
          d[p + 3] = Math.max(0, Math.min(255, Math.round(intensity)));
        }
        ctx.putImageData(imageData, 0, 0);
        const t1 = performance.now();
        times.push(t1 - t0);
        // yield to the event loop briefly to keep UI responsive
        await new Promise((r) => setTimeout(r, 12));
      }

      try { bmp.close?.(); } catch (e) {}
      setMainTimes(times);
    } catch (e) {
      console.error('main benchmark failed', e);
    } finally {
      setRunning(false);
    }
  }

  async function runWorker() {
    if (!src) return;
    setRunning(true);
    setWorkerTimes(null);
    try {
      // create worker lazily
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../../workers/benchmarkWorker.ts', import.meta.url), { type: 'module' });
      }
      const w = workerRef.current;

      await new Promise<void>((resolve, reject) => {
        const onMsg = (ev: MessageEvent) => {
          const data = ev.data as any;
          if (!data) return;
          if (data.type === 'result') {
            setWorkerTimes(data.times || null);
            w.removeEventListener('message', onMsg);
            resolve();
          } else if (data.type === 'error') {
            w.removeEventListener('message', onMsg);
            reject(new Error(data.message || 'worker error'));
          }
        };
        w.addEventListener('message', onMsg);
        w.postMessage({ type: 'run', src, channel, runs, maxDim: MAX_DIM });
      });
    } catch (e) {
      console.error('worker benchmark failed', e);
    } finally {
      setRunning(false);
    }
  }

  function avg(arr: number[] | null) {
    if (!arr || arr.length === 0) return 0;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
  }

  return (
    <div style={{ padding: 'var(--space-4, 16px)', fontFamily: 'var(--font-system, monospace)', color: 'var(--text-primary, #f1f5f9)', maxWidth: 800, margin: '0 auto' }}>
      <h3 style={{ fontFamily: 'var(--font-hud, sans-serif)', color: 'var(--ordo-red, #e63946)', letterSpacing: '1px' }}>
        FORENSIC CANVAS BENCHMARK
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2, 8px)', alignItems: 'center', marginBottom: 'var(--space-3, 12px)' }}>
        <input
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          placeholder="Image URL (CORS enabled)"
          style={{
            flex: '1 1 240px',
            minHeight: 'var(--control-h-md, 40px)',
            padding: '8px 12px',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            color: '#fff',
            fontSize: '16px',
            borderRadius: 'var(--radius-sm, 4px)'
          }}
        />
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as any)}
          style={{
            minHeight: 'var(--control-h-md, 40px)',
            padding: '8px 12px',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            color: '#fff',
            borderRadius: 'var(--radius-sm, 4px)',
            fontSize: '14px'
          }}
        >
          <option value="all">all channels</option>
          <option value="r">red (r)</option>
          <option value="g">green (g)</option>
          <option value="b">blue (b)</option>
        </select>
        <input
          type="number"
          value={runs}
          onChange={(e) => setRuns(Number(e.target.value))}
          style={{
            width: 72,
            minHeight: 'var(--control-h-md, 40px)',
            padding: '8px',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            color: '#fff',
            borderRadius: 'var(--radius-sm, 4px)',
            fontSize: '14px'
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={runMainThread}
            disabled={running || !src}
            style={{
              minHeight: 'var(--control-h-md, 40px)',
              padding: '8px 16px',
              background: 'rgba(230, 57, 70, 0.2)',
              border: '1px solid var(--ordo-red, #e63946)',
              color: '#fff',
              cursor: running || !src ? 'not-allowed' : 'pointer',
              borderRadius: 'var(--radius-sm, 4px)',
              fontFamily: 'inherit',
              fontWeight: 'bold'
            }}
          >
            Run Main
          </button>
          <button
            onClick={runWorker}
            disabled={running || !src}
            style={{
              minHeight: 'var(--control-h-md, 40px)',
              padding: '8px 16px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid var(--primary, #a855f7)',
              color: '#fff',
              cursor: running || !src ? 'not-allowed' : 'pointer',
              borderRadius: 'var(--radius-sm, 4px)',
              fontFamily: 'inherit',
              fontWeight: 'bold'
            }}
          >
            Run Worker
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-4, 16px)', padding: 'var(--space-3, 12px)', background: 'var(--surface, #11141b)', border: '1px solid var(--border, #29313d)', borderRadius: 'var(--radius-sm, 4px)' }}>
        <div style={{ marginBottom: 6 }}>Main-thread: <strong>{mainTimes ? `${avg(mainTimes)} ms avg (${mainTimes.length} runs)` : '—'}</strong></div>
        <div>Worker: <strong>{workerTimes ? `${avg(workerTimes)} ms avg (${workerTimes.length} runs)` : '—'}</strong></div>
      </div>

      <div style={{ marginTop: 'var(--space-3, 12px)', color: 'var(--text-secondary, #94a3b8)', fontSize: 'var(--font-size-xs, 12px)' }}>
        <small>Notes: runs do a full draw + pixel-loop similar to production. Worker uses OffscreenCanvas.</small>
      </div>
    </div>
  );
}
