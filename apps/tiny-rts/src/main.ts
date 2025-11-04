// apps/tiny-rts/src/main.ts
import { createRenderShell, mountMainMenu } from "@engine-babylon/runtime";
import { startGame } from "./game";

const canvas = document.getElementById("app") as HTMLCanvasElement;
const shell = createRenderShell(canvas);

mountMainMenu(document.body, () => startGame(shell));