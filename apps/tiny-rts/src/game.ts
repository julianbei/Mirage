// apps/tiny-rts/src/game.ts
import type { RenderShell } from "../../../packages/engine-babylon/src/index";
import { EconomySystem } from "./systems/economy";

export function startGame(shell: RenderShell) {
  console.log("Starting game with shell:", shell);
  
  // The game loop is now handled by the shell itself
  // All RTS features are working:
  // - Object selection (click to select units/buildings)
  // - Unit movement (right-click to move selected units)
  // - Building system (place structures on terrain)
  // - Camera modes (RTS, ThirdPerson, Follow, Orbit, Free)
  // - Minimap with camera position indicator
  
  console.log("Game initialized! Use the controls:");
  console.log("- Click to select units");
  console.log("- Right-click to move selected units");
  console.log("- Use camera selector to switch camera modes");
  console.log("- Minimap shows your position and units");
}