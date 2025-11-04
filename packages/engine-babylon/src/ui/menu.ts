// packages/engine-babylon/src/ui/menu.ts
/** Minimal in-DOM menu overlay. Extend or replace per game. */
export function mountMainMenu(root: HTMLElement, onStart: () => void) {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.top = "10px";
  div.style.left = "10px";
  div.style.padding = "8px 12px";
  div.style.background = "rgba(0,0,0,0.5)";
  div.style.color = "white";
  div.style.font = "14px system-ui, sans-serif";
  div.innerHTML = `
    <button id="start">Start</button>
    <button id="pause">Pause</button>
    <button id="resume">Resume</button>
  `;
  root.appendChild(div);
  div.querySelector<HTMLButtonElement>("#start")!.onclick = onStart;
}