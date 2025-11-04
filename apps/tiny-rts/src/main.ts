// apps/tiny-rts/src/main.ts
import { createRenderShell } from "@engine-babylon/renderShell";
import { mountMainMenu } from "@engine-babylon/ui/menu";
import { HUD } from "@engine-babylon/ui/hud";
import { startGame } from "./game";

const canvas = document.getElementById("app") as HTMLCanvasElement;
const shell = createRenderShell(canvas);

// Create and initialize the HUD with camera controls
const hud = new HUD(canvas, shell);

mountMainMenu(document.body, () => startGame(shell));