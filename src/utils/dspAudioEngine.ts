export interface DSPFilterNode {
  id: string;
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  detune: number;
}

export interface RegionOption {
  start: number; // in seconds
  end: number; // in seconds
}

/**
 * Process a given Float32Array audio buffer through an OfflineAudioContext,
 * applying the specified BiquadFilterNodes and cropping it to the region.
 * Returns the processed Float32Array and the sample rate.
 */
export async function processAudioChain(
  samples: Float32Array,
  sampleRate: number,
  filters: DSPFilterNode[],
  region: RegionOption | null
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const startSec = region ? Math.max(0, region.start) : 0;
  let endSec = region ? Math.min(samples.length / sampleRate, region.end) : samples.length / sampleRate;
  
  if (startSec >= endSec) {
    endSec = startSec + 0.1; // minimum 100ms
  }

  const durationSec = endSec - startSec;
  const startOffset = Math.floor(startSec * sampleRate);
  const lengthSamples = Math.floor(durationSec * sampleRate);

  // Fallback in case of rounding issues
  const actualLength = Math.min(lengthSamples, samples.length - startOffset);
  
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, actualLength, sampleRate);

  // Create source buffer
  const audioBuffer = offlineCtx.createBuffer(1, actualLength, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Copy the cropped samples into the buffer
  for (let i = 0; i < actualLength; i++) {
    channelData[i] = samples[startOffset + i];
  }

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // Build filter chain
  let lastNode: AudioNode = source;

  for (const f of filters) {
    const filterNode = offlineCtx.createBiquadFilter();
    filterNode.type = f.type;
    filterNode.frequency.value = f.frequency;
    filterNode.Q.value = f.Q;
    filterNode.detune.value = f.detune;
    
    lastNode.connect(filterNode);
    lastNode = filterNode;
  }

  lastNode.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const renderedSamples = renderedBuffer.getChannelData(0);

  return {
    samples: renderedSamples,
    sampleRate: renderedBuffer.sampleRate
  };
}
