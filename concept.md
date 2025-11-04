# Concept Document: Browser Game Framework (Composable RTS & Simulation Engine)

## 1. Vision

Create a fully client-side, composable browser game framework for RTS, simulation, and management-style games. It runs entirely in the browser (WASM + Babylon.js), requires no dedicated game servers, and allows developers to compose reusable modules to quickly prototype and publish new games.

### Goal

Let players open a URL, play instantly, and pause anytime — ideal for casual or workplace gaming.

### Focus

Creativity, fun, and rapid iteration, not competitive multiplayer.

## 2. Core Design Principles

| Principle | Description |
|-----------|-------------|
| Client-side simulation | The entire simulation runs locally in WASM (Rust/Go/TS). No authoritative server. |
| Static hosting | Games are deployed on CDNs (e.g. Netlify, Cloudflare Pages). Backend services only handle auth, saves, and matchmaking metadata. |
| Composable systems | Everything (camera, physics, economy, AI, UI, abilities) is a reusable module. |
| Low-cost multiplayer | Optional P2P sync via WebRTC. Soft-host model with lockstep for deterministic sim and delta snapshots for recovery. |
| Pause + resume | Games can pause at any time. Peers vote to kick inactive players. Single-player continues unaffected. |
| Framework-first | Build a foundation for many small games — not one big game. |
| Lore-first | Support IP world-building through modular systems and flexible simulation composition. |

## 3. Architecture Overview

### Frontend-only Runtime

```text
Browser
│
├── Game Shell (JS)
│   ├── UI/Menu System
│   ├── Scene Manager
│   ├── Resource Loader (gltf, KTX2, audio)
│   ├── Babylon Render Adapter
│   └── Input Mapper (mouse, keyboard, touch)
│
├── WASM Simulation Worker
│   ├── Deterministic ECS Core
│   ├── Systems (Physics, AI, Economy, Combat, etc.)
│   ├── Snapshot Ring Buffer (state, hashes)
│   ├── Lockstep / Rollback Sync
│   ├── Save / Load / Autosave
│   └── RPC Interface (postMessage or SharedArrayBuffer)
│
├── Multiplayer (Optional)
│   ├── P2P Mesh (WebRTC DataChannels)
│   ├── Soft Host (timekeeper)
│   ├── Lockstep Input Exchange
│   ├── Delta Streaming (late join)
│   └── Vote-to-Kick System
│
└── Persistent Layer
    ├── IndexedDB Local Saves
    ├── Cloud Sync via Auth Backend
    └── Player Profile / Settings
```

### External Infrastructure (Shared Repository)

- **Auth API**: login, profiles, permissions
- **Cloud Storage API**: saves, replays, user mods
- **Match Lobby API**: lightweight metadata + WebRTC signaling (optional)

## 4. Module / Component Design

Each feature is a pluggable system. The core provides standard lifecycle hooks (onInit, onTick, onRender, onPause, etc.).

### Examples of Reusable Modules

| Category | Modules |
|----------|---------|
| Camera | TopDownCamera, FollowUnitCamera, CinematicCamera, OrbitCamera |
| Physics | NoPhysics, LightPhysics, FullPhysics (Havok), GridPhysics |
| Economy | ResourceSystem, ProductionChain, TradeRoutes, PopulationSystem |
| Combat | Melee, Ranged, Magic, ProjectileManager |
| AI / Logic | Pathfinding, BehaviorTree, FSM, ScriptedSequence |
| UI | HUD, Minimap, BuildMenu, ResearchTree |
| Multiplayer | LockstepSync, RollbackSync, VoteKickManager |
| World Gen | TileMap, HeightMap, PlanetMap, CityLayout |
| Rendering | TerrainRenderer, WaterRenderer, UnitRenderer, WeatherSystem |
| Sound | SpatialAudioSystem, AmbientMixer, EventSFX |

Each module implements:

```typescript
interface GameSystem {
  id: string;
  dependsOn?: string[];
  onInit(ctx: GameContext): void;
  onTick(ctx: GameContext, dt: number): void;
  onRender?(ctx: GameContext): void;
  onPause?(): void;
  onResume?(): void;
}
```

Games simply compose modules declaratively in JSON or code:

```typescript
createGame({
  name: "TinyRTS",
  systems: [
    Camera.TopDown,
    Physics.Light,
    Economy.ResourceSystem,
    Combat.ProjectileManager,
    UI.HUD,
  ],
});
```

