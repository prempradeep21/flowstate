/** Module-level guard shared by Canvas viewport bootstrap effects. */
let initialViewportApplied = false;

export function isViewportBootstrapApplied(): boolean {
  return initialViewportApplied;
}

export function markViewportBootstrapApplied(): void {
  initialViewportApplied = true;
}

export function resetViewportBootstrap(): void {
  initialViewportApplied = false;
}
