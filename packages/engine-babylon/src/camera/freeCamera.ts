// packages/engine-babylon/src/camera/freeCamera.ts
import { UniversalCamera, Vector3, Scene } from "babylonjs";
import type { CameraController } from "./cameraManager";

export class FreeCameraController implements CameraController {
  id = "free";
  private camera: UniversalCamera | null = null;
  private keys = new Set<string>();
  private isActive = false;
  private mousePos = { x: 0, y: 0 };
  private isMouseDown = false;

  // Movement settings
  private moveSpeed = 15;
  private mouseSensitivity = 0.002;
  private sprintMultiplier = 2;

  constructor() {
    this.setupInputHandlers();
  }

  activate(scene: Scene) {
    if (this.camera) {
      this.camera.dispose();
    }

    // Create free camera
    this.camera = new UniversalCamera(
      "freeCamera",
      new Vector3(0, 10, -15),
      scene
    );

    this.camera.setTarget(Vector3.Zero());
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

    // Get camera directions
    const forward = this.camera.getDirection(Vector3.Forward());
    const right = this.camera.getDirection(Vector3.Right());
    const up = Vector3.Up();

    // Calculate movement speed (with sprint)
    const speed = this.moveSpeed * (this.keys.has("ShiftLeft") ? this.sprintMultiplier : 1);
    const moveDistance = speed * dt;

    // WASD movement
    if (this.keys.has("KeyW")) {
      this.camera.position.addInPlace(forward.scale(moveDistance));
    }
    if (this.keys.has("KeyS")) {
      this.camera.position.addInPlace(forward.scale(-moveDistance));
    }
    if (this.keys.has("KeyA")) {
      this.camera.position.addInPlace(right.scale(-moveDistance));
    }
    if (this.keys.has("KeyD")) {
      this.camera.position.addInPlace(right.scale(moveDistance));
    }

    // QE for up/down
    if (this.keys.has("KeyQ")) {
      this.camera.position.addInPlace(up.scale(-moveDistance));
    }
    if (this.keys.has("KeyE")) {
      this.camera.position.addInPlace(up.scale(moveDistance));
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

    const onMouseDown = (e: MouseEvent) => {
      if (!this.isActive) return;
      if (e.button === 0) { // Left mouse button
        this.isMouseDown = true;
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isActive || !this.isMouseDown || !this.camera) return;

      const deltaX = e.clientX - this.mousePos.x;
      const deltaY = e.clientY - this.mousePos.y;

      // Apply mouse look
      this.camera.rotation.y += deltaX * this.mouseSensitivity;
      this.camera.rotation.x += deltaY * this.mouseSensitivity;

      // Clamp vertical rotation
      this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));

      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    };

    const onWheel = (e: WheelEvent) => {
      if (!this.isActive || !this.camera) return;
      
      // Mouse wheel for forward/backward movement
      const forward = this.camera.getDirection(Vector3.Forward());
      const delta = e.deltaY > 0 ? -1 : 1;
      this.camera.position.addInPlace(forward.scale(delta * 2));
      
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
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