## 5. Folder Structure

```text
framework/
├── core/
│   ├── ecs/                # Entity Component System
│   ├── wasm/               # Simulation runtime (Rust/Go/TS)
│   ├── sync/               # Lockstep, rollback, snapshot handling
│   ├── io/                 # Save/load, IndexedDB, Cloud storage
│   ├── net/                # WebRTC P2P, lobby protocol
│   └── common/             # Math, RNG, serialization
│
├── engine/
│   ├── babylon/            # Scene, materials, cameras
│   ├── ui/                 # Menus, HUDs, overlays
│   ├── input/              # Keyboard/mouse/touch
│   ├── audio/              # WebAudio wrapper
│   └── camera-modes/       # Reusable camera components
│
├── systems/
│   ├── physics/
│   ├── economy/
│   ├── combat/
│   ├── ai/
│   ├── worldgen/
│   └── weather/
│
├── composer/
│   ├── editor/             # Game composition UI
│   ├── templates/          # Game presets (RTS, MOBA, etc.)
│   └── exporter/           # Builds standalone game bundles
│
├── examples/
│   ├── rts-demo/
│   ├── tower-defense/
│   ├── economy-builder/
│   └── space-empire/
│
└── docs/
    ├── framework-architecture.md
    ├── api-reference.md
    └── module-guidelines.md
```

## 6. Game Menu Layer

The menu system is part of the ui/ layer and supports:

- Local game start, load, settings
- Game selection (RTS, builder, etc.)
- Lobby browser (optional multiplayer)
- Modular integration (plugins for custom menus)
- Hot pause/resume overlay

Games can override or extend menus via config:

```typescript
menu.registerPage("settings", SettingsMenu);
menu.extend("main", MyCustomButton);
```

## 7. Framework API Surface

### Core Entry Points

```typescript
import { createGame, loadGame, registerSystem } from "@loreworks/core";

// register a reusable system
registerSystem("EconomySystem", EconomySystem);

// create a new game
const game = createGame({
  name: "MicroWar",
  mode: "RTS",
  systems: ["Camera.TopDown", "EconomySystem", "Combat.Melee"],
  saveSlot: "local",
});

// start loop
game.start();
```

### Engine Context

```typescript
interface GameContext {
  ecs: ECS;
  assets: AssetManager;
  net?: NetworkManager;
  ui: UIManager;
  audio: AudioManager;
  world: World;
}
```

## 8. Multiplayer Model

### Lockstep

- Deterministic input exchange (only inputs sent per tick)
- Input delay buffer ensures sync
- Perfect for RTS and simulations

### Soft-host delta recovery

- Host peer keeps authoritative snapshot buffer
- Late joiner or desynced peer requests latest + deltas
- Peers vote to kick disconnected or backgrounded users

### Pause and Kick

When a peer backgrounds, the game pauses. Remaining players see a popup:

> "Player X paused. Continue without them?"

Majority vote kicks inactive peer; sim continues seamlessly.

## 9. Evolution Roadmap

| Phase | Focus |
|-------|-------|
| Phase 1 | Core ECS + Babylon renderer + lockstep WASM sim |
| Phase 2 | Game composer (visual assembly, template loading) |
| Phase 3 | Modular multiplayer layer (soft host, vote kick) |
| Phase 4 | Plugin store for community modules |
| Phase 5 | Lore-driven games & monetization layer |

## 10. Technology Stack

| Layer | Technology |
|-------|------------|
| Rendering | Babylon.js |
| Simulation | WASM (Rust preferred for determinism) |
| Networking | WebRTC + WebSocket fallback |
| Storage | IndexedDB + Cloud API |
| Hosting | Static CDN (Cloudflare / Netlify) |
| Language Bindings | TypeScript API surface |
| Build | Vite / wasm-pack / esbuild |

## 11. Repositories

| Repo | Purpose |
|------|---------|
| game-framework | Core engine, ECS, systems, WASM runtime |
| game-composer | Visual composer UI for assembling new games |
| auth-service | Reusable auth + savegame backend |
| game-examples | Sample games and templates |
| lore-data | Shared IP assets and world metadata |

## 12. Summary

This framework is not about realism or esports precision — it's about accessible creativity, lightweight fun, and low-cost scalability. Anyone can build or play an RTS, sim, or experimental concept directly in a browser. Over time, it grows into a game composer capable of spawning whole genres from shared modules.
