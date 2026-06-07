/** Module-level guard shared by Canvas viewport bootstrap effects. */
let initialViewportApplied = false;
let viewportRestoredFromSnapshot = false;

export function isViewportBootstrapApplied(): boolean {
  return initialViewportApplied;
}

export function markViewportBootstrapApplied(): void {
  initialViewportApplied = true;
}

export function isViewportRestoredFromSnapshot(): boolean {
  return viewportRestoredFromSnapshot;
}

export function markViewportRestoredFromSnapshot(): void {
  viewportRestoredFromSnapshot = true;
}

export function resetViewportBootstrap(): void {
  initialViewportApplied = false;
  viewportRestoredFromSnapshot = false;
}
