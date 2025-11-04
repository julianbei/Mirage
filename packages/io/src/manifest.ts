// packages/io/src/manifest.ts
export async function loadManifest(url: string) {
  await fetch(url).then(r => r.json());
}