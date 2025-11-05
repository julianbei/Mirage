// packages/engine-babylon/src/camera/rtsCamera.ts

import { Scene, ArcRotateCamera, Vector3, MeshBuilder, StandardMaterial, Color3 } from "babylonjs";
import type { CameraController } from "./cameraManager";
import { InputController } from "../input/inputController";

export class RTSCameraController implements CameraController {
  public id = "rts";
  public camera!: ArcRotateCamera;
  private scene!: Scene;
  private inputController: InputController;
  private canvas!: HTMLCanvasElement;

  // Movement settings
  private moveSpeed = 20;
  private rotationSpeed = 2;
  private zoomSpeed = 10;
  private minDistance = 5;
  private maxDistance = 50;
  
  // Edge scrolling
  private edgeScrollMargin = 50;
  private edgeScrollSpeed = 15;

  // Terrain bounds - keep camera within visible area
  private terrainBounds = {
    minX: -50,
    maxX: 50,
    minZ: -50,
    maxZ: 50
  };

  // Debug visual indicator
  private debugArrow: any;
  private arrowRotation = -Math.PI / 2; // Start pointing North

  constructor(inputController: InputController) {
    this.inputController = inputController;
  }

  activate(scene: Scene): void {
    this.scene = scene;
    this.canvas = scene.getEngine().getRenderingCanvas()!;

    // Create RTS camera with steeper top-down angle (30 degrees)
    this.camera = new ArcRotateCamera(
      "rtsCamera",
      0,                    // alpha (rotation around Y)
      Math.PI / 6,         // beta (30 degrees from top-down)
      20,                  // radius
      Vector3.Zero(),      // target
      scene
    );

    // Configure camera
    this.camera.wheelPrecision = 50;
    this.camera.lowerRadiusLimit = this.minDistance;
    this.camera.upperRadiusLimit = this.maxDistance;
    this.camera.lowerBetaLimit = Math.PI / 8;  // Minimum angle (22.5°)
    this.camera.upperBetaLimit = Math.PI / 3;  // Maximum angle (60°)

    // Set input profile
    this.inputController.setProfile("rts");

    // Activate camera
    this.camera.setTarget(Vector3.Zero());

    // Create debug arrow to show camera direction
    this.debugArrow = MeshBuilder.CreateCylinder("debugArrow", {
      height: 4,
      diameterTop: 0,
      diameterBottom: 1
    }, scene);
    
    const arrowMaterial = new StandardMaterial("arrowMat", scene);
    arrowMaterial.diffuseColor = new Color3(1, 0, 0); // Red arrow
    this.debugArrow.material = arrowMaterial;
    this.debugArrow.position = new Vector3(0, 2, 0);
    // Initially point forward (north) - rotated 90deg counter-clockwise
    this.debugArrow.rotation.x = Math.PI / 2; // Rotate to point horizontally forward
    this.debugArrow.rotation.y = -Math.PI / 2; // Rotate 90deg counter-clockwise

    console.log("RTS Camera activated with steeper top-down view");
  }

  deactivate(): void {
    if (this.debugArrow) {
      this.debugArrow.dispose();
      this.debugArrow = null;
    }
    console.log("RTS Camera deactivated");
  }

  update(deltaTime: number): void {
    if (!this.camera) return;

    this.inputController.update();

    const moveSpeedDelta = this.moveSpeed * deltaTime;
    const rotSpeedDelta = this.rotationSpeed * deltaTime;

    // Get movement input using the new input system
    const forwardAxis = this.inputController.getAxisValue("moveForward", "moveBackward");
    const strafeAxis = this.inputController.getAxisValue("strafeRight", "strafeLeft");
    const turnAxis = this.inputController.getAxisValue("turnRight", "turnLeft");
    
    // Debug output
    if (forwardAxis !== 0 || strafeAxis !== 0 || turnAxis !== 0) {
      console.log(`RTS Input - Forward: ${forwardAxis}, Strafe: ${strafeAxis}, Turn: ${turnAxis}`);
    }
    
    // Camera movement with W/S (forward/back) and A/D (strafe) - relative to ARROW direction
    if (forwardAxis !== 0 || strafeAxis !== 0) {
      // Calculate arrow-relative directions based on arrow rotation
      const arrowForward = new Vector3(Math.sin(this.arrowRotation), 0, Math.cos(this.arrowRotation));
      const arrowRight = new Vector3(Math.cos(this.arrowRotation), 0, -Math.sin(this.arrowRotation));

      console.log(`Arrow-relative movement - Forward: ${arrowForward.toString()}, Right: ${arrowRight.toString()}`);

      // Apply movements relative to arrow orientation:
      // forwardAxis (W/S) -> should move along arrow forward/back direction
      // Fix: positive forwardAxis for W, negative for S
      const forwardMovement = arrowForward.scale(forwardAxis * moveSpeedDelta);
      // strafeAxis (A/D) -> should move along arrow right/left direction  
      // Fix: positive strafeAxis for A, negative for D
      const strafeMovement = arrowRight.scale(strafeAxis * moveSpeedDelta);

      const totalMovement = forwardMovement.add(strafeMovement);
      this.camera.target.addInPlace(totalMovement);
      
      // Clamp camera target to terrain bounds
      this.clampCameraToTerrain();
    }
    
    // Update debug arrow position and rotation
    this.debugArrow.position = this.camera.target.clone();
    this.debugArrow.position.y = 2;
    this.debugArrow.rotation.x = Math.PI / 2; // Keep horizontal
    this.debugArrow.rotation.y = this.arrowRotation; // Use our tracked rotation

    // Arrow rotation with Q/E (turn left/right)
    if (turnAxis !== 0) {
      // E = clockwise (positive), Q = counter-clockwise (negative)
      this.arrowRotation += turnAxis * rotSpeedDelta;
      // For RTS camera, we want the view to rotate, not the camera position
      // The camera alpha controls the orbital angle around the target
      this.camera.alpha -= turnAxis * rotSpeedDelta; // INVERSE camera rotation to match arrow
    }

    // Camera rotation with Q/E - now removed since we use Q/E for arrow rotation
    // (Arrow rotation handles Q/E input above)

    // Arrow key camera rotation
    if (this.inputController.isActionPressed("cameraLeft")) {
      this.camera.alpha -= rotSpeedDelta;
    }
    if (this.inputController.isActionPressed("cameraRight")) {
      this.camera.alpha += rotSpeedDelta;
    }
    if (this.inputController.isActionPressed("cameraUp")) {
      this.camera.beta = Math.max(this.camera.lowerBetaLimit!, this.camera.beta - rotSpeedDelta);
    }
    if (this.inputController.isActionPressed("cameraDown")) {
      this.camera.beta = Math.min(this.camera.upperBetaLimit!, this.camera.beta + rotSpeedDelta);
    }

    // Edge scrolling
    this.handleEdgeScrolling(deltaTime);

    // Sprint modifier
    if (this.inputController.isActionPressed("sprint")) {
      // All movements are 2x faster when sprinting
    }
  }

