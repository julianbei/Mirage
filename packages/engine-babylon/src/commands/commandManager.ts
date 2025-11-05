// packages/engine-babylon/src/commands/commandManager.ts
import { Scene, Vector3, PickingInfo } from "babylonjs";
import type { SelectionManager } from "../selection/selectionManager";
import type { UnitManager } from "../units/unitManager";

export type CommandType = "move" | "attack" | "build" | "gather";

export interface Command {
  type: CommandType;
  unitIds: string[];
  targetPosition?: Vector3;
  targetId?: string;
  data?: any;
}

export class CommandManager {
  private scene: Scene;
  private selectionManager: SelectionManager;
  private unitManager: UnitManager;
  private pendingCommands: Command[] = [];

  constructor(scene: Scene, selectionManager: SelectionManager, unitManager: UnitManager) {
    this.scene = scene;
    this.selectionManager = selectionManager;
    this.unitManager = unitManager;
    this.setupInputHandlers();
  }

  private setupInputHandlers() {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent browser context menu
      this.handleRightClick(e);
    };

    canvas.addEventListener("contextmenu", onContextMenu);
  }

  private handleRightClick(e: MouseEvent) {
    const selectedUnits = this.selectionManager.getSelected();
    if (selectedUnits.length === 0) return;

    const pickInfo = this.scene.pick(e.clientX, e.clientY);
    
    if (pickInfo.hit && pickInfo.pickedPoint) {
      const command: Command = {
        type: "move",
        unitIds: selectedUnits.map(unit => unit.id),
        targetPosition: pickInfo.pickedPoint
      };
      
      this.executeCommand(command);
    }
  }

  executeCommand(command: Command) {
    switch (command.type) {
      case "move":
        this.executeMoveCommand(command);
        break;
      case "attack":
        this.executeAttackCommand(command);
        break;
      case "build":
        this.executeBuildCommand(command);
        break;
      case "gather":
        this.executeGatherCommand(command);
        break;
    }
  }

  private executeMoveCommand(command: Command) {
    if (!command.targetPosition || command.unitIds.length === 0) return;
    
    console.log(`Moving ${command.unitIds.length} units to position:`, command.targetPosition);
    this.unitManager.moveUnitsTo(command.unitIds, command.targetPosition);
  }

  private executeAttackCommand(command: Command) {
    console.log("Attack command not yet implemented");
    // TODO: Implement attack logic
  }

  private executeBuildCommand(command: Command) {
    console.log("Build command not yet implemented");
    // TODO: Implement building logic
  }

  private executeGatherCommand(command: Command) {
    console.log("Gather command not yet implemented");
    // TODO: Implement resource gathering logic
  }

  // Queue command for networked games
  queueCommand(command: Command) {
    this.pendingCommands.push(command);
  }

  // Process queued commands (for lockstep networking)
  processPendingCommands() {
    while (this.pendingCommands.length > 0) {
      const command = this.pendingCommands.shift()!;
      this.executeCommand(command);
    }
  }

  dispose() {
    // Clean up event listeners if needed
  }
}