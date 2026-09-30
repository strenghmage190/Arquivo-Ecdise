// Minimal process.env shim for libraries that reference `process` in the browser.
// Keeps references like `process.env.NODE_ENV` from throwing.
declare global {
  interface Window { process?: any; structuredClone?: any }
}

// Basic polyfills for older iOS/Android devices
if (typeof window !== 'undefined' && !window.structuredClone) {
  window.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
if (typeof Array.prototype.at !== 'function') {
  Array.prototype.at = function(index) {
    index = Math.trunc(index) || 0;
    if (index < 0) index += this.length;
    if (index < 0 || index >= this.length) return undefined;
    return this[index];
  };
}
if (typeof String.prototype.at !== 'function') {
  String.prototype.at = function(index) {
    index = Math.trunc(index) || 0;
    if (index < 0) index += this.length;
    if (index < 0 || index >= this.length) return undefined;
    return String(this)[index];
  };
}

// Provide a small, safe `process` object on the global scope.
;(function attachProcessShim() {
  try {
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE) ? (import.meta as any).env.MODE : 'development';
    const shim = { env: { NODE_ENV: env }, versions: {}, browser: true };
    if (typeof window !== 'undefined') (window as any).process = (window as any).process || shim;
    // also set globalThis.process for environments that read it
    if (typeof globalThis !== 'undefined') (globalThis as any).process = (globalThis as any).process || shim;
  } catch (e) {
    // swallow - best effort shim
    try { (window as any).process = (window as any).process || { env: { NODE_ENV: 'development' } }; } catch (e2) { /* noop */ }
  }
})();

export {};
