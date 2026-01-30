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
    <div style={{ padding: 12, fontFamily: 'sans-serif' }}>
      <h3>Forensic Canvas Benchmark</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="image URL" style={{ flex: 1 }} />
        <select value={channel} onChange={(e) => setChannel(e.target.value as any)}>
          <option value="all">all</option>
          <option value="r">r</option>
          <option value="g">g</option>
          <option value="b">b</option>
        </select>
        <input type="number" value={runs} onChange={(e) => setRuns(Number(e.target.value))} style={{ width: 64 }} />
        <button onClick={runMainThread} disabled={running || !src}>Run main</button>
        <button onClick={runWorker} disabled={running || !src}>Run worker</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div>Main-thread: {mainTimes ? `${avg(mainTimes)} ms avg (${mainTimes.length} runs)` : '—'}</div>
        <div>Worker: {workerTimes ? `${avg(workerTimes)} ms avg (${workerTimes.length} runs)` : '—'}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <small>Notes: runs do a full draw + pixel-loop similar to production. Worker uses OffscreenCanvas.</small>
      </div>
    </div>
  );
}
