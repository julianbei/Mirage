// packages/engine-babylon/src/camera/rtsCamera.ts
import { ArcRotateCamera, Vector3, Scene } from "babylonjs";
import type { CameraController } from "./cameraManager";

export class RTSCameraController implements CameraController {
  id = "RTS";
  private camera: ArcRotateCamera | null = null;
  private keys = new Set<string>();
  private isActive = false;

  // Camera settings
  private moveSpeed = 20;
  private zoomSpeed = 2;
  private rotateSpeed = 1;
  private panSpeed = 15;

  constructor() {
    this.setupInputHandlers();
  }

  activate(scene: Scene) {
    if (this.camera) {
      this.camera.dispose();
    }

    // Create RTS-style camera
    this.camera = new ArcRotateCamera(
      "rtsCamera",
      -Math.PI / 2,  // Start facing north
      Math.PI / 3,   // 60 degrees above ground
      25,            // Distance
      Vector3.Zero(),
      scene
    );

    // Set camera limits for RTS
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2.2;
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 50;

    // Disable default controls - we'll handle them manually
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

    const target = this.camera.getTarget();
    let moved = false;

    // WASD movement
    if (this.keys.has("KeyW")) {
      target.z += this.moveSpeed * dt;
      moved = true;
    }
    if (this.keys.has("KeyS")) {
      target.z -= this.moveSpeed * dt;
      moved = true;
    }
    if (this.keys.has("KeyA")) {
      target.x -= this.moveSpeed * dt;
      moved = true;
    }
    if (this.keys.has("KeyD")) {
      target.x += this.moveSpeed * dt;
      moved = true;
    }

    // Q/E rotation
    if (this.keys.has("KeyQ")) {
      this.camera.alpha -= this.rotateSpeed * dt;
    }
    if (this.keys.has("KeyE")) {
      this.camera.alpha += this.rotateSpeed * dt;
    }

    // R/F zoom
    if (this.keys.has("KeyR")) {
      this.camera.radius = Math.max(
        this.camera.lowerRadiusLimit!,
        this.camera.radius - this.zoomSpeed * dt * 10
      );
    }
    if (this.keys.has("KeyF")) {
      this.camera.radius = Math.min(
        this.camera.upperRadiusLimit!,
        this.camera.radius + this.zoomSpeed * dt * 10
      );
    }

    if (moved) {
      this.camera.setTarget(target);
    }
  }

  private setupInputHandlers() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.isActive) return;
      this.keys.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    const onWheel = (e: WheelEvent) => {
      if (!this.isActive || !this.camera) return;
      const delta = e.deltaY > 0 ? 1 : -1;
      this.camera.radius = Math.max(
        this.camera.lowerRadiusLimit!,
        Math.min(
          this.camera.upperRadiusLimit!,
          this.camera.radius + delta * this.zoomSpeed
        )
      );
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("wheel", onWheel, { passive: false });
  }

  dispose() {
    this.deactivate();
    if (this.camera) {
      this.camera.dispose();
      this.camera = null;
    }
  }
}