// packages/sync/src/stateHash.ts
/** Lightweight CRC32 for desync checks. */
export function crc32(bytes: Uint8Array): number {
  let c = ~0 >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}