// packages/engine-babylon/src/camera/followCamera.ts
import { FreeCamera, Vector3, Scene } from "babylonjs";
import type { CameraController } from "./cameraManager";

export class FollowCameraController implements CameraController {
  id = "follow";
  camera!: FreeCamera;
  private isActive = false;
  private targetId: string | null = null;
  private targetPosition = Vector3.Zero();
  private offset = new Vector3(0, 8, -12);
  private followSpeed = 8;
  private lookAtOffset = new Vector3(0, 1, 0);

  constructor() {}

  activate(scene: Scene) {
    // Create follow camera
    this.camera = new FreeCamera(
      "followCamera",
      this.targetPosition.add(this.offset),
      scene
    );

    this.camera.setTarget(this.targetPosition.add(this.lookAtOffset));
    this.camera.attachControl(scene.getEngine().getRenderingCanvas(), false);
    scene.activeCamera = this.camera;

    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
    if (this.camera) {
      this.camera.detachControl();
    }
  }

  update(dt: number) {
    if (!this.camera || !this.isActive) return;

    // Calculate desired camera position
    const desiredPosition = this.targetPosition.add(this.offset);
    
    // Smoothly move camera to desired position
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      desiredPosition,
      this.followSpeed * dt
    );

    // Always look at target with slight upward offset
    const lookTarget = this.targetPosition.add(this.lookAtOffset);
    this.camera.setTarget(lookTarget);
  }

  setTarget(targetId: string, position: Vector3) {
    this.targetId = targetId;
    this.targetPosition = position.clone();
  }

  setOffset(offset: Vector3) {
    this.offset = offset.clone();
  }

  dispose() {
    this.deactivate();
    if (this.camera) {
      this.camera.dispose();
    }
  }
}