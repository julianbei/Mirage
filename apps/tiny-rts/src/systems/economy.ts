// apps/tiny-rts/src/systems/economy.ts
import type { GameSystem, GameContext } from "@core/framework";

/** Demo resource system mimicking an RTS income tick. */
export const EconomySystem: GameSystem = {
  id: "Economy.ResourceSystem",
  onInit(ctx: GameContext) {
    // in a real game, attach components and initial resource counts
    console.log("Economy init");
  },
  onTick(ctx: GameContext) {
    // stub: every 60 ticks grant 1 gold
    if (ctx.world.tick % 60 === 0) {
      // mutate some resource store here
    }
  },
};