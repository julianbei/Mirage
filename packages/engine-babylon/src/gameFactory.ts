// packages/engine-babylon/src/gameFactory.ts
import type { GameSystem, GameContext, CreateGameOpts } from "@core/index";
import { createGame, ECS } from "@core/index";
import type { RenderShell } from "./renderShell";

export interface GameSystemModule {
  id: string;
  create(shell: RenderShell): GameSystem;
}

// Camera System Module
export const CameraSystemModule: GameSystemModule = {
  id: "Camera.Manager",
  create: (shell: RenderShell) => ({
    id: "Camera.Manager", 
    onInit: () => console.log("Camera system initialized"),
    onTick: (ctx: GameContext, dt: number) => {
      // Camera update is handled by the CameraManager itself
    },
    onRender: () => {}
  })
};

// Selection System Module
export const SelectionSystemModule: GameSystemModule = {
  id: "Selection.Manager",
  create: (shell: RenderShell) => ({
    id: "Selection.Manager",
    onInit: () => console.log("Selection system initialized"), 
    onTick: (ctx: GameContext, dt: number) => {
      // Selection is handled by pointer events
    },
    onRender: () => {}
  })
};

// Unit System Module
export const UnitSystemModule: GameSystemModule = {
  id: "Units.Manager",
  create: (shell: RenderShell) => ({
    id: "Units.Manager",
    onInit: () => console.log("Unit system initialized"),
    onTick: (ctx: GameContext, dt: number) => {
      // Unit updates would go here
    },
    onRender: () => {}
  })
};

// Building System Module  
export const BuildingSystemModule: GameSystemModule = {
  id: "Buildings.Manager",
  create: (shell: RenderShell) => ({
    id: "Buildings.Manager",
    onInit: () => console.log("Building system initialized"),
    onTick: (ctx: GameContext, dt: number) => {
      // Building updates would go here
    },
    onRender: () => {}
  })
};

// Minimap System Module
export const MinimapSystemModule: GameSystemModule = {
  id: "UI.Minimap",
  create: (shell: RenderShell) => ({
    id: "UI.Minimap",
    onInit: () => console.log("Minimap system initialized"),
    onTick: (ctx: GameContext, dt: number) => {
      shell.getMinimap()?.render();
    },
    onRender: () => {}
  })
};

// Factory function following the concept document pattern
export function createTinyRTSGame(shell: RenderShell): ReturnType<typeof createGame> {
  // Create ECS and context
  const ecs = new ECS();
  const ctx: GameContext = {
    ecs,
    assets: { async loadManifest() {} },
    ui: { showPauseOverlay(){}, hidePauseOverlay(){} },
    audio: { play(){} },
    net: undefined,
    world: { tick: 0 }
  };

  // Compose systems like in the concept document
  const systemModules = [
    CameraSystemModule,
    SelectionSystemModule, 
    UnitSystemModule,
    BuildingSystemModule,
    MinimapSystemModule
  ];

  const systems = systemModules.map(module => module.create(shell));

  const opts: CreateGameOpts = {
    context: ctx,
    systems,
    fixedHz: 60
  };

  return createGame(opts);
}