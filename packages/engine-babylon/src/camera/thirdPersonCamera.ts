// packages/engine-babylon/src/camera/thirdPersonCamera.ts
import { FreeCamera, Vector3, Scene, Ray, PickingInfo } from "babylonjs";
import type { CameraController } from "./cameraManager";

export class ThirdPersonCameraController implements CameraController {
  id = "ThirdPerson";
  private camera: FreeCamera | null = null;
  private keys = new Set<string>();
  private isActive = false;
  private mousePos = { x: 0, y: 0 };
  private isMouseDown = false;

  // Camera settings
  private distance = 10;
  private height = 3;
  private targetHeight = 1.5;
  private followSpeed = 5;
  private rotationSpeed = 0.005;
  private mouseSensitivity = 0.001;
  
  // Current rotation angles
  private pitch = 0; // up/down
  private yaw = 0;   // left/right
  
  // Target position (what we're following)
  private targetPosition = Vector3.Zero();

  constructor() {
    this.setupInputHandlers();
  }

  activate(scene: Scene) {
    if (this.camera) {
      this.camera.dispose();
    }

    // Create third-person camera
    this.camera = new FreeCamera(
      "thirdPersonCamera",
      new Vector3(0, this.height, -this.distance),
      scene
    );

    // Initial camera setup
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

    // Calculate desired camera position based on target and angles
    const offset = new Vector3(
      Math.sin(this.yaw) * this.distance,
      this.height,
      Math.cos(this.yaw) * this.distance
    );

    // Adjust height based on pitch
    offset.y += Math.sin(this.pitch) * this.distance * 0.5;

    const desiredPosition = this.targetPosition.add(offset);
    
    // Smoothly move camera to desired position
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      desiredPosition,
      this.followSpeed * dt
    );

    // Always look at target
    const lookTarget = this.targetPosition.add(new Vector3(0, this.targetHeight, 0));
    this.camera.setTarget(lookTarget);

    // Handle target movement with keyboard
    let targetMoved = false;
    const moveSpeed = 10;

    if (this.keys.has("KeyW")) {
      this.targetPosition.z += moveSpeed * dt;
      targetMoved = true;
    }
    if (this.keys.has("KeyS")) {
      this.targetPosition.z -= moveSpeed * dt;
      targetMoved = true;
    }
    if (this.keys.has("KeyA")) {
      this.targetPosition.x -= moveSpeed * dt;
      targetMoved = true;
    }
    if (this.keys.has("KeyD")) {
      this.targetPosition.x += moveSpeed * dt;
      targetMoved = true;
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
      if (!this.isActive || !this.isMouseDown) return;

      const deltaX = e.clientX - this.mousePos.x;
      const deltaY = e.clientY - this.mousePos.y;

      // Update rotation angles
      this.yaw -= deltaX * this.mouseSensitivity;
      this.pitch -= deltaY * this.mouseSensitivity;

      // Clamp pitch to prevent flipping
      this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));

      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    };

    const onWheel = (e: WheelEvent) => {
      if (!this.isActive) return;
      const delta = e.deltaY > 0 ? 1 : -1;
      this.distance = Math.max(5, Math.min(25, this.distance + delta));
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("wheel", onWheel, { passive: false });
  }

  setTarget(position: Vector3) {
    this.targetPosition = position.clone();
  }

  dispose() {
    this.deactivate();
    if (this.camera) {
      this.camera.dispose();
      this.camera = null;
    }
  }
}