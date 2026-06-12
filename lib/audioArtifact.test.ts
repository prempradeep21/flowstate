import { describe, expect, it } from "vitest";
import {
  audioArtifactContentFloors,
  audioArtifactWidthForDuration,
  AUDIO_ARTIFACT_BODY_MIN_HEIGHT,
  AUDIO_ARTIFACT_HEIGHT,
  createCatalogAudioPayload,
  formatAudioDuration,
  getDefaultAudioArtifactSize,
  isAudioFile,
  MAX_AUDIO_ARTIFACT_WIDTH,
  WAVEFORM_PX_PER_SECOND,
  waveformContentWidthPx,
} from "@/lib/audioArtifact";

describe("waveformContentWidthPx", () => {
  it("scales linearly with duration above the minimum floor", () => {
    const oneMin = waveformContentWidthPx(60_000);
    const fiveMin = waveformContentWidthPx(300_000);
    expect(fiveMin / oneMin).toBeCloseTo(5, 5);
    expect(oneMin).toBe(60 * WAVEFORM_PX_PER_SECOND);
    expect(fiveMin).toBe(300 * WAVEFORM_PX_PER_SECOND);
  });

  it("never collapses below the minimum waveform width", () => {
    expect(waveformContentWidthPx(0)).toBe(240);
    expect(waveformContentWidthPx(5_000)).toBe(240);
  });
});

describe("audioArtifactWidthForDuration", () => {
  it("grows with duration", () => {
    expect(audioArtifactWidthForDuration(600_000)).toBeGreaterThan(
      audioArtifactWidthForDuration(120_000),
    );
  });

  it("clamps short clips to minimum node width", () => {
    expect(audioArtifactWidthForDuration(60_000)).toBe(280);
  });

  it("clamps at MAX_AUDIO_ARTIFACT_WIDTH", () => {
    const w = audioArtifactWidthForDuration(3_600_000);
    expect(w).toBe(MAX_AUDIO_ARTIFACT_WIDTH);
  });
});

describe("getDefaultAudioArtifactSize", () => {
  it("uses duration-based width and a non-collapsing height", () => {
    const payload = createCatalogAudioPayload("Clip", 120_000, 1);
    const size = getDefaultAudioArtifactSize(payload);
    expect(size.w).toBe(audioArtifactWidthForDuration(120_000));
    expect(size.h).toBe(AUDIO_ARTIFACT_HEIGHT);
    expect(size.h).toBeGreaterThanOrEqual(AUDIO_ARTIFACT_BODY_MIN_HEIGHT);
  });
});

describe("audioArtifactContentFloors", () => {
  it("provides minimum width and height for fill layout", () => {
    const floors = audioArtifactContentFloors(60_000);
    expect(floors.minWidth).toBeGreaterThanOrEqual(240);
    expect(floors.minHeight).toBe(AUDIO_ARTIFACT_BODY_MIN_HEIGHT);
  });
});

describe("formatAudioDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatAudioDuration(65_000)).toBe("1:05");
    expect(formatAudioDuration(300_000)).toBe("5:00");
  });
});

describe("isAudioFile", () => {
  it("accepts common audio extensions", () => {
    expect(isAudioFile(new File([], "clip.mp3", { type: "audio/mpeg" }))).toBe(
      true,
    );
    expect(isAudioFile(new File([], "clip.wav", { type: "audio/wav" }))).toBe(
      true,
    );
  });

  it("rejects video containers", () => {
    expect(
      isAudioFile(new File([], "clip.mp4", { type: "video/mp4" })),
    ).toBe(false);
  });
});
