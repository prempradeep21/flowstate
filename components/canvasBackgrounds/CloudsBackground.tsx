"use client";

import { useMemo } from "react";
import { createNoise2D } from "simplex-noise";
import {
  ProceduralCanvasBackground,
  type CanvasDrawContext,
} from "@/components/canvasBackgrounds/ProceduralCanvasBackground";
import type { BackgroundRenderProps } from "@/components/canvasBackgrounds/types";

const noise2D = createNoise2D();

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hashNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function drawClouds({ ctx, width, height, time, animate }: CanvasDrawContext) {
  const t = animate ? time * 0.04 : 0;

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#9EC5E8");
  sky.addColorStop(0.45, "#C8DCF0");
  sky.addColorStop(1, "#F5F8FC");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const scale = 0.003;
  const step = width > 800 ? 2 : 1;

  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      let density = 0;
      let amp = 1;
      let freq = 1;
      for (let octave = 0; octave < 3; octave++) {
        density +=
          noise2D(px * scale * freq + t, py * scale * freq + t * 0.7) * amp;
        amp *= 0.5;
        freq *= 2;
      }
      density = (density + 1) * 0.5;
      const alpha = smoothstep(0.42, 0.68, density);

      if (alpha > 0.01) {
        const cloudWhite = 245 + density * 10;
        for (let dy = 0; dy < step && py + dy < height; dy++) {
          for (let dx = 0; dx < step && px + dx < width; dx++) {
            const i = ((py + dy) * width + (px + dx)) * 4;
            const blend = alpha * 0.85;
            data[i] = data[i]! * (1 - blend) + cloudWhite * blend;
            data[i + 1] = data[i + 1]! * (1 - blend) + cloudWhite * blend;
            data[i + 2] = data[i + 2]! * (1 - blend) + (cloudWhite + 5) * blend;
          }
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Film grain overlay
  const grainStrength = 0.06;
  const grainData = ctx.getImageData(0, 0, width, height);
  const gd = grainData.data;
  const grainStep = width > 800 ? 2 : 1;
  for (let py = 0; py < height; py += grainStep) {
    for (let px = 0; px < width; px += grainStep) {
      const n = hashNoise(px, py, time * 100) * 2 - 1;
      for (let dy = 0; dy < grainStep && py + dy < height; dy++) {
        for (let dx = 0; dx < grainStep && px + dx < width; dx++) {
          const i = ((py + dy) * width + (px + dx)) * 4;
          gd[i] = Math.max(0, Math.min(255, gd[i]! + n * grainStrength * 255));
          gd[i + 1] = Math.max(
            0,
            Math.min(255, gd[i + 1]! + n * grainStrength * 255),
          );
          gd[i + 2] = Math.max(
            0,
            Math.min(255, gd[i + 2]! + n * grainStrength * 255),
          );
        }
      }
    }
  }
  ctx.putImageData(grainData, 0, 0);
}

export function CloudsBackground({
  animate = true,
  className,
}: BackgroundRenderProps) {
  const draw = useMemo(() => drawClouds, []);
  return (
    <ProceduralCanvasBackground
      draw={draw}
      animate={animate}
      className={className}
    />
  );
}
