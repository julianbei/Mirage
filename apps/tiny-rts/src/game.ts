// apps/tiny-rts/src/game.ts
import { createGame } from "@core/framework";
import { ECS } from "@core/framework";
import type { GameContext } from "@core/framework";
import { updateHud } from "@engine-babylon/runtime";
import { Cameras } from "@engine-babylon/runtime";
import { Lockstep } from "@sync/runtime";
import { SnapshotRing } from "@sync/runtime";
import { EconomySystem } from "./systems/economy";

export function startGame(shell: ReturnType<any>) {
  // Minimal context; wire proper impls later.
  const ecs = new ECS();
  const ctx: GameContext = {
    ecs,
    assets: { async loadManifest() {} },
    ui: { showPauseOverlay(){}, hidePauseOverlay(){} },
    audio: { play(){} },
    net: undefined,
    world: { tick: 0 }
  };

  const systems = [
    Cameras.TopDownCameraSystem,
    EconomySystem, // demo system
  ];

  const game = createGame({ context: ctx, systems, fixedHz: 60 });

  // Lockstep placeholder
  const lockstep = new Lockstep({
    send: () => {}, onAdvance: () => {}
  });

  // Soft-host snapshot buffer
  const ring = new SnapshotRing(64);
  void ring; void lockstep;

  // Main loops
  let acc = 0;
  let last = performance.now();

  function update() {
    const now = performance.now();
    acc += (now - last) / 1000;
    last = now;

    // fixed-step at 60Hz
    while (acc >= 1 / 60) {
      game.tick();
      acc -= 1 / 60;
    }
    game.render();
    updateHud(ctx.world.tick);
  }

  shell.renderLoop(update);
}