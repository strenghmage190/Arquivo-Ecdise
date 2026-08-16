/**
 * dspAudioEngine.ts
 * Off-line DSP processing using OfflineAudioContext.
 * Source → [Filter 1 → Filter 2 → … → Filter N] → Destination
 */

export interface DSPFilterNode {
  id: string;
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  detune: number;
  /** Used by peaking / lowshelf / highshelf (dB). Default: 0 */
  gain?: number;
}

export interface RegionOption {
  start: number; // seconds
  end: number;   // seconds
}

/**
 * processAudioChain
 * ─────────────────
 * Renders the full filter chain offline as fast as possible.
 *
 * Graph:
 *   BufferSource ──► Filter₁ ──► Filter₂ ──► … ──► GainNode ──► Destination
 *
 * @param samples   Raw Float32 PCM (mono)
 * @param sampleRate
 * @param filters   Ordered list of DSPFilterNode descriptors
 * @param region    Optional time crop; null = full buffer
 * @returns { samples: Float32Array, sampleRate: number }
 */
export async function processAudioChain(
  samples: Float32Array,
  sampleRate: number,
  filters: DSPFilterNode[],
  region: RegionOption | null
): Promise<{ samples: Float32Array; sampleRate: number }> {
  // ── 1. Compute region bounds ────────────────────────────────────────────────
  const totalDuration = samples.length / sampleRate;
  const startSec = region ? Math.max(0, region.start) : 0;
  const endSec   = region ? Math.min(totalDuration, region.end) : totalDuration;

  const durationSec   = Math.max(0.001, endSec - startSec);
  const startOffset   = Math.floor(startSec * sampleRate);
  const lengthSamples = Math.min(
    Math.floor(durationSec * sampleRate),
    samples.length - startOffset
  );

  if (lengthSamples <= 0) {
    return { samples: new Float32Array(0), sampleRate };
  }

  // ── 2. Build OfflineAudioContext ───────────────────────────────────────────
  const OffCtx =
    window.OfflineAudioContext ||
    (window as any).webkitOfflineAudioContext;

  const offlineCtx = new OffCtx(
    1,               // mono
    lengthSamples,
    sampleRate
  ) as OfflineAudioContext;

  // ── 3. Create and populate AudioBuffer (cropped region) ────────────────────
  const audioBuffer = offlineCtx.createBuffer(1, lengthSamples, sampleRate);
  const ch = audioBuffer.getChannelData(0);
  for (let i = 0; i < lengthSamples; i++) {
    ch[i] = samples[startOffset + i] ?? 0;
  }

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // ── 4. Build the filter chain dynamically ─────────────────────────────────
  // Source → F₁ → F₂ → … → Fₙ → GainNode → Destination
  let lastNode: AudioNode = source;

  for (const f of filters) {
    const bq = offlineCtx.createBiquadFilter();

    // Set type first — some browsers require it before setting frequency
    bq.type      = f.type;
    bq.frequency.setValueAtTime(Math.max(1, f.frequency), 0);
    bq.Q.setValueAtTime(Math.max(0.001, f.Q), 0);
    bq.detune.setValueAtTime(f.detune ?? 0, 0);

    // gain is only meaningful for peaking / lowshelf / highshelf
    if (f.gain !== undefined) {
      bq.gain.setValueAtTime(f.gain, 0);
    }

    lastNode.connect(bq);
    lastNode = bq;
  }

  // Final gain node — useful for makeup gain after aggressive filtering
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(1.0, 0);
  lastNode.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  // ── 5. Render ──────────────────────────────────────────────────────────────
  source.start(0);
  const rendered = await offlineCtx.startRendering();

  // Defensive copy: getChannelData() returns a view into the AudioBuffer's
  // internal memory which may be reclaimed after the context is GC'd.
  const rawView = rendered.getChannelData(0);
  const output = new Float32Array(rawView.length);
  output.set(rawView);

  return { samples: output, sampleRate: rendered.sampleRate };
}

/**
 * previewFilterChain
 * ──────────────────
 * Connects live BiquadFilterNodes to an *online* AudioContext for
 * real-time preview (e.g. while the user tweaks Q / frequency sliders).
 *
 * Call the returned `stop()` when the preview should end.
 */
export function previewFilterChain(
  samples: Float32Array,
  sampleRate: number,
  filters: DSPFilterNode[]
): { stop: () => void } {
  const ac = new (window.AudioContext || (window as any).webkitAudioContext)() as AudioContext;

  const buf = ac.createBuffer(1, samples.length, sampleRate);
  buf.getChannelData(0).set(samples);

  const source = ac.createBufferSource();
  source.buffer = buf;

  let lastNode: AudioNode = source;
  for (const f of filters) {
    const bq = ac.createBiquadFilter();
    bq.type = f.type;
    bq.frequency.value = Math.max(1, f.frequency);
    bq.Q.value = Math.max(0.001, f.Q);
    bq.detune.value = f.detune ?? 0;
    if (f.gain !== undefined) bq.gain.value = f.gain;
    lastNode.connect(bq);
    lastNode = bq;
  }

  lastNode.connect(ac.destination);
  source.start(0);

  return {
    stop: () => {
      try { source.stop(); } catch { /* already stopped */ }
      ac.close();
    },
  };
}
