// packages/engine-babylon/src/ui/minimap.ts
import { Scene, Vector3, Engine, Camera, RenderTargetTexture, Color4, Mesh, MeshBuilder, StandardMaterial, Color3, UniversalCamera } from "babylonjs";

export interface MinimapObject {
  id: string;
  position: Vector3;
  type: "unit" | "building" | "resource";
  color: Color3;
  size: number;
}

export class Minimap {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private minimapCanvas!: HTMLCanvasElement;
  private minimapCamera!: UniversalCamera;
  private renderTarget!: RenderTargetTexture;
  private worldSize = 50; // Size of the game world
  private minimapSize = 200; // Size of minimap in pixels
  private objects = new Map<string, MinimapObject>();
  private objectMeshes = new Map<string, Mesh>();
  private cameraIndicator!: HTMLDivElement;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;
    
    this.setupMinimapCanvas();
    this.setupMinimapCamera();
    this.setupRenderTarget();
    this.setupCameraIndicator();
    this.setupInputHandlers();
    
    // Create initial UI
    this.render();
  }

  private setupMinimapCanvas() {
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = this.minimapSize;
    this.minimapCanvas.height = this.minimapSize;
    this.minimapCanvas.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: ${this.minimapSize}px;
      height: ${this.minimapSize}px;
      border: 3px solid #333;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.8);
      cursor: pointer;
      z-index: 1001;
    `;
    
    document.body.appendChild(this.minimapCanvas);
  }

  private setupMinimapCamera() {
    // Create top-down camera for minimap
    this.minimapCamera = new UniversalCamera(
      "minimapCamera",
      new Vector3(0, 100, 0),
      this.scene
    );
    
    // Point camera straight down
    this.minimapCamera.setTarget(Vector3.Zero());
    this.minimapCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    
    // Set orthographic size to match world size
    const aspect = 1; // Square minimap
    this.minimapCamera.orthoLeft = -this.worldSize / 2;
    this.minimapCamera.orthoRight = this.worldSize / 2;
    this.minimapCamera.orthoTop = this.worldSize / 2;
    this.minimapCamera.orthoBottom = -this.worldSize / 2;
  }

  private setupRenderTarget() {
    this.renderTarget = new RenderTargetTexture(
      "minimap",
      this.minimapSize,
      this.scene,
      false,
      true
    );
    
    this.renderTarget.activeCamera = this.minimapCamera;
    this.renderTarget.clearColor = new Color4(0.1, 0.3, 0.1, 1); // Dark green background
    
    // Only render specific objects to minimap
    this.renderTarget.renderList = [];
    
    // Render the ground
    const ground = this.scene.getMeshByName("ground");
    if (ground) {
      this.renderTarget.renderList.push(ground);
    }
  }

  private setupCameraIndicator() {
    this.cameraIndicator = document.createElement('div');
    this.cameraIndicator.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: yellow;
      border: 1px solid black;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1002;
    `;
    
    document.body.appendChild(this.cameraIndicator);
  }

  private setupInputHandlers() {
    this.minimapCanvas.addEventListener('click', (e) => {
      this.handleMinimapClick(e);
    });
  }

  private handleMinimapClick(e: MouseEvent) {
    const rect = this.minimapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert minimap coordinates to world coordinates
    const worldX = (x / this.minimapSize - 0.5) * this.worldSize;
    const worldZ = (0.5 - y / this.minimapSize) * this.worldSize; // Flip Y
    
    // Move main camera to clicked position
    this.moveMainCameraTo(new Vector3(worldX, 0, worldZ));
  }

  private moveMainCameraTo(position: Vector3) {
    const activeCamera = this.scene.activeCamera;
    if (!activeCamera) return;

    // For RTS camera (ArcRotateCamera), move the target
    if ((activeCamera as any).setTarget) {
      (activeCamera as any).setTarget(position);
    } 
    // For other cameras, move position
    else {
      activeCamera.position.x = position.x;
      activeCamera.position.z = position.z;
    }
  }

  addObject(object: MinimapObject) {
    this.objects.set(object.id, object);
    
    // Create visual representation
    const mesh = MeshBuilder.CreateCylinder(
      `minimap_${object.id}`,
      { height: 0.5, diameter: object.size },
      this.scene
    );
    
    mesh.position = object.position.clone();
    mesh.position.y = 0.25;
    
    const material = new StandardMaterial(`minimapMat_${object.id}`, this.scene);
    material.diffuseColor = object.color;
    material.emissiveColor = object.color.scale(0.3); // Make it slightly glowing
    mesh.material = material;
    
    this.objectMeshes.set(object.id, mesh);
    this.renderTarget.renderList?.push(mesh);
  }

  removeObject(id: string) {
    const mesh = this.objectMeshes.get(id);
    if (mesh) {
      const index = this.renderTarget.renderList?.indexOf(mesh) ?? -1;
      if (index > -1) {
        this.renderTarget.renderList?.splice(index, 1);
      }
      mesh.dispose();
      this.objectMeshes.delete(id);
    }
    this.objects.delete(id);
  }

  updateObject(id: string, position: Vector3) {
    const object = this.objects.get(id);
    const mesh = this.objectMeshes.get(id);
    
    if (object && mesh) {
      object.position = position.clone();
      mesh.position = position.clone();
      mesh.position.y = 0.25;
    }
  }

  private updateCameraIndicator() {
    const activeCamera = this.scene.activeCamera;
    if (!activeCamera) return;

    let cameraWorldPos: Vector3;
    
    // Get camera world position (or target for arc rotate)
    if ((activeCamera as any).getTarget) {
      cameraWorldPos = (activeCamera as any).getTarget();
    } else {
      cameraWorldPos = activeCamera.position;
    }

    // Convert world position to minimap screen coordinates
    const minimapX = (cameraWorldPos.x / this.worldSize + 0.5) * this.minimapSize;
    const minimapY = (0.5 - cameraWorldPos.z / this.worldSize) * this.minimapSize;
    
    // Position indicator on minimap
    const rect = this.minimapCanvas.getBoundingClientRect();
    this.cameraIndicator.style.left = (rect.left + minimapX) + 'px';
    this.cameraIndicator.style.top = (rect.top + minimapY) + 'px';
  }

  render() {
    // Render the minimap texture
    this.renderTarget.render(false);
    
    // Simple minimap rendering - just show a colored background for now
    const ctx = this.minimapCanvas.getContext('2d');
    if (ctx) {
      // Clear canvas
      ctx.fillStyle = '#2d5016'; // Dark green
      ctx.fillRect(0, 0, this.minimapSize, this.minimapSize);
      
      // Draw objects as dots
      this.objects.forEach(object => {
        const x = (object.position.x / this.worldSize + 0.5) * this.minimapSize;
        const y = (0.5 - object.position.z / this.worldSize) * this.minimapSize;
        
        ctx.fillStyle = `rgb(${object.color.r * 255}, ${object.color.g * 255}, ${object.color.b * 255})`;
        ctx.beginPath();
        ctx.arc(x, y, object.size, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    
    this.updateCameraIndicator();
  }

  update(dt: number) {
    // Update object positions (for moving units)
    this.objects.forEach((object, id) => {
      if (object.type === "unit") {
        // In a real implementation, you'd get the actual unit position
        // For now, just update the visual
        this.render();
      }
    });
    
    this.updateCameraIndicator();
  }

  dispose() {
    this.minimapCanvas.remove();
    this.cameraIndicator.remove();
    this.renderTarget.dispose();
    this.minimapCamera.dispose();
    
    this.objectMeshes.forEach(mesh => mesh.dispose());
    this.objectMeshes.clear();
    this.objects.clear();
  }
}