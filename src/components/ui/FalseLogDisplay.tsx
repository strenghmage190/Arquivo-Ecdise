import React, { useEffect, useState } from 'react';
import { isExtendedPerformanceMode, getOptimizedInterval } from '../../utils/performance';

const FAKE_LOGS = [
  '[NEXUS.KERNEL] Membrane pressure: 94.2% CRITICAL',
  '[SIGNAL.PROCESSOR] EVP stream dropout detected',
  '[REALITY.ENGINE] Coherence threshold: 0.31',
  '[ARCHIVE.DB] Access denied - clearance insufficient',
  '[TEMPORAL.SYNC] Chrono offset detected: +7.8ms',
  '[CONTAINMENT] Entity signatures: 3 anomalies',
  '[OBSERVER.MODE] Consciousness fragment ratio: 71%',
  '[NEXUS.KERNEL] System stability index: DEGRADING',
  '[SIGNAL.PROCESSOR] Noise floor increasing',
  '[REALITY.ENGINE] Observation collapse imminent',
  '[QUARANTINE.PROTOCOL] Isolation status: ACTIVE',
  '[TIME.DILATION] Clock skew detected',
  '[EVIDENCE.VAULT] Encryption key: ••••••••••••',
  '[SYSTEM.ALERT] Heat signature anomaly sector 7',
  '[DIAGNOSTIC] Cross-reality interference confirmed',
];

interface Props {
  opacity?: number;
}

export const FalseLogDisplay: React.FC<Props> = ({ opacity = 0.06 }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setLogs(
      Array.from({ length: 8 }, () =>
        FAKE_LOGS[Math.floor(Math.random() * FAKE_LOGS.length)]
      )
    );

    const interval = setInterval(() => {
      setLogs((prev) => [
        ...prev.slice(1),
        FAKE_LOGS[Math.floor(Math.random() * FAKE_LOGS.length)],
      ]);
    }, getOptimizedInterval(2000, 5)); // 2000ms normal, 10000ms in performance mode

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        fontSize: '9px',
        fontFamily: "'Courier New', monospace",
        color: '#00f3ff',
        overflow: 'hidden',
        lineHeight: 1.4,
        padding: '12px',
      }}
    >
      {logs.map((log, idx) => (
        <div key={idx}>{log}</div>
      ))}
    </div>
  );
};

export default FalseLogDisplay;
