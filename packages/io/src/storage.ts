// packages/io/src/storage.ts
/** IndexedDB save slots. */
export class Storage {
  constructor(private dbName = "loreworks") {}
  async save(slot: string, data: Uint8Array) {
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(`${this.dbName}:${slot}`, base64);
  }
  async load(slot: string): Promise<Uint8Array | undefined> {
    const b64 = localStorage.getItem(`${this.dbName}:${slot}`);
    if (!b64) return;
    const binary = atob(b64);
    return new Uint8Array(Array.from(binary).map(c => c.charCodeAt(0)));
  }
}