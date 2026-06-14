"use client";

import { useEffect, useRef, useState } from "react";

export function ThreeDModelViewer({
  modelUrl,
  format = "glb",
  interactive = false,
  className = "",
}: {
  modelUrl: string;
  format?: string;
  interactive?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !modelUrl) {
      setStatus("error");
      return;
    }

    let disposed = false;
    let cleanupFn: (() => void) | null = null;
    setStatus("loading");

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );

        if (disposed || !containerRef.current) return;

        const mount = containerRef.current;
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 200);
        camera.position.set(0, 0.8, 2.4);

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.55);
        scene.add(ambient);
        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(4, 8, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xb8c4e8, 0.35);
        fill.position.set(-5, 2, -4);
        scene.add(fill);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enabled = interactive;
        controls.target.set(0, 0, 0);

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modelUrl);
        if (disposed) return;

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const fitScale = 1.6 / maxDim;

        model.position.x = -center.x * fitScale;
        model.position.y = -center.y * fitScale;
        model.position.z = -center.z * fitScale;
        model.scale.setScalar(fitScale);
        scene.add(model);

        const fittedHeight = size.y * fitScale;
        const fittedDepth = maxDim * fitScale;
        camera.position.set(0, fittedHeight * 0.35, fittedDepth * 1.8);
        controls.update();

        const resizeObserver = new ResizeObserver(() => {
          if (!mount) return;
          const w = Math.max(mount.clientWidth, 1);
          const h = Math.max(mount.clientHeight, 1);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });
        resizeObserver.observe(mount);

        let animationId = 0;
        const animate = () => {
          if (disposed) return;
          animationId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        cleanupFn = () => {
          resizeObserver.disconnect();
          cancelAnimationFrame(animationId);
          controls.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) {
            mount.removeChild(renderer.domElement);
          }
          scene.traverse((obj) => {
            if (!(obj instanceof THREE.Mesh)) return;
            obj.geometry?.dispose();
            const material = obj.material;
            if (Array.isArray(material)) {
              material.forEach((mat) => mat.dispose());
            } else {
              material?.dispose();
            }
          });
        };

        if (disposed) {
          cleanupFn();
          return;
        }

        setStatus("ready");
      } catch {
        if (!disposed) setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      cleanupFn?.();
    };
  }, [modelUrl, format, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-transparent ${className}`}
      onPointerDown={(e) => {
        if (interactive) e.stopPropagation();
      }}
      onWheel={(e) => {
        if (interactive) e.stopPropagation();
      }}
    >
      {status === "loading" && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-canvas-compact text-canvas-muted"
          aria-live="polite"
        >
          Loading model…
        </div>
      )}
      {status === "error" && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
        >
          <p className="text-canvas-body-sm text-canvas-muted">Could not load model</p>
          <a
            href={modelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full truncate text-canvas-compact text-canvas-accent hover:underline"
          >
            Open {format.toUpperCase()} file
          </a>
        </div>
      )}
    </div>
  );
}
