import React, { useState, useRef, useEffect } from 'react';
import './SignalReconstructor.css';
import { isExtendedPerformanceMode } from '../../utils/performance';

interface Props {
  realText: string;
  targetFreq?: number; // A frequência "correta" para ler o texto
}

export default function SignalReconstructor({ realText, targetFreq = 115 }: Props) {
  const [xy, setXy] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [freq, setFreq] = useState(60); // Frequência atual do jogador
  const [glitchedText, setGlitchedText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Gera texto aleatório que muda constantemente (efeito hacker)
  useEffect(() => {
    if (isExtendedPerformanceMode()) {
      setGlitchedText(realText); // Show real text directly in performance mode
      return;
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*§ØΔΩ";
    const interval = setInterval(() => {
      let res = realText.split('').map(char => 
        char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]
      ).join('');
      setGlitchedText(res);
    }, 70);
    return () => clearInterval(interval);
  }, [realText]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setXy({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Cálculo de quão próximo o jogador está da frequência certa (0 a 1)
  const accuracy = Math.max(0, 1 - Math.abs(freq - targetFreq) / 50);

  return (
    <div className="signal-reconstructor">
      <div className="terminal-header">
        <span className="status-dot"></span>
        <span className="terminal-title">RECONSTRUTOR DE SINAL V.4.02</span>
        <div className="system-stats">SINAL: {(accuracy * 100).toFixed(0)}%</div>
      </div>

      <div className="controls-panel">
        <div className="freq-display">
          <label>FREQ_TUNING:</label>
          <input 
            type="range" min="20" max="200" 
            value={freq} 
            onChange={(e) => setFreq(Number(e.target.value))} 
          />
          <span className={`freq-readout ${accuracy > 0.9 ? 'locked' : ''}`}>
            {freq}Hz
          </span>
        </div>
        <button 
          className={`power-btn ${active ? 'on' : ''}`}
          onClick={() => setActive(!active)}
        >
          {active ? 'INTERROMPER LINK' : 'INICIAR SCAN'}
        </button>
      </div>

      <div 
        className={`viewport ${active ? 'scanning' : ''}`}
        ref={containerRef}
        onMouseMove={handleMouseMove}
      >
        {/* Camada 1: O Ruído (Texto Glitched) */}
        <p className="layer noise-layer">{glitchedText}</p>

        {/* Camada 2: O Sinal (Texto Real com clip-path) */}
        <p 
          className="layer signal-layer"
          style={{
            clipPath: active ? `circle(80px at ${xy.x}px ${xy.y}px)` : `circle(0 at 0 0)`,
            filter: `blur(${(1 - accuracy) * 5}px)`, // Fica embaçado se a freq estiver errada
            opacity: accuracy
          }}
        >
          {realText}
        </p>

        {/* Efeito Visual da Lente */}
        {active && (
          <div 
            className="scan-reticle"
            style={{ 
              left: xy.x - 80, 
              top: xy.y - 80,
              borderColor: accuracy > 0.9 ? '#00ff00' : '#ff0000'
            }}
          >
            <div className="reticle-label">SINTONIZANDO...</div>
          </div>
        )}
        
        <div className="scanlines"></div>
      </div>
      
      <div className="terminal-footer">
        [AVISO: INTERFERÊNCIA DETECTADA NA CAMADA 7]
      </div>
    </div>
  );
}
