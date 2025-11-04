// apps/tiny-rts/src/game.ts
import { createGame } from "@core/framework";
import { ECS } from "@core/framework";
import type { GameContext } from "@core/framework";
import { EconomySystem } from "./systems/economy";

export function startGame(shell: any) {
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
    EconomySystem,             // Demo resource system
  ];

  const game = createGame({ context: ctx, systems, fixedHz: 60 });

  // Main loops
  let acc = 0;
  let last = performance.now();

  function update() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    acc += dt;

    // fixed-step at 60Hz
    while (acc >= 1 / 60) {
      game.tick();
      acc -= 1 / 60;
    }
    
    // Update camera system
    shell.update(dt);
    
    game.render();
  }

  // Start the render loop
  const renderLoop = () => {
    update();
    requestAnimationFrame(renderLoop);
  };
  renderLoop();
}