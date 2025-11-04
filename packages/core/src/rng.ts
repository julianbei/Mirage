// packages/core/src/rng.ts
/** Deterministic xorshift32 RNG for sim code. */
export class RNG {
  constructor(public state = 0x12345678 | 0) {}
  next(): number {
    let x = this.state | 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x | 0;
    // 0..1 exclusive
    return ((x >>> 0) / 0xffffffff);
  }
}