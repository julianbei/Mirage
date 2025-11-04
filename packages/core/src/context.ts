// packages/core/src/context.ts
import { ECS } from "./ecs";

export interface AssetManager {
  loadManifest(url: string): Promise<void>;
}

export interface UIManager {
  showPauseOverlay(reason: string): void;
  hidePauseOverlay(): void;
}

export interface AudioManager {
  play(name: string): void;
}

export interface NetManager {
  sendReliable(data: Uint8Array): void;
  sendUnreliable(data: Uint8Array): void;
}

export interface World {
  tick: number;
}

export interface GameContext {
  ecs: ECS;
  assets: AssetManager;
  ui: UIManager;
  audio: AudioManager;
  net?: NetManager;
  world: World;
}