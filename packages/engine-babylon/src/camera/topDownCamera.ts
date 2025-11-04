// packages/engine-babylon/src/camera/topDownCamera.ts
import type { GameContext } from "@core/framework";
import type { GameSystem } from "@core/framework";
import { ArcRotateCamera, Vector3 } from "babylonjs";

export const TopDownCameraSystem: GameSystem = {
  id: "Camera.TopDown",
  onInit(ctx: GameContext) {
    const canvas = document.querySelector("canvas#app") as HTMLCanvasElement;
    const cam = new ArcRotateCamera("td", Math.PI / 4, Math.PI / 3, 50, Vector3.Zero());
    cam.attachControl(canvas, true);
  },
  onTick() {},
};