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

interface ParticlesJSGlobal {
  particlesJS: (tagId: string, params: ParticlesJSConfig) => void;
  pJSDom: ParticlesJSInstance[] | null;
}

declare global {
  interface Window {
    particlesJS: ParticlesJSGlobal["particlesJS"];
    pJSDom: ParticlesJSGlobal["pJSDom"];
  }
}

export {};
