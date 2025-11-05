// packages/engine-babylon/src/camera/thirdPersonCamera.ts

import { Scene, FreeCamera, Vector3, Mesh, MeshBuilder } from "babylonjs";
import type { CameraController } from "./cameraManager";
import { InputController } from "../input/inputController";

export class ThirdPersonCameraController implements CameraController {
  public id = "thirdPerson";
  public camera!: FreeCamera;
  private scene!: Scene;
  private inputController: InputController;
  private canvas!: HTMLCanvasElement;
  private character!: Mesh;

  // Camera settings - smooth interpolated camera
  private distance = 10;
  private height = 3;
  private targetHeight = 1.5;
  private followSpeed = 5;
  private mouseSensitivity = 0.001;
  
  // Current rotation angles
  private pitch = 0; // up/down
  private yaw = 0;   // left/right
  
  // Character movement
  private characterPosition = Vector3.Zero();
  private characterYaw = 0; // Character's facing direction
  private moveSpeed = 10;
  private turnSpeed = 3;

  // Mouse controls
  private isMouseLocked = false;

  constructor(inputController: InputController) {
    this.inputController = inputController;
  }

  activate(scene: Scene): void {
    this.scene = scene;
    this.canvas = scene.getEngine().getRenderingCanvas()!;

    // Create character representation (simple box for now)
    this.character = MeshBuilder.CreateBox("character", { size: 2 }, scene);
    this.character.position = this.characterPosition.clone();

    // Create third person camera positioned behind character
    this.camera = new FreeCamera(
      "thirdPersonCamera",
      new Vector3(0, this.height, -this.distance),
      scene
    );

    // Initial camera setup
    this.camera.setTarget(Vector3.Zero());

    // Set input profile
    this.inputController.setProfile("thirdPerson");

    // Setup mouse look
    this.setupMouseLook();

    console.log("Third Person Camera activated with smooth following");
  }

  deactivate(): void {
    if (this.character) {
      this.character.dispose();
    }
    if (this.isMouseLocked) {
      document.exitPointerLock();
    }
    console.log("Third Person Camera deactivated");
  }

  private setupMouseLook(): void {
    this.canvas.addEventListener("click", () => {
      if (!this.isMouseLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.isMouseLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener("mousemove", (event) => {
      if (!this.isMouseLocked) return;

      const deltaX = event.movementX || 0;
      const deltaY = event.movementY || 0;

      // Update rotation angles
      this.yaw -= deltaX * this.mouseSensitivity;
      this.pitch -= deltaY * this.mouseSensitivity;

      // Clamp pitch to prevent flipping
      this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener("wheel", (e) => {
      const delta = e.deltaY > 0 ? 1 : -1;
      this.distance = Math.max(5, Math.min(25, this.distance + delta));
      e.preventDefault();
    });
  }

  update(deltaTime: number): void {
    if (!this.camera || !this.character) return;

    this.inputController.update();

    const moveSpeedDelta = this.moveSpeed * deltaTime;
    const turnSpeedDelta = this.turnSpeed * deltaTime;

    // Get input axes
    const forwardAxis = this.inputController.getAxisValue("moveForward", "moveBackward");
    const strafeAxis = this.inputController.getAxisValue("strafeRight", "strafeLeft");
    const turnAxis = this.inputController.getAxisValue("turnRight", "turnLeft");

    // Character turning with A/D
    if (turnAxis !== 0) {
      this.characterYaw += turnAxis * turnSpeedDelta;
    }

    // Character movement
    let hasMoved = false;
    if (forwardAxis !== 0 || strafeAxis !== 0) {
      // Calculate movement direction based on character's facing
      const forward = new Vector3(
        Math.sin(this.characterYaw),
        0,
        Math.cos(this.characterYaw)
      );
      
      const right = new Vector3(
        Math.cos(this.characterYaw),
        0,
        -Math.sin(this.characterYaw)
      );

      const movement = forward.scale(forwardAxis * moveSpeedDelta)
                             .add(right.scale(strafeAxis * moveSpeedDelta));

      this.characterPosition.addInPlace(movement);
      hasMoved = true;
    }

    // Update character mesh position and rotation
    this.character.position = this.characterPosition.clone();
    this.character.rotation.y = this.characterYaw;

    // Update smooth camera to follow character
    this.updateSmoothCamera(deltaTime);

    // Handle mouse unlock
    if (this.inputController.wasActionPressed("menu")) {
      if (this.isMouseLocked) {
        document.exitPointerLock();
      }
    }
  }

  private updateSmoothCamera(deltaTime: number): void {
    // Calculate desired camera position based on character and mouse rotation
    const offset = new Vector3(
      Math.sin(this.yaw) * this.distance,
      this.height,
      Math.cos(this.yaw) * this.distance
    );

    // Adjust height based on pitch
    offset.y += Math.sin(this.pitch) * this.distance * 0.5;

    const desiredPosition = this.characterPosition.add(offset);
    
    // Smoothly interpolate camera to desired position - this creates the smooth "shaking" effect
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      desiredPosition,
      this.followSpeed * deltaTime
    );

    // Always look at character (with target height offset)
    const lookTarget = this.characterPosition.add(new Vector3(0, this.targetHeight, 0));
    this.camera.setTarget(lookTarget);
  }

  dispose(): void {
    this.deactivate();
    if (this.camera) {
      this.camera.dispose();
    }
  }
}