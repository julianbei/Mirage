// packages/worker/src/index.ts
/// <reference lib="WebWorker" />
import type { MsgFromWorker, MsgToWorker } from "./protocol";

// WASM module shape exported by wasm-bindgen
type WasmSim = {
  init(seed: number, hz: number): void;
  step(inputsPtr: number, len: number): void;
  current_tick(): number;
  snapshot(outPtr: number): number; // returns len, writes into wasm mem
  memory: WebAssembly.Memory;
};

let wasm: WasmSim | null = null;

async function loadWasm(url: string): Promise<WasmSim> {
  const mod = await import(/* @vite-ignore */ url);
  return mod as unknown as WasmSim;
}

self.onmessage = async (e: MessageEvent<MsgToWorker>) => {
  const msg = e.data;
  if (msg.t === "init") {
    wasm = await loadWasm(msg.wasmUrl);
    wasm.init(msg.seed, msg.fixedHz);
    (self as unknown as Worker).postMessage({ t: "ready" } satisfies MsgFromWorker);
    return;
  }
  if (!wasm) return;

  if (msg.t === "advance") {
    // pass inputs buffer to wasm
    const mem = new Uint8Array(wasm.memory.buffer);
    // naive: copy inputs to a static region at 0x10000
    mem.set(msg.inputs, 0x10000);
    wasm.step(0x10000, msg.inputs.length);
    (self as unknown as Worker).postMessage({ t: "advanced", tick: wasm.current_tick() } satisfies MsgFromWorker);
  }

  if (msg.t === "snapshotReq") {
    const mem = new Uint8Array(wasm.memory.buffer);
    const len = wasm.snapshot(0x20000);
    const bin = mem.slice(0x20000, 0x20000 + len);
    (self as unknown as Worker).postMessage({ t: "snapshot", bin } satisfies MsgFromWorker);
  }
};