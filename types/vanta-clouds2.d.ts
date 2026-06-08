declare module "vanta/dist/vanta.clouds2.min" {
  import type * as THREE from "three";

  export interface VantaClouds2Effect {
    destroy(): void;
    setOptions(options: Record<string, unknown>): void;
    resize(): void;
  }

  export interface VantaClouds2Options {
    el: HTMLElement | null;
    THREE: typeof THREE;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    speed?: number;
    backgroundColor?: number;
    skyColor?: number;
    cloudColor?: number;
    lightColor?: number;
    texturePath?: string;
  }

  export default function CLOUDS2(
    options: VantaClouds2Options,
  ): VantaClouds2Effect;
}
