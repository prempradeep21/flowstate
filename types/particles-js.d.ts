declare module "particles.js" {
  export interface ParticlesJSConfig {
    particles: Record<string, unknown>;
    interactivity: Record<string, unknown>;
    retina_detect?: boolean;
  }

  export interface ParticlesJSInstance {
    pJS: {
      particles: {
        move: {
          enable: boolean;
          speed: number;
        };
      };
      fn: {
        vendors: {
          destroypJS: () => void;
        };
      };
    };
  }
}

interface Window {
  particlesJS: (
    tagId: string,
    params: import("particles.js").ParticlesJSConfig,
  ) => void;
  pJSDom: import("particles.js").ParticlesJSInstance[] | null;
}
