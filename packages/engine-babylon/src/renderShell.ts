// packages/engine-babylon/src/renderShell.ts
import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Color4, Texture, FreeCamera } from "babylonjs";
import { CameraManager } from "./camera/cameraManager";
import { RTSCameraController } from "./camera/rtsCamera";
import { ThirdPersonCameraController } from "./camera/thirdPersonCamera";
import { FollowCameraController } from "./camera/followCamera";
import { OrbitCameraController } from "./camera/orbitCamera";
import { FreeCameraController } from "./camera/freeCamera";
import { SelectionManager } from "./selection/selectionManager";
import { UnitManager } from "./units/unitManager";
import { CommandManager } from "./commands/commandManager";
import { BuildingManager } from "./buildings/buildingManager";
import { Minimap } from "./ui/minimap";
import { InputController } from "./input/inputController";

interface RenderOptions {
  canvas: HTMLCanvasElement;
}

export class RenderShell {
  private engine: Engine;
  private scene: Scene;
  private inputController!: InputController;
  private cameraManager!: CameraManager;
  private selectionManager!: SelectionManager;
  private unitManager!: UnitManager;
  private commandManager!: CommandManager;
  private buildingManager!: BuildingManager;
  private minimap!: Minimap;

  constructor(options: RenderOptions) {
    console.log("Initializing RenderShell...");
    console.log("Canvas size:", options.canvas.width, "x", options.canvas.height);
    console.log("Canvas display size:", options.canvas.clientWidth, "x", options.canvas.clientHeight);
    
    this.engine = new Engine(options.canvas, true);
    this.scene = new Scene(this.engine);
    
    // Set scene background to sky blue instead of default
    this.scene.clearColor = new Color4(0.5, 0.8, 1.0, 1.0); // Sky blue
    
    // Ensure proper canvas sizing
    this.engine.resize();
    
    console.log("Setting up scene...");
    this.setupScene();
    console.log("Setting up input controller...");
    this.setupInputController();
    console.log("Setting up cameras...");
    this.setupCameras(options.canvas);
    console.log("Setting up game systems...");
    this.setupGameSystems();
    console.log("Setting up minimap...");
    this.setupMinimap(options.canvas);
    console.log("Creating demo objects...");
    this.createDemoObjects();
    
    console.log("Starting render loop...");
    
    let lastTime = performance.now();
    
    // Start render loop
    this.engine.runRenderLoop(() => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      // Update camera
      this.cameraManager.update(deltaTime);
      
      // Render scene
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
    
    console.log("RenderShell initialization complete!");
  }

  // Getter methods for game systems
  getCameraManager() { return this.cameraManager; }
  getInputController() { return this.inputController; }
  getSelectionManager() { return this.selectionManager; }
  getUnitManager() { return this.unitManager; }
  getCommandManager() { return this.commandManager; }
  getBuildingManager() { return this.buildingManager; }
  getMinimap() { return this.minimap; }

  private setupScene() {
    // Create hemisphere light
    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

    // Create smaller ground with better proportions
    const ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, this.scene);
    const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
    groundMaterial.diffuseColor = new Color3(0.3, 0.5, 0.2); // Even more muted green
    ground.material = groundMaterial;

    // Add some visual reference points closer together
    for (let i = -15; i <= 15; i += 10) {
      for (let j = -15; j <= 15; j += 10) {
        if (i === 0 && j === 0) continue; // Skip center
        const marker = MeshBuilder.CreateBox(`marker_${i}_${j}`, { size: 1 }, this.scene);
        marker.position = new Vector3(i, 0.5, j);
        const markerMat = new StandardMaterial(`markerMat_${i}_${j}`, this.scene);
        markerMat.diffuseColor = new Color3(0.8, 0.8, 0.8); // Brighter markers
        marker.material = markerMat;
      }
    }

    // Add a central landmark for reference
    const centerPillar = MeshBuilder.CreateCylinder("centerPillar", { height: 5, diameter: 2 }, this.scene);
    centerPillar.position = new Vector3(0, 2.5, 0);
    const pillarMat = new StandardMaterial("pillarMat", this.scene);
    pillarMat.diffuseColor = new Color3(0.7, 0.3, 0.3); // Red pillar
    centerPillar.material = pillarMat;
  }

  private setupInputController() {
    this.inputController = new InputController();
  }

  private setupCameras(canvas: HTMLCanvasElement) {
    this.cameraManager = new CameraManager(this.scene);
    
    // Register all camera controllers with the input controller
    this.cameraManager.registerController(new RTSCameraController(this.inputController));
    this.cameraManager.registerController(new ThirdPersonCameraController(this.inputController));
    this.cameraManager.registerController(new FollowCameraController());
    this.cameraManager.registerController(new OrbitCameraController());
    this.cameraManager.registerController(new FreeCameraController());
    
    // Start with RTS camera
    this.cameraManager.switchTo("rts");
  }