  private handleEdgeScrolling(deltaTime: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = this.scene.pointerX - rect.left;
    const mouseY = this.scene.pointerY - rect.top;

    if (mouseX < 0 || mouseY < 0 || mouseX > rect.width || mouseY > rect.height) {
      return; // Mouse outside canvas
    }

    const edgeSpeedDelta = this.edgeScrollSpeed * deltaTime;
    let forwardAxis = 0;  // W/S direction (top/bottom edges)
    let strafeAxis = 0;   // A/D direction (left/right edges)

    // Map screen edges to WASD directions:
    // Top edge = W direction, Bottom edge = S direction
    if (mouseY < this.edgeScrollMargin) {
      forwardAxis = 1; // Top edge = W direction (forward)
    } else if (mouseY > rect.height - this.edgeScrollMargin) {
      forwardAxis = -1; // Bottom edge = S direction (backward)
    }

    // Left edge = A direction, Right edge = D direction  
    if (mouseX < this.edgeScrollMargin) {
      strafeAxis = -1; // Left edge = A direction (left)
    } else if (mouseX > rect.width - this.edgeScrollMargin) {
      strafeAxis = 1; // Right edge = D direction (right)
    }

    if (forwardAxis !== 0 || strafeAxis !== 0) {
      // Use the same arrow-relative movement as WASD
      const arrowForward = new Vector3(Math.sin(this.arrowRotation), 0, Math.cos(this.arrowRotation));
      const arrowRight = new Vector3(Math.cos(this.arrowRotation), 0, -Math.sin(this.arrowRotation));

      const forwardMovement = arrowForward.scale(forwardAxis * edgeSpeedDelta);
      const strafeMovement = arrowRight.scale(strafeAxis * edgeSpeedDelta);

      const totalMovement = forwardMovement.add(strafeMovement);
      this.camera.target.addInPlace(totalMovement);
      
      // Clamp target position to terrain bounds  
      this.clampCameraToTerrain();
    }
  }

  private clampCameraToTerrain(): void {
    // Clamp camera target to stay within terrain bounds
    this.camera.target.x = Math.max(this.terrainBounds.minX, 
                                   Math.min(this.terrainBounds.maxX, this.camera.target.x));
    this.camera.target.z = Math.max(this.terrainBounds.minZ, 
                                   Math.min(this.terrainBounds.maxZ, this.camera.target.z));
    
    // Keep Y at ground level
    this.camera.target.y = 0;
  }

  getCamera(): ArcRotateCamera {
    return this.camera;
  }

  getControlInstructions(): string[] {
    const bindings = this.inputController.getBindingInfo();
    const instructions: string[] = [];
    
    instructions.push("=== RTS Camera Controls ===");
    
    // Movement controls
    const forward = bindings.find(b => b.id === "moveForward");
    const backward = bindings.find(b => b.id === "moveBackward");
    const strafeLeft = bindings.find(b => b.id === "strafeLeft");
    const strafeRight = bindings.find(b => b.id === "strafeRight");
    const turnLeft = bindings.find(b => b.id === "turnLeft");
    const turnRight = bindings.find(b => b.id === "turnRight");
    
    if (forward && backward) {
      instructions.push(`${forward.primary.toUpperCase()}/${backward.primary.toUpperCase()} - Move camera forward/backward`);
    }
    if (strafeLeft && strafeRight) {
      instructions.push(`${strafeLeft.primary.toUpperCase()}/${strafeRight.primary.toUpperCase()} - Strafe camera left/right`);
    }
    if (turnLeft && turnRight) {
      instructions.push(`${turnLeft.primary.toUpperCase()}/${turnRight.primary.toUpperCase()} - Turn camera left/right`);
    }
    
    instructions.push("Arrow Keys - Fine camera rotation");
    instructions.push("Mouse Wheel - Zoom in/out");
    instructions.push("Edge Scrolling - Move mouse to screen edges");
    instructions.push("Shift - Sprint mode (faster movement)");
    
    return instructions;
  }

  dispose(): void {
    if (this.camera) {
      this.camera.dispose();
    }
  }
}