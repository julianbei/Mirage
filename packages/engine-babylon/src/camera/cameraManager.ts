// packages/engine-babylon/src/camera/cameraManager.ts
import type { Scene } from "babylonjs";
import type { CameraController as BaseCameraController } from "../types/cameraController";

export interface CameraController extends BaseCameraController {
  id: string;
  activate(scene: Scene): void;
  deactivate(): void;
}

export class CameraManager {
  private controllers = new Map<string, CameraController>();
  private activeController: CameraController | null = null;
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  registerController(controller: CameraController) {
    this.controllers.set(controller.id, controller);
  }

  switchTo(controllerId: string) {
    const controller = this.controllers.get(controllerId);
    if (!controller) {
      console.warn(`Camera controller "${controllerId}" not found`);
      return;
    }

    // Deactivate current controller
    if (this.activeController) {
      this.activeController.deactivate();
    }

    // Activate new controller
    controller.activate(this.scene);
    this.activeController = controller;
    
    // Set as scene's active camera
    this.scene.activeCamera = controller.camera;
    
    console.log(`Switched to camera: ${controllerId}`);
  }

  update(dt: number) {
    if (this.activeController) {
      this.activeController.update(dt);
    }
  }

  getActiveController(): CameraController | null {
    return this.activeController;
  }

  dispose() {
    this.controllers.forEach(controller => controller.dispose());
    this.controllers.clear();
    this.activeController = null;
  }
}