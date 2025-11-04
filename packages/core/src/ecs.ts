// packages/core/src/ecs.ts
/**
 * Minimal ECS: integer entity ids, sparse component stores.
 * Determinism: keep state as plain typed arrays or POJOs only.
 */
export type Entity = number;

export interface ComponentStore<T> {
  has(e: Entity): boolean;
  get(e: Entity): T | undefined;
  set(e: Entity, v: T): void;
  delete(e: Entity): void;
  entries(): Iterable<[Entity, T]>;
}

export class MapStore<T> implements ComponentStore<T> {
  private m = new Map<Entity, T>();
  has(e: Entity) { return this.m.has(e); }
  get(e: Entity) { return this.m.get(e); }
  set(e: Entity, v: T) { this.m.set(e, v); }
  delete(e: Entity) { this.m.delete(e); }
  *entries() { yield* this.m.entries(); }
}

export class ECS {
  private nextId = 1;
  create(): Entity { return this.nextId++; }
  destroy(_: Entity) { /* no-op in minimal skeleton */ }
}