  private setupGameSystems() {
    // Initialize game systems
    this.selectionManager = new SelectionManager(this.scene);
    this.unitManager = new UnitManager(this.scene);
    this.buildingManager = new BuildingManager(this.scene);
    this.commandManager = new CommandManager(this.scene, this.selectionManager, this.unitManager);
  }

  private setupMinimap(canvas: HTMLCanvasElement) {
    this.minimap = new Minimap(this.scene, canvas);
  }

  private createDemoObjects() {
    // Create some demo units with better spacing
    const unit1 = this.unitManager.createUnit(new Vector3(-10, 0, -10), "warrior");
    const unit2 = this.unitManager.createUnit(new Vector3(0, 0, -10), "archer");
    const unit3 = this.unitManager.createUnit(new Vector3(10, 0, -10), "worker");
    
    // Create additional units for better demo
    const unit4 = this.unitManager.createUnit(new Vector3(-5, 0, 5), "warrior");
    const unit5 = this.unitManager.createUnit(new Vector3(5, 0, 5), "archer");
    
    // Register units as selectable and add to minimap
    this.selectionManager.registerSelectable(unit1);
    this.selectionManager.registerSelectable(unit2);
    this.selectionManager.registerSelectable(unit3);
    this.selectionManager.registerSelectable(unit4);
    this.selectionManager.registerSelectable(unit5);

    // Add units to minimap
    this.minimap.addObject({
      id: unit1.id,
      position: unit1.position,
      type: "unit",
      color: new Color3(0, 0, 1),
      size: 3
    });
    this.minimap.addObject({
      id: unit2.id,
      position: unit2.position,
      type: "unit",
      color: new Color3(0, 1, 0),
      size: 3
    });
    this.minimap.addObject({
      id: unit3.id,
      position: unit3.position,
      type: "unit",
      color: new Color3(1, 1, 0),
      size: 3
    });
    this.minimap.addObject({
      id: unit4.id,
      position: unit4.position,
      type: "unit",
      color: new Color3(1, 0, 0),
      size: 3
    });
    this.minimap.addObject({
      id: unit5.id,
      position: unit5.position,
      type: "unit",
      color: new Color3(1, 0, 1),
      size: 3
    });

    // Create some demo buildings using the building manager
    const house = this.buildingManager.createBuilding("house", new Vector3(8, 0, 0));
    const barracks = this.buildingManager.createBuilding("barracks", new Vector3(8, 0, 6));
    const farm = this.buildingManager.createBuilding("farm", new Vector3(-8, 0, 8));
    
    // Register buildings as selectable and add to minimap
    this.selectionManager.registerSelectable(house);
    this.selectionManager.registerSelectable(barracks);
    this.selectionManager.registerSelectable(farm);

    // Add buildings to minimap
    this.minimap.addObject({
      id: house.id,
      position: house.position,
      type: "building",
      color: new Color3(0.8, 0.6, 0.4),
      size: 4
    });
    this.minimap.addObject({
      id: barracks.id,
      position: barracks.position,
      type: "building",
      color: new Color3(0.6, 0.4, 0.2),
      size: 5
    });
    this.minimap.addObject({
      id: farm.id,
      position: farm.position,
      type: "building",
      color: new Color3(0.4, 0.8, 0.3),
      size: 6
    });

    // Create a sphere (special object)
    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, this.scene);
    sphere.position = new Vector3(0, 1, -5);
    const sphereMaterial = new StandardMaterial("sphereMaterial", this.scene);
    sphereMaterial.diffuseColor = new Color3(0.8, 0.2, 0.8);
    sphere.material = sphereMaterial;

    // Register sphere as selectable and add to minimap
    this.selectionManager.registerSelectable({
      id: "sphere",
      mesh: sphere
    });

    this.minimap.addObject({
      id: "sphere",
      position: sphere.position,
      type: "resource",
      color: new Color3(0.8, 0.2, 0.8),
      size: 3
    });
  }

  update(dt: number) {
    this.cameraManager.update(dt);
    this.unitManager.update(dt);
    this.buildingManager.update(dt);
    this.minimap.update(dt);
    this.minimap.render();
  }

  switchCamera(cameraId: string) {
    this.cameraManager.switchTo(cameraId);
  }

  getAvailableCameras(): string[] {
    return ["rts", "thirdPerson", "follow", "orbit", "free"];
  }

  dispose() {
    this.cameraManager.dispose();
    this.selectionManager.dispose();
    this.unitManager.dispose();
    this.commandManager.dispose();
    this.buildingManager.dispose();
    this.minimap.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}

/** Creates Babylon Engine+Scene and basic light/camera. */
export function createRenderShell(canvas: HTMLCanvasElement) {
  return new RenderShell({ canvas });
}