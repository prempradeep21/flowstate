export class CanvasSaveConflictError extends Error {
  constructor(message = "Canvas save conflict — remote state is newer") {
    super(message);
    this.name = "CanvasSaveConflictError";
  }
}

export function isCanvasSaveConflictError(error: unknown): boolean {
  return error instanceof CanvasSaveConflictError;
}
