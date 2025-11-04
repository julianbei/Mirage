// packages/worker/src/protocol.ts
export type MsgToWorker =
  | { t: "init"; wasmUrl: string; seed: number; fixedHz: number }
  | { t: "advance"; inputs: Uint8Array } // lockstep merged input for tick
  | { t: "snapshotReq" };

export type MsgFromWorker =
  | { t: "ready" }
  | { t: "advanced"; tick: number }
  | { t: "snapshot"; bin: Uint8Array };