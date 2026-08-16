import React, { useRef, useEffect } from 'react';

export type ColormapName = 'cyberneon' | 'inferno' | 'viridis';

export interface SpectrogramPreviewCanvasProps {
  imageData: ImageData | null;
  minFreqHz: number;
  maxFreqHz: number;
  durationSec: number;
  colormap: ColormapName;
  intensity?: number;
  mixRatio?: number;
  usePinkNoise?: boolean;
  hasBaseAudio?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Colormap functions: brightness t∈[0,1] → [R, G, B] (0–255)
// ---------------------------------------------------------------------------
const colormapFns: Record<ColormapName, (t: number) => [number, number, number]> = {
  cyberneon: (t) => {
    if (t < 0.01) return [0, 0, 0];
    const c = t * 255;
    // Cyan dominant: #00f3ff — scale through dark → cyan → white
    if (t < 0.5) {
      return [0, Math.floor(c * 1.6), Math.floor(c * 1.8)];
    }
    return [Math.floor((t - 0.5) * 2 * 80), Math.floor(243 * t + 12), 255];
  },
  inferno: (t) => {
    if (t < 0.01) return [0, 0, 0];
    // Black → dark purple → red → orange → yellow → white
    const stops: [number, [number, number, number]][] = [
      [0.0, [0, 0, 4]],
      [0.13, [40, 11, 84]],
      [0.25, [101, 21, 110]],
      [0.38, [159, 42, 99]],
      [0.5, [212, 72, 66]],
      [0.63, [245, 125, 21]],
      [0.75, [252, 180, 25]],
      [0.88, [251, 230, 128]],
      [1.0, [252, 255, 164]],
    ];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const lo = stops[i - 1];
        const hi = stops[i];
        const f = (t - lo[0]) / (hi[0] - lo[0]);
        return [
          Math.floor(lo[1][0] + f * (hi[1][0] - lo[1][0])),
          Math.floor(lo[1][1] + f * (hi[1][1] - lo[1][1])),
          Math.floor(lo[1][2] + f * (hi[1][2] - lo[1][2])),
        ];
      }
    }
    return [252, 255, 164];
  },
  viridis: (t) => {
    if (t < 0.01) return [0, 0, 0];
    const stops: [number, [number, number, number]][] = [
      [0.0, [68, 1, 84]],
      [0.13, [72, 40, 120]],
      [0.25, [62, 74, 137]],
      [0.38, [49, 104, 142]],
      [0.5, [38, 130, 142]],
      [0.63, [31, 158, 137]],
      [0.75, [53, 183, 121]],
      [0.88, [110, 206, 88]],
      [1.0, [253, 231, 37]],
    ];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const lo = stops[i - 1];
        const hi = stops[i];
        const f = (t - lo[0]) / (hi[0] - lo[0]);
        return [
          Math.floor(lo[1][0] + f * (hi[1][0] - lo[1][0])),
          Math.floor(lo[1][1] + f * (hi[1][1] - lo[1][1])),
          Math.floor(lo[1][2] + f * (hi[1][2] - lo[1][2])),
        ];
      }
    }
    return [253, 231, 37];
  },
};

export default function SpectrogramPreviewCanvas({
  imageData,
  minFreqHz,
  maxFreqHz,
  durationSec,
  colormap,
  intensity = 1,
  mixRatio = 0.5,
  usePinkNoise = false,
  hasBaseAudio = false,
  width = 600,
  height = 200,
  className,
}: SpectrogramPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!imageData) {
      // Draw placeholder grid
      ctx.strokeStyle = '#00f3ff22';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      ctx.fillStyle = '#00f3ff44';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados — carregue uma imagem, desenhe ou escreva texto', canvas.width / 2, canvas.height / 2);
      return;
    }

    const fn = colormapFns[colormap];

    // Offscreen: re-map imageData to colormap
    const offscreen = document.createElement('canvas');
    offscreen.width = imageData.width;
    offscreen.height = imageData.height;
    const octx = offscreen.getContext('2d')!;
    const src = imageData.data;
    const out = octx.createImageData(imageData.width, imageData.height);
    const dst = out.data;

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const i = y * imageData.width + x;
        const si = i * 4;
        
        // Brilho do sinal oculto (0..1)
        const srcBrightness = (src[si] + src[si + 1] + src[si + 2]) / 3 / 255;
        
        // Simular o fundo (áudio base ou pink noise)
        let bgBrightness = 0;
        if (usePinkNoise) {
          // Ruído rosa simulado (um pouco de random)
          bgBrightness = Math.random() * 0.4;
        } else if (hasBaseAudio) {
          // Simula frequências graves mais fortes, médias, e alguns picos (bem grosseiro)
          const freqNorm = 1 - (y / imageData.height); // 0 no topo (alta freq), 1 na base (baixa freq)
          const baseEnergy = Math.pow(freqNorm, 2) * 0.6; // Graves mais fortes
          const noise = Math.random() * 0.3;
          // Adiciona faixas verticais aleatórias pra simular batidas/ritmo
          const beat = Math.sin(x * 0.1) > 0.8 ? 0.2 : 0;
          bgBrightness = Math.min(1, baseEnergy + noise + beat);
        }

        let finalBrightness = srcBrightness;

        if (usePinkNoise || hasBaseAudio) {
          // Mixer Equation: Fundo*(1 - mix) + Imagem*(mix * intensity)
          const imgVal = srcBrightness * intensity;
          finalBrightness = bgBrightness * (1 - mixRatio) + imgVal * mixRatio;
        }

        const [r, g, b] = fn(finalBrightness);
        dst[si] = r;
        dst[si + 1] = g;
        dst[si + 2] = b;
        dst[si + 3] = 255;
      }
    }

    octx.putImageData(out, 0, 0);

    // Draw scaled to canvas
    const AXIS_LEFT = 46;
    const AXIS_BOTTOM = 18;
    const drawW = canvas.width - AXIS_LEFT;
    const drawH = canvas.height - AXIS_BOTTOM;

    ctx.drawImage(offscreen, AXIS_LEFT, 0, drawW, drawH);

    // Y-axis labels (Hz)
    ctx.fillStyle = '#00f3ffbb';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    const hzRange = maxFreqHz - minFreqHz;
    const tickCount = 5;
    for (let t = 0; t <= tickCount; t++) {
      const y = Math.floor((t / tickCount) * drawH);
      const hz = maxFreqHz - (t / tickCount) * hzRange;
      const label = hz >= 1000 ? `${(hz / 1000).toFixed(0)}k` : `${hz.toFixed(0)}`;
      ctx.fillText(label, AXIS_LEFT - 4, y + 4);
      ctx.strokeStyle = '#00f3ff22';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(AXIS_LEFT, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // X-axis labels (time)
    ctx.fillStyle = '#00f3ffbb';
    ctx.textAlign = 'center';
    const timeStops = [0, 0.25, 0.5, 0.75, 1];
    for (const frac of timeStops) {
      const x = AXIS_LEFT + Math.floor(frac * drawW);
      const t = frac * durationSec;
      const label = t < 10 ? `${t.toFixed(1)}s` : `${Math.round(t)}s`;
      ctx.fillText(label, x, canvas.height - 2);
    }

    // Border
    ctx.strokeStyle = '#00f3ff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(AXIS_LEFT, 0, drawW, drawH);
  }, [imageData, colormap, minFreqHz, maxFreqHz, durationSec, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', background: '#000', borderRadius: 4 }}
    />
  );
}
