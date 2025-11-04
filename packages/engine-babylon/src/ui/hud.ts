// packages/engine-babylon/src/ui/hud.ts
export function updateHud(tick: number) {
  let el = document.getElementById("hud");
  if (!el) {
    el = document.createElement("div");
    el.id = "hud";
    el.style.position = "absolute";
    el.style.bottom = "10px";
    el.style.left = "10px";
    el.style.padding = "6px 10px";
    el.style.background = "rgba(0,0,0,0.4)";
    el.style.color = "white";
    document.body.appendChild(el);
  }
  el.textContent = `Tick: ${tick}`;
}