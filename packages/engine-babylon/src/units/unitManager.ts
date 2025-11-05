// packages/engine-babylon/src/units/unitManager.ts
import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3, Animation, AnimationGroup } from "babylonjs";
import type { Selectable } from "../selection/selectionManager";

export interface Unit extends Selectable {
  position: Vector3;
  targetPosition?: Vector3;
  moveSpeed: number;
  unitType: string;
  isMoving: boolean;
}

export class UnitManager {
  private scene: Scene;
  private units = new Map<string, Unit>();
  private unitCounter = 0;
  private moveTargetIndicators = new Map<string, Mesh>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  createUnit(position: Vector3, unitType: string = "basic"): Unit {
    const id = `unit_${this.unitCounter++}`;
    
    // Create unit mesh
    const mesh = MeshBuilder.CreateBox(id, { size: 1.5 }, this.scene);
    mesh.position = position.clone();
    mesh.position.y = 0.75; // Half height above ground
    
    // Create unit material
    const material = new StandardMaterial(`${id}_material`, this.scene);
    material.diffuseColor = this.getUnitColor(unitType);
    mesh.material = material;

    const unit: Unit = {
      id,
      mesh,
      position: position.clone(),
      moveSpeed: 5, // units per second
      unitType,
      isMoving: false,
      onSelect: () => this.onUnitSelected(id),
      onDeselect: () => this.onUnitDeselected(id)
    };

    this.units.set(id, unit);
    return unit;
  }

  moveUnitsTo(unitIds: string[], targetPosition: Vector3) {
    unitIds.forEach((unitId, index) => {
      const unit = this.units.get(unitId);
      if (!unit) return;

      // Spread units around target position to avoid stacking
      const offset = this.calculateFormationOffset(index, unitIds.length);
      const finalTarget = targetPosition.add(offset);
      
      this.moveUnitTo(unitId, finalTarget);
    });
  }

  private moveUnitTo(unitId: string, targetPosition: Vector3) {
    const unit = this.units.get(unitId);
    if (!unit) return;

    unit.targetPosition = targetPosition.clone();
    unit.targetPosition.y = 0.75; // Keep unit above ground
    unit.isMoving = true;

    // Create move target indicator
    this.createMoveTargetIndicator(unitId, targetPosition);
  }

  private calculateFormationOffset(index: number, totalUnits: number): Vector3 {
    if (totalUnits === 1) return Vector3.Zero();

    // Simple grid formation
    const gridSize = Math.ceil(Math.sqrt(totalUnits));
    const x = (index % gridSize) - (gridSize - 1) / 2;
    const z = Math.floor(index / gridSize) - (gridSize - 1) / 2;
    
    return new Vector3(x * 2, 0, z * 2); // 2 unit spacing
  }

  private createMoveTargetIndicator(unitId: string, position: Vector3) {
    // Remove existing indicator
    const existingIndicator = this.moveTargetIndicators.get(unitId);
    if (existingIndicator) {
      existingIndicator.dispose();
    }

    // Create new indicator
    const indicator = MeshBuilder.CreateCylinder(
      `moveTarget_${unitId}`,
      { height: 0.1, diameterTop: 2, diameterBottom: 2 },
      this.scene
    );
    
    indicator.position = position.clone();
    indicator.position.y = 0.05;
    
    const material = new StandardMaterial(`moveTargetMat_${unitId}`, this.scene);
    material.diffuseColor = new Color3(0, 1, 0);
    material.alpha = 0.6;
    indicator.material = material;

    this.moveTargetIndicators.set(unitId, indicator);

    // Remove indicator after 3 seconds
    setTimeout(() => {
      const ind = this.moveTargetIndicators.get(unitId);
      if (ind === indicator) {
        ind.dispose();
        this.moveTargetIndicators.delete(unitId);
      }
    }, 3000);
  }

  update(dt: number) {
    this.units.forEach(unit => {
      if (unit.isMoving && unit.targetPosition) {
        this.updateUnitMovement(unit, dt);
      }
    });
  }

  private updateUnitMovement(unit: Unit, dt: number) {
    if (!unit.targetPosition) return;

    const currentPos = unit.mesh.position;
    const targetPos = unit.targetPosition;
    
    // Calculate direction and distance
    const direction = targetPos.subtract(currentPos);
    const distance = direction.length();
    
    if (distance < 0.1) {
      // Arrived at target
      unit.mesh.position = targetPos.clone();
      unit.position = targetPos.clone();
      unit.targetPosition = undefined;
      unit.isMoving = false;
      return;
    }

    // Move towards target
    direction.normalize();
    const moveDistance = unit.moveSpeed * dt;
    const movement = direction.scale(Math.min(moveDistance, distance));
    
    unit.mesh.position.addInPlace(movement);
    unit.position = unit.mesh.position.clone();
  }

  private onUnitSelected(unitId: string) {
    console.log(`Unit ${unitId} selected`);
  }

  private onUnitDeselected(unitId: string) {
    console.log(`Unit ${unitId} deselected`);
  }

  private getUnitColor(unitType: string): Color3 {
    switch (unitType) {
      case "warrior": return new Color3(1, 0.2, 0.2); // Red
      case "archer": return new Color3(0.2, 1, 0.2);  // Green
      case "worker": return new Color3(0.8, 0.8, 0.2); // Yellow
      default: return new Color3(0.2, 0.2, 1);        // Blue
    }
  }

  getUnit(id: string): Unit | undefined {
    return this.units.get(id);
  }

  getAllUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  removeUnit(id: string) {
    const unit = this.units.get(id);
    if (unit) {
      unit.mesh.dispose();
      this.units.delete(id);
      
      // Clean up move indicator
      const indicator = this.moveTargetIndicators.get(id);
      if (indicator) {
        indicator.dispose();
        this.moveTargetIndicators.delete(id);
      }
    }
  }

  dispose() {
    this.units.forEach(unit => unit.mesh.dispose());
    this.moveTargetIndicators.forEach(indicator => indicator.dispose());
    this.units.clear();
    this.moveTargetIndicators.clear();
  }
}