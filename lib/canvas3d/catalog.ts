export type Canvas3DFormat = "glb" | "gltf";

export interface Canvas3DCatalogEntry {
  id: string;
  title: string;
  tags: string[];
  modelUrl: string;
  format: Canvas3DFormat;
  /** Whether the glTF includes skeletal or morph animations. */
  animated: boolean;
  license: string;
  source: string;
  sourceUrl: string;
}

/**
 * Curated, publicly hosted glTF/GLB models with permissive licenses.
 * URLs verified for direct loading (CORS-friendly CDNs).
 */
export const CANVAS_3D_CATALOG: Canvas3DCatalogEntry[] = [
  {
    id: "astronaut",
    title: "Astronaut",
    tags: ["space", "character", "walk", "suit"],
    modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    format: "glb",
    animated: true,
    license: "Apache 2.0",
    source: "Model Viewer shared assets",
    sourceUrl: "https://modelviewer.dev/",
  },
  {
    id: "robot-expressive",
    title: "Expressive robot",
    tags: ["robot", "dance", "character", "fun"],
    modelUrl: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
    format: "glb",
    animated: true,
    license: "Apache 2.0",
    source: "Model Viewer shared assets",
    sourceUrl: "https://modelviewer.dev/",
  },
  {
    id: "fox",
    title: "Fox",
    tags: ["animal", "fox", "run", "nature"],
    modelUrl:
      "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Fox/glTF-Binary/Fox.glb",
    format: "glb",
    animated: true,
    license: "MIT",
    source: "Khronos glTF Sample Models",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Models",
  },
  {
    id: "cesium-man",
    title: "Cesium Man",
    tags: ["person", "walk", "character", "human"],
    modelUrl:
      "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb",
    format: "glb",
    animated: true,
    license: "MIT",
    source: "Khronos glTF Sample Models",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Models",
  },
  {
    id: "brain-stem",
    title: "Brain stem",
    tags: ["mechanical", "abstract", "loop", "sci-fi"],
    modelUrl:
      "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BrainStem/glTF-Binary/BrainStem.glb",
    format: "glb",
    animated: true,
    license: "MIT",
    source: "Khronos glTF Sample Models",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Models",
  },
  {
    id: "morph-cube",
    title: "Morph cube",
    tags: ["abstract", "cube", "morph", "loop"],
    modelUrl:
      "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb",
    format: "glb",
    animated: true,
    license: "MIT",
    source: "Khronos glTF Sample Models",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Models",
  },
  {
    id: "horse",
    title: "Horse",
    tags: ["animal", "horse", "nature"],
    modelUrl: "https://modelviewer.dev/shared-assets/models/Horse.glb",
    format: "glb",
    animated: true,
    license: "Apache 2.0",
    source: "Model Viewer shared assets",
    sourceUrl: "https://modelviewer.dev/",
  },
  {
    id: "neil-armstrong",
    title: "Neil Armstrong",
    tags: ["space", "astronaut", "history", "character"],
    modelUrl: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
    format: "glb",
    animated: true,
    license: "Apache 2.0",
    source: "Model Viewer shared assets",
    sourceUrl: "https://modelviewer.dev/",
  },
  {
    id: "duck",
    title: "Rubber duck",
    tags: ["duck", "toy", "cute", "static"],
    modelUrl:
      "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb",
    format: "glb",
    animated: false,
    license: "MIT",
    source: "Khronos glTF Sample Models",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Models",
  },
  {
    id: "avocado",
    title: "Avocado",
    tags: ["food", "avocado", "cute", "static"],
    modelUrl:
      "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Avocado/glTF-Binary/Avocado.glb",
    format: "glb",
    animated: false,
    license: "MIT",
    source: "Khronos glTF Sample Models",
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Models",
  },
];
