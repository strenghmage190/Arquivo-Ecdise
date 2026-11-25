import {
  synthesizeStegoAudio,
  encodeStereoWavPCM16,
  analyzeAudioAnomalies,
  SAMPLE_RATE_48K,
} from '../audioStegoSynthesizer';

function makeDummyMatrix(w = 32, h = 16) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 4; y < 12; y++) {
    for (let x = 4; x < 28; x++) {
      const idx = (y * w + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

describe('audioStegoSynthesizer', () => {
  it('synthesizes stereo_lr mode so mono sum cancels stego and L-R isolates it', () => {
    const base = new Float32Array(SAMPLE_RATE_48K * 1);
    base.fill(0.1);
    const res = synthesizeStegoAudio({
      mode: 'stereo_lr',
      imageData: makeDummyMatrix(),
      baseLeft: base,
      sampleRate: SAMPLE_RATE_48K,
      startSec: 0.1,
      endSec: 0.9,
      intensity: 0.8,
    });

    expect(res.left.length).toBe(SAMPLE_RATE_48K);
    expect(res.right.length).toBe(SAMPLE_RATE_48K);
    expect(res.discretion).toBe('discreet');
    expect(res.anomaly.hasStereoAsymmetry).toBe(true);

    let maxMonoDiff = 0;
    for (let i = 0; i < res.left.length; i += 50) {
      const mono = (res.left[i] + res.right[i]) * 0.5;
      maxMonoDiff = Math.max(maxMonoDiff, Math.abs(mono - base[i]));
    }
    expect(maxMonoDiff).toBeLessThan(0.01);
  });

  it('detects ultrasonic energy in ghost_zone mode', () => {
    const res = synthesizeStegoAudio({
      mode: 'ghost_zone',
      imageData: makeDummyMatrix(),
      sampleRate: SAMPLE_RATE_48K,
      durationSec: 1,
      startSec: 0.1,
      endSec: 0.9,
      intensity: 0.9,
    });

    const report = analyzeAudioAnomalies(res.left, res.right, SAMPLE_RATE_48K);
    expect(report.hasHighFreqEnergy).toBe(true);
    expect(report.highFreqPeakHz).toBeGreaterThanOrEqual(16800);
    expect(report.highFreqPeakHz).toBeLessThanOrEqual(20500);
  });

  it('encodes valid 48kHz stereo WAV PCM16 Blob', () => {
    const left = new Float32Array(480);
    const right = new Float32Array(480);
    const blob = encodeStereoWavPCM16(left, right, SAMPLE_RATE_48K);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + 480 * 2 * 2);
  });
});
