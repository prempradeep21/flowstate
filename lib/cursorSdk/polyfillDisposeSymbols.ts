/**
 * @cursor/sdk uses explicit resource management (`using` / Symbol.dispose).
 * Node 22+ provides these symbols natively; older runtimes need a minimal shim.
 */
export function polyfillDisposeSymbols(): void {
  if (typeof Symbol === "undefined") return;

  const symbolWithDispose = Symbol as typeof Symbol & {
    dispose?: symbol;
    asyncDispose?: symbol;
  };

  if (symbolWithDispose.dispose === undefined) {
    Object.defineProperty(Symbol, "dispose", {
      value: Symbol.for("Symbol.dispose"),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  if (symbolWithDispose.asyncDispose === undefined) {
    Object.defineProperty(Symbol, "asyncDispose", {
      value: Symbol.for("Symbol.asyncDispose"),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }
}

polyfillDisposeSymbols();
