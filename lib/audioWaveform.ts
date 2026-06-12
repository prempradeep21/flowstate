import { WAVEFORM_PEAK_BINS } from "@/lib/audioArtifact";

export interface WaveformExtractionResult {
  durationMs: number;
  peaks: number[];
}

/**
 * Decode audio in the browser and downsample channel 0 into normalized peak bins.
 */
export async function extractWaveformPeaks(
  file: File,
): Promise<WaveformExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;

  if (!AudioCtx) {
    throw new Error("Web Audio API is not available in this browser.");
  }

  const context = new AudioCtx();
  try {
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    const durationMs = Math.max(0, Math.round(audioBuffer.duration * 1000));
    const channel = audioBuffer.getChannelData(0);
    const peaks = downsamplePeaks(channel, WAVEFORM_PEAK_BINS);
    return { durationMs, peaks };
  } finally {
    await context.close().catch(() => undefined);
  }
}

function downsamplePeaks(samples: Float32Array, bins: number): number[] {
  if (samples.length === 0 || bins <= 0) {
    return Array.from({ length: bins }, () => 0);
  }

  const peaks: number[] = [];
  const blockSize = Math.max(1, Math.floor(samples.length / bins));

  for (let i = 0; i < bins; i++) {
    const start = i * blockSize;
    const end = i === bins - 1 ? samples.length : start + blockSize;
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(samples[j] ?? 0);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  const globalMax = Math.max(...peaks, 0.0001);
  return peaks.map((p) => p / globalMax);
}
