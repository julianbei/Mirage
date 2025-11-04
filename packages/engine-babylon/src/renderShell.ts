// packages/engine-babylon/src/renderShell.ts
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Texture, FreeCamera } from "babylonjs";
import { CameraManager } from "./camera/cameraManager";
import { RTSCameraController } from "./camera/rtsCamera";
import { ThirdPersonCameraController } from "./camera/thirdPersonCamera";

interface RenderOptions {
  canvas: HTMLCanvasElement;
}

export class RenderShell {
  private engine: Engine;
  private scene: Scene;
  private cameraManager!: CameraManager;

  constructor(options: RenderOptions) {
    this.engine = new Engine(options.canvas, true);
    this.scene = new Scene(this.engine);
    
    this.setupScene();
    this.setupCameras();
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  private setupScene() {
    // Create hemisphere light
    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

    // Create ground
    const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, this.scene);
    const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.8, 0.2);
    ground.material = groundMaterial;

    // Create some demo objects
    this.createDemoObjects();
  }

  private setupCameras() {
    this.cameraManager = new CameraManager(this.scene);
    
    // Register camera controllers
    this.cameraManager.registerController(new RTSCameraController());
    this.cameraManager.registerController(new ThirdPersonCameraController());
    
    // Start with RTS camera
    this.cameraManager.switchTo("RTS");
  }

  private createDemoObjects() {
    // Create some boxes
    for (let i = 0; i < 5; i++) {
      const box = MeshBuilder.CreateBox(`box${i}`, { size: 1 }, this.scene);
      box.position.x = (i - 2) * 3;
      box.position.y = 0.5;
      box.position.z = 5;
      
      const material = new StandardMaterial(`boxMaterial${i}`, this.scene);
      material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
      box.material = material;
    }

    // Create a sphere
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, this.scene);
    sphere.position = new Vector3(0, 1, -5);
    const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
    sphereMaterial.diffuseColor = new Color3(0.8, 0.2, 0.8);
    sphere.material = sphereMaterial;
  }

  update(dt: number) {
    this.cameraManager.update(dt);
  }

  switchCamera(cameraId: string) {
    this.cameraManager.switchTo(cameraId);
  }

  getAvailableCameras(): string[] {
    return ["RTS", "ThirdPerson"];
  }

  dispose() {
    this.cameraManager.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}

/** Creates Babylon Engine+Scene and basic light/camera. */
export function createRenderShell(canvas: HTMLCanvasElement) {
  return new RenderShell({ canvas });
}