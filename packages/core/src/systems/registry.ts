// packages/core/src/systems/registry.ts
import type { GameSystem } from "../lifecycle";

const REG = new Map<string, GameSystem>();
export function registerSystem(sys: GameSystem) {
  REG.set(sys.id, sys);
}
export function resolve(ids: string[]): GameSystem[] {
  return ids.map(id => {
    const s = REG.get(id);
    if (!s) throw new Error(`Unknown system ${id}`);
    return s;
  });
}