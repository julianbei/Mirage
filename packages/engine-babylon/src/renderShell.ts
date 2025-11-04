// packages/engine-babylon/src/renderShell.ts
import { Engine, Scene, HemisphericLight, Vector3, FreeCamera } from "babylonjs";

/** Creates Babylon Engine+Scene and basic light/camera. */
export function createRenderShell(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  const camera = new FreeCamera("cam", new Vector3(0, 25, -25), scene);
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  function renderLoop(renderFn: () => void) {
    engine.runRenderLoop(() => {
      renderFn();
      scene.render();
    });
  }

  return { engine, scene, camera, renderLoop };
}