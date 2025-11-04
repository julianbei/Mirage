// packages/core/src/serialization.ts
/** Binary serialization placeholder. Extend with bit-packing. */
export function u32LE(n: number) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0, true);
  return b;
}