import React from 'react';
import ForensicBenchmark from '../../components/bench/ForensicBenchmark';

export default function ForensicBenchmarkPage() {
  // defaultSrc can be empty; user can paste any CORS-enabled image URL
  return (
    <div style={{ padding: 20 }}>
      <h2>Dev: Forensic Benchmark</h2>
      <ForensicBenchmark defaultSrc="" />
    </div>
  );
}
