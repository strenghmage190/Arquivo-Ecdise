import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import type { RegionOption } from '../../../utils/dspAudioEngine';
import './AudioLab.css';

interface InteractiveWaveformProps {
  samples: Float32Array;
  sampleRate: number;
  onRegionChange: (region: RegionOption | null) => void;
}

export default function InteractiveWaveform({ samples, sampleRate, onRegionChange }: InteractiveWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any | null>(null);
  const regionsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !samples.length) return;

    // Create a Blob from samples to load into wavesurfer
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataBytes = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(buffer);
    const wsHeader = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    wsHeader(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true);
    wsHeader(8, 'WAVE'); wsHeader(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
    wsHeader(36, 'data'); view.setUint32(40, dataBytes, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
    const blob = new Blob([view], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#00f3ff',
      progressColor: '#bc13fe',
      cursorColor: '#fff',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      plugins: [regions]
    });

    ws.load(url);

    ws.on('ready', () => {
      // By default, no region is selected. The user can drag to create one.
      regions.enableDragSelection({
        color: 'rgba(188, 19, 254, 0.3)'
      });
    });

    regions.on('region-updated', (region: any) => {
      // Ensure only one region exists
      const allRegions = regions.getRegions();
      allRegions.forEach((r: any) => {
        if (r.id !== region.id) r.remove();
      });
      onRegionChange({ start: region.start, end: region.end });
    });

    regions.on('region-created', (region: any) => {
      const allRegions = regions.getRegions();
      allRegions.forEach((r: any) => {
        if (r.id !== region.id) r.remove();
      });
      onRegionChange({ start: region.start, end: region.end });
    });

    // If user clicks outside region, clear it
    ws.on('interaction', () => {
      // if click is outside region, maybe clear?
      // Actually Wavesurfer regions plugin handles clicking outside to create a new region.
    });

    wsRef.current = ws;

    return () => {
      ws.destroy();
      URL.revokeObjectURL(url);
    };
  }, [samples, sampleRate, onRegionChange]);

  const clearRegion = () => {
    if (regionsRef.current) {
      regionsRef.current.getRegions().forEach((r: any) => r.remove());
      onRegionChange(null);
    }
  };

  return (
    <div className="al-interactive-waveform">
      <div ref={containerRef} className="al-iw-container" />
      <button className="al-btn-ghost al-btn-sm" onClick={clearRegion} style={{ marginTop: '4px' }}>
        Limpar Seleção (Exportar Tudo)
      </button>
    </div>
  );
}
