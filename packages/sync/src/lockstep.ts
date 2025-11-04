// packages/sync/src/lockstep.ts
/** Input frame structure used by lockstep. Extend for abilities. */
export interface InputFrame {
  tick: number;
  seq: number;
  axes: [number, number];
  buttons: number; // bitset
}

export interface LockstepCallbacks {
  send(frame: InputFrame): void;
  onAdvance(frame: InputFrame): void; // deliver local+remote merged input for tick
}

/** Simple local buffer + pending remote frames. */
export class Lockstep {
  private buf = new Map<number, InputFrame[]>(); // tick -> frames
  private seq = 0;
  constructor(private cb: LockstepCallbacks, private delay = 2) {}

  submitLocal(currentTick: number, axes: [number, number], buttons: number) {
    const tick = currentTick + this.delay;
    const frame: InputFrame = { tick, seq: this.seq++, axes, buttons };
    this.enqueue(frame);
    this.cb.send(frame);
  }

  receiveRemote(frame: InputFrame) { this.enqueue(frame); }

  /** When sim requests tick T, we return the merged inputs for T. */
  drainForTick(tick: number): InputFrame[] {
    const arr = this.buf.get(tick) ?? [];
    this.buf.delete(tick);
    return arr;
  }

  private enqueue(f: InputFrame) {
    const arr = this.buf.get(f.tick) ?? [];
    arr.push(f);
    this.buf.set(f.tick, arr);
  }
}