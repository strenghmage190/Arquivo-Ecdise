import React from 'react';
import ForensicBenchmark from '../../components/bench/ForensicBenchmark';

export default function ForensicBenchmarkPage() {
  // defaultSrc can be empty; user can paste any CORS-enabled image URL
  return (
    <main
      style={{
        minHeight: '100dvh',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        background: 'var(--bg, #0b0c10)',
        color: 'var(--text-primary, #f1f5f9)',
        padding:
          'max(var(--space-6, 24px), calc(env(safe-area-inset-top, 0px) + 52px)) max(var(--space-3, 12px), env(safe-area-inset-right, 0px)) max(var(--space-6, 24px), env(safe-area-inset-bottom, 0px)) max(var(--space-3, 12px), env(safe-area-inset-left, 0px))',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto', width: '100%' }}>
        <h2
          style={{
            margin: '0 0 var(--space-3, 12px)',
            fontFamily: 'var(--font-hud, sans-serif)',
            fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Dev: Forensic Benchmark
        </h2>
        <ForensicBenchmark defaultSrc="" />
      </div>
    </main>
  );
}
