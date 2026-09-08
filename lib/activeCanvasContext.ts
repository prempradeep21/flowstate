/*
 * Who the current user is and which canvas they are on, readable outside React.
 *
 * AuthProvider owns this state, but not everything that needs it is a
 * component: createUrlArtifact runs as a plain module when a URL is pasted, and
 * it has to know where to store a preview image it brings into the canvas.
 * Threading the pair through every paste call site would touch three unrelated
 * components for one leaf concern, so it is published here instead and mirrored
 * from the provider.
 *
 * Null whenever there is no signed-in user or no open canvas — callers must
 * treat that as "cannot persist" rather than assuming a default.
 */

export interface ActiveCanvasContext {
  userId: string;
  canvasId: string;
}

let current: ActiveCanvasContext | null = null;

export function setActiveCanvasContext(next: ActiveCanvasContext | null): void {
  current = next;
}

export function getActiveCanvasContext(): ActiveCanvasContext | null {
  return current;
}
