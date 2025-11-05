// packages/engine-babylon/src/selection/selectionManager.ts
import { Scene, Ray, Vector3, Mesh, PickingInfo, AbstractMesh, HighlightLayer, Color3 } from "babylonjs";

export interface Selectable {
  id: string;
  mesh: Mesh;
  onSelect?: () => void;
  onDeselect?: () => void;
}

export class SelectionManager {
  private scene: Scene;
  private selectables = new Map<string, Selectable>();
  private selected = new Set<string>();
  private highlightLayer: HighlightLayer;
  private isMouseDown = false;
  private isDragSelecting = false;
  private dragStart = { x: 0, y: 0 };
  private selectionBox: HTMLDivElement | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.highlightLayer = new HighlightLayer("selection", scene);
    this.setupInputHandlers();
    this.createSelectionBox();
  }

  registerSelectable(selectable: Selectable) {
    this.selectables.set(selectable.id, selectable);
    
    // Make mesh pickable
    selectable.mesh.isPickable = true;
    selectable.mesh.metadata = selectable.mesh.metadata || {};
    selectable.mesh.metadata.selectableId = selectable.id;
  }

  unregisterSelectable(id: string) {
    const selectable = this.selectables.get(id);
    if (selectable) {
      this.deselect(id);
      this.selectables.delete(id);
    }
  }

  select(id: string, addToSelection = false) {
    const selectable = this.selectables.get(id);
    if (!selectable) return;

    if (!addToSelection) {
      this.clearSelection();
    }

    if (!this.selected.has(id)) {
      this.selected.add(id);
      this.highlightLayer.addMesh(selectable.mesh, Color3.Yellow());
      selectable.onSelect?.();
    }
  }

  deselect(id: string) {
    const selectable = this.selectables.get(id);
    if (!selectable) return;

    if (this.selected.has(id)) {
      this.selected.delete(id);
      this.highlightLayer.removeMesh(selectable.mesh);
      selectable.onDeselect?.();
    }
  }

  clearSelection() {
    const selectedIds = Array.from(this.selected);
    selectedIds.forEach(id => this.deselect(id));
  }

  getSelected(): Selectable[] {
    return Array.from(this.selected).map(id => this.selectables.get(id)!).filter(Boolean);
  }

  getSelectedIds(): string[] {
    return Array.from(this.selected);
  }

  private setupInputHandlers() {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      this.isMouseDown = true;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      
      // Start drag selection after small movement threshold
      setTimeout(() => {
        if (this.isMouseDown && !this.isDragSelecting) {
          const deltaX = Math.abs(e.clientX - this.dragStart.x);
          const deltaY = Math.abs(e.clientY - this.dragStart.y);
          if (deltaX > 5 || deltaY > 5) {
            this.startDragSelection();
          }
        }
      }, 100);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.isDragSelecting) {
        this.updateDragSelection(e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (this.isDragSelecting) {
        this.endDragSelection();
      } else if (this.isMouseDown) {
        // Single click selection
        this.handleSingleClick(e);
      }
      
      this.isMouseDown = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
  }

  private handleSingleClick(e: PointerEvent) {
    const pickInfo = this.scene.pick(e.clientX, e.clientY);
    
    if (pickInfo.hit && pickInfo.pickedMesh) {
      const selectableId = pickInfo.pickedMesh.metadata?.selectableId;
      if (selectableId) {
        const addToSelection = e.ctrlKey || e.metaKey;
        this.select(selectableId, addToSelection);
        return;
      }
    }
    
    // Clicked on empty space - clear selection if not holding modifier
    if (!e.ctrlKey && !e.metaKey) {
      this.clearSelection();
    }
  }

  private createSelectionBox() {
    this.selectionBox = document.createElement("div");
    this.selectionBox.style.cssText = `
      position: absolute;
      border: 2px dashed #ffff00;
      background: rgba(255, 255, 0, 0.1);
      pointer-events: none;
      z-index: 1000;
      display: none;
    `;
    document.body.appendChild(this.selectionBox);
  }

  private startDragSelection() {
    this.isDragSelecting = true;
    if (this.selectionBox) {
      this.selectionBox.style.display = "block";
      this.selectionBox.style.left = this.dragStart.x + "px";
      this.selectionBox.style.top = this.dragStart.y + "px";
      this.selectionBox.style.width = "0px";
      this.selectionBox.style.height = "0px";
    }
  }

  private updateDragSelection(currentX: number, currentY: number) {
    if (!this.selectionBox) return;

    const left = Math.min(this.dragStart.x, currentX);
    const top = Math.min(this.dragStart.y, currentY);
    const width = Math.abs(currentX - this.dragStart.x);
    const height = Math.abs(currentY - this.dragStart.y);

    this.selectionBox.style.left = left + "px";
    this.selectionBox.style.top = top + "px";
    this.selectionBox.style.width = width + "px";
    this.selectionBox.style.height = height + "px";
  }

  private endDragSelection() {
    this.isDragSelecting = false;
    if (this.selectionBox) {
      this.selectionBox.style.display = "none";
    }

    // TODO: Implement area selection - check which objects are in the selection box
    // This would require converting world positions to screen coordinates
    // For now, we'll just clear selection if no modifier is held
  }

  dispose() {
    this.highlightLayer.dispose();
    if (this.selectionBox) {
      this.selectionBox.remove();
    }
  }
}