// packages/sync/src/softHostDelta.ts
/** Soft-host snapshot ring for late join/recovery. */
export class SnapshotRing {
  private ring: (Uint8Array | undefined)[];
  private head = 0;
  constructor(private size = 64) { this.ring = new Array(size); }
  push(snapshot: Uint8Array) {
    this.ring[this.head] = snapshot;
    this.head = (this.head + 1) % this.size;
  }
  latest(): Uint8Array | undefined {
    const idx = (this.head - 1 + this.size) % this.size;
    return this.ring[idx];
  }
}