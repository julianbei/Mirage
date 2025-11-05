// packages/engine-babylon/src/camera/orbitCamera.ts
import { ArcRotateCamera, Vector3, Scene } from "babylonjs";
import type { CameraController } from "./cameraManager";

export class OrbitCameraController implements CameraController {
  id = "orbit";
  private camera: ArcRotateCamera | null = null;
  private isActive = false;
  private orbitCenter = Vector3.Zero();
  private keys = new Set<string>();
  
  // Orbit settings
  private rotationSpeed = 2;
  private zoomSpeed = 2;
  private panSpeed = 8;

  constructor() {
    this.setupInputHandlers();
  }

  activate(scene: Scene) {
    if (this.camera) {
      this.camera.dispose();
    }

    // Create orbit camera
    this.camera = new ArcRotateCamera(
      "orbitCamera",
      -Math.PI / 2,  // Start facing north
      Math.PI / 4,   // 45 degrees above ground
      15,            // Distance
      this.orbitCenter,
      scene
    );

    // Set camera limits
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2.2;
    this.camera.lowerRadiusLimit = 3;
    this.camera.upperRadiusLimit = 30;

    // Enable built-in controls but disable auto rotation
    this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
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

    // Manual controls for orbit center movement
    let moved = false;

    if (this.keys.has("KeyW")) {
      this.orbitCenter.z += this.panSpeed * dt;
      moved = true;
    }
    if (this.keys.has("KeyS")) {
      this.orbitCenter.z -= this.panSpeed * dt;
      moved = true;
    }
    if (this.keys.has("KeyA")) {
      this.orbitCenter.x -= this.panSpeed * dt;
      moved = true;
    }
    if (this.keys.has("KeyD")) {
      this.orbitCenter.x += this.panSpeed * dt;
      moved = true;
    }

    if (moved) {
      this.camera.setTarget(this.orbitCenter);
    }

    // Auto-rotation (optional)
    if (this.keys.has("KeyQ")) {
      this.camera.alpha -= this.rotationSpeed * dt;
    }
    if (this.keys.has("KeyE")) {
      this.camera.alpha += this.rotationSpeed * dt;
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

  setOrbitCenter(position: Vector3) {
    this.orbitCenter = position.clone();
    if (this.camera) {
      this.camera.setTarget(this.orbitCenter);
    }
  }

  dispose() {
    this.deactivate();
    if (this.camera) {
      this.camera.dispose();
      this.camera = null;
    }
  }
}