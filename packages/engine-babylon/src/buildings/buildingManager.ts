// packages/engine-babylon/src/buildings/buildingManager.ts
import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3, GroundMesh } from "babylonjs";
import type { Selectable } from "../selection/selectionManager";

export interface BuildingType {
  id: string;
  name: string;
  size: { width: number; height: number; depth: number };
  cost: { wood: number; stone: number; food: number };
  color: Color3;
  buildTime: number; // seconds
}

export interface Building extends Selectable {
  buildingType: string;
  position: Vector3;
  isConstructed: boolean;
  constructionProgress: number; // 0-1
  health: number;
  maxHealth: number;
}

export class BuildingManager {
  private scene: Scene;
  private buildings = new Map<string, Building>();
  private buildingCounter = 0;
  private placementMode = false;
  private currentBuildingType: string | null = null;
  private placementPreview: Mesh | null = null;
  private gridSize = 2; // Grid snap size

  // Building types
  private buildingTypes = new Map<string, BuildingType>();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeBuildingTypes();
    this.setupInputHandlers();
  }

  private initializeBuildingTypes() {
    this.buildingTypes.set("house", {
      id: "house",
      name: "House",
      size: { width: 3, height: 2, depth: 3 },
      cost: { wood: 50, stone: 20, food: 0 },
      color: new Color3(0.8, 0.6, 0.4),
      buildTime: 5
    });

    this.buildingTypes.set("barracks", {
      id: "barracks",
      name: "Barracks",
      size: { width: 4, height: 2.5, depth: 4 },
      cost: { wood: 100, stone: 50, food: 0 },
      color: new Color3(0.6, 0.4, 0.2),
      buildTime: 8
    });

    this.buildingTypes.set("farm", {
      id: "farm",
      name: "Farm",
      size: { width: 5, height: 1, depth: 5 },
      cost: { wood: 30, stone: 10, food: 0 },
      color: new Color3(0.4, 0.8, 0.3),
      buildTime: 4
    });

    this.buildingTypes.set("tower", {
      id: "tower",
      name: "Tower",
      size: { width: 2, height: 6, depth: 2 },
      cost: { wood: 75, stone: 100, food: 0 },
      color: new Color3(0.5, 0.5, 0.5),
      buildTime: 10
    });
  }

  enterPlacementMode(buildingTypeId: string) {
    if (!this.buildingTypes.has(buildingTypeId)) {
      console.warn(`Building type ${buildingTypeId} not found`);
      return;
    }

    this.placementMode = true;
    this.currentBuildingType = buildingTypeId;
    this.createPlacementPreview(buildingTypeId);
    
    console.log(`Entered placement mode for ${buildingTypeId}`);
  }

  exitPlacementMode() {
    this.placementMode = false;
    this.currentBuildingType = null;
    
    if (this.placementPreview) {
      this.placementPreview.dispose();
      this.placementPreview = null;
    }
    
    console.log("Exited placement mode");
  }

  private createPlacementPreview(buildingTypeId: string) {
    const buildingType = this.buildingTypes.get(buildingTypeId)!;
    
    this.placementPreview = MeshBuilder.CreateBox(
      "buildingPreview",
      buildingType.size,
      this.scene
    );
    
    const material = new StandardMaterial("previewMaterial", this.scene);
    material.diffuseColor = buildingType.color;
    material.alpha = 0.6;
    this.placementPreview.material = material;
    this.placementPreview.isPickable = false;
  }

  private setupInputHandlers() {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const onPointerMove = (e: PointerEvent) => {
      if (this.placementMode && this.placementPreview) {
        this.updatePlacementPreview(e.clientX, e.clientY);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.placementMode && e.button === 0) { // Left click
        this.tryPlaceBuilding(e.clientX, e.clientY);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" && this.placementMode) {
        this.exitPlacementMode();
      }
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
  }

  private updatePlacementPreview(screenX: number, screenY: number) {
    if (!this.placementPreview) return;

    const pickInfo = this.scene.pick(screenX, screenY, (mesh) => {
      return mesh.name === "ground"; // Only pick ground
    });

    if (pickInfo.hit && pickInfo.pickedPoint) {
      const snappedPosition = this.snapToGrid(pickInfo.pickedPoint);
      this.placementPreview.position = snappedPosition;
      
      // Check if position is valid (not colliding with other buildings)
      const isValid = this.isValidBuildingPosition(snappedPosition);
      const material = this.placementPreview.material as StandardMaterial;
      material.diffuseColor = isValid ? 
        this.buildingTypes.get(this.currentBuildingType!)!.color :
        new Color3(1, 0, 0); // Red for invalid
    }
  }

  private snapToGrid(position: Vector3): Vector3 {
    return new Vector3(
      Math.round(position.x / this.gridSize) * this.gridSize,
      position.y,
      Math.round(position.z / this.gridSize) * this.gridSize
    );
  }

  private isValidBuildingPosition(position: Vector3): boolean {
    if (!this.currentBuildingType) return false;
    
    const buildingType = this.buildingTypes.get(this.currentBuildingType)!;
    const halfWidth = buildingType.size.width / 2;
    const halfDepth = buildingType.size.depth / 2;

    // Check collision with existing buildings
    for (const building of this.buildings.values()) {
      const existingType = this.buildingTypes.get(building.buildingType)!;
      const existingHalfWidth = existingType.size.width / 2;
      const existingHalfDepth = existingType.size.depth / 2;

      const dx = Math.abs(position.x - building.position.x);
      const dz = Math.abs(position.z - building.position.z);

      if (dx < (halfWidth + existingHalfWidth) && dz < (halfDepth + existingHalfDepth)) {
        return false; // Collision detected
      }
    }

    return true; // Position is valid
  }

  private tryPlaceBuilding(screenX: number, screenY: number) {
    if (!this.currentBuildingType) return;

    const pickInfo = this.scene.pick(screenX, screenY, (mesh) => {
      return mesh.name === "ground";
    });

    if (pickInfo.hit && pickInfo.pickedPoint) {
      const snappedPosition = this.snapToGrid(pickInfo.pickedPoint);
      
      if (this.isValidBuildingPosition(snappedPosition)) {
        this.createBuilding(this.currentBuildingType, snappedPosition);
        // Stay in placement mode for multiple buildings
        // this.exitPlacementMode(); // Uncomment to exit after placing one
      }
    }
  }

  createBuilding(buildingTypeId: string, position: Vector3): Building {
    const buildingType = this.buildingTypes.get(buildingTypeId);
    if (!buildingType) {
      throw new Error(`Building type ${buildingTypeId} not found`);
    }

    const id = `building_${this.buildingCounter++}`;
    
    // Create building mesh
    const mesh = MeshBuilder.CreateBox(id, buildingType.size, this.scene);
    mesh.position = position.clone();
    mesh.position.y = buildingType.size.height / 2; // Center vertically
    
    // Create building material
    const material = new StandardMaterial(`${id}_material`, this.scene);
    material.diffuseColor = buildingType.color;
    mesh.material = material;

    const building: Building = {
      id,
      mesh,
      buildingType: buildingTypeId,
      position: position.clone(),
      isConstructed: false,
      constructionProgress: 0,
      health: buildingType.buildTime * 10, // Temporary health calculation
      maxHealth: buildingType.buildTime * 10,
      onSelect: () => this.onBuildingSelected(id),
      onDeselect: () => this.onBuildingDeselected(id)
    };

    this.buildings.set(id, building);
    
    // Start construction animation
    this.startConstruction(id);
    
    console.log(`Building ${buildingType.name} placed at`, position);
    return building;
  }

  private startConstruction(buildingId: string) {
    const building = this.buildings.get(buildingId);
    if (!building) return;

    const buildingType = this.buildingTypes.get(building.buildingType)!;
    const constructionTime = buildingType.buildTime * 1000; // Convert to milliseconds
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      building.constructionProgress = Math.min(elapsed / constructionTime, 1);
      
      // Update visual progress (scale up during construction)
      const scale = 0.3 + (building.constructionProgress * 0.7);
      building.mesh.scaling = new Vector3(scale, scale, scale);
      
      if (building.constructionProgress >= 1) {
        building.isConstructed = true;
        building.mesh.scaling = Vector3.One();
        console.log(`Building ${building.id} construction completed!`);
      } else {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private onBuildingSelected(buildingId: string) {
    console.log(`Building ${buildingId} selected`);
  }

  private onBuildingDeselected(buildingId: string) {
    console.log(`Building ${buildingId} deselected`);
  }

  getBuildingTypes(): BuildingType[] {
    return Array.from(this.buildingTypes.values());
  }

  getBuilding(id: string): Building | undefined {
    return this.buildings.get(id);
  }

  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  isInPlacementMode(): boolean {
    return this.placementMode;
  }

  getCurrentBuildingType(): string | null {
    return this.currentBuildingType;
  }

  removeBuilding(id: string) {
    const building = this.buildings.get(id);
    if (building) {
      building.mesh.dispose();
      this.buildings.delete(id);
    }
  }

  update(dt: number) {
    // Update building logic (production, effects, etc.)
    // For now, just placeholder
  }

  dispose() {
    this.buildings.forEach(building => building.mesh.dispose());
    this.buildings.clear();
    
    if (this.placementPreview) {
      this.placementPreview.dispose();
    }
  }
}