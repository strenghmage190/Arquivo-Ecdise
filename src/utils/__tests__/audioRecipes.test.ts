import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

import {
  buildQuickLsbRecipe,
  buildSceneEffectRecipe,
  buildSpectrogramSecretRecipe,
  buildStereoDiffVoiceRecipe,
} from '../audioRecipes';
import { decodeLSB } from '../lsbStegoEngine';

describe('audioRecipes (1-Click GM Audio Forge)', () => {
  test('buildSceneEffectRecipe produces valid WAV output for radio, telephone, and cassette', () => {
    const base = new Float32Array(4800).fill(0.2);
    for (const fx of ['radio', 'telephone', 'cassette'] as const) {
      const res = buildSceneEffectRecipe(base, fx, 48000);
      expect(res.left.length).toBe(4800);
      expect(res.wavBlob.type).toBe('audio/wav');
      expect(res.wavBlob.size).toBeGreaterThan(44);
    }
  });

  test('buildStereoDiffVoiceRecipe cancels cover in Diff (L-R) and recovers secret signal', () => {
    const secret = new Float32Array(1000);
    const cover = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      secret[i] = Math.sin(i * 0.1) * 0.8;
      cover[i] = 0.5; // constant DC cover
    }

    const res = buildStereoDiffVoiceRecipe(secret, cover, 48000);
    expect(res.right).not.toBeNull();
    // In Diff (L - R), cover cancels to 0 and secret doubles!
    const diffAt10 = (res.left[10] - res.right![10]) * 0.5;
    expect(diffAt10).toBeCloseTo(secret[10] * 0.42, 4);
    // In Mix (L + R), secret cancels to 0 and only cover remains!
    const mixAt10 = (res.left[10] + res.right![10]) * 0.5;
    expect(mixAt10).toBeCloseTo(cover[10] * 0.55, 4);
  });

  test('buildQuickLsbRecipe embeds and decodes hidden message round-trip', () => {
    const res = buildQuickLsbRecipe('SALA 4B - ECDISE', null, 'ORDO', 48000);
    const decoded = decodeLSB(res.left, 'ORDO');
    expect(decoded).toBe('SALA 4B - ECDISE');
  });

  test('buildSpectrogramSecretRecipe generates stereo WAV with embedded matrix', () => {
    const matrix = {
      width: 16,
      height: 16,
      data: new Uint8ClampedArray(16 * 16 * 4).fill(200),
    };
    const res = buildSpectrogramSecretRecipe('ORDO', null, {
      sampleRate: 48000,
      durationSec: 2.5,
      matrixOverride: matrix,
    });
    expect(res.left.length).toBe(48000 * 2.5);
    expect(res.right).not.toBeNull();
    expect(res.wavBlob.size).toBeGreaterThan(44);
  });
});
