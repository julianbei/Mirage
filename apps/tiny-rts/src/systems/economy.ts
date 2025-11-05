// apps/tiny-rts/src/systems/economy.ts

interface Resources {
  gold: number;
  wood: number;
  food: number;
}

let resources: Resources = { gold: 100, wood: 50, food: 25 };
let tickCounter = 0;

/** Demo resource system mimicking an RTS income tick. */
export const EconomySystem = {
  id: "Economy.ResourceSystem",
  onInit() {
    console.log("Economy init - Starting resources:", resources);
    updateResourceDisplay();
  },
  onTick() {
    // Every 60 ticks (1 second) grant resources
    tickCounter++;
    if (tickCounter % 60 === 0) {
      resources.gold += 10;
      resources.wood += 5;
      resources.food += 3;
      updateResourceDisplay();
    }
  },
};

function updateResourceDisplay() {
  let el = document.getElementById("resources");
  if (!el) {
    el = document.createElement("div");
    el.id = "resources";
    el.style.position = "absolute";
    el.style.top = "50px";
    el.style.left = "10px";
    el.style.padding = "8px 12px";
    el.style.background = "rgba(0,0,0,0.7)";
    el.style.color = "white";
    el.style.fontFamily = "monospace";
    el.style.fontSize = "14px";
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div>💰 Gold: ${resources.gold}</div>
    <div>🌲 Wood: ${resources.wood}</div>
    <div>🍎 Food: ${resources.food}</div>
  `;
}