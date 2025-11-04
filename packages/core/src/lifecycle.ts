// packages/core/src/lifecycle.ts
import type { GameContext } from "./context";

/** System contract for reusable modules. */
export interface GameSystem {
  id: string;
  dependsOn?: string[];
  onInit(ctx: GameContext): void;
  onTick(ctx: GameContext, dtFixed: number): void;
  onRender?(ctx: GameContext): void;
  onPause?(): void;
  onResume?(): void;
}

export class Game {
  constructor(
    private ctx: GameContext,
    private systems: GameSystem[],
    private fixedDt: number
  ) {}

  init() {
    for (const s of this.systems) s.onInit(this.ctx);
  }

  tick() {
    for (const s of this.systems) s.onTick(this.ctx, this.fixedDt);
    this.ctx.world.tick++;
  }

  render() {
    for (const s of this.systems) s.onRender?.(this.ctx);
  }

  pause() { this.systems.forEach(s => s.onPause?.()); }
  resume() { this.systems.forEach(s => s.onResume?.()); }
}

export interface CreateGameOpts {
  systems: GameSystem[];
  fixedHz?: number; // default 60
  context: GameContext;
}

export function createGame(opts: CreateGameOpts) {
  const hz = opts.fixedHz ?? 60;
  const g = new Game(opts.context, opts.systems, 1 / hz);
  g.init();
  return g;
}