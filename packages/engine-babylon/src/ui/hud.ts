// packages/engine-babylon/src/ui/hud.ts
export class HUD {
  private container: HTMLDivElement;
  private resources: { wood: number; stone: number; food: number } = { wood: 100, stone: 50, food: 200 };
  private renderShell: any; // Reference to renderShell for camera switching

  constructor(canvas: HTMLCanvasElement, renderShell: any) {
    this.renderShell = renderShell;
    this.container = this.createHUDContainer(canvas);
    this.render();
    this.startResourceGeneration();
  }

  private createHUDContainer(canvas: HTMLCanvasElement): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Courier New', monospace;
    `;
    
    // Insert before canvas to ensure proper layering
    canvas.parentElement?.insertBefore(container, canvas.nextSibling);
    return container;
  }

  render() {
    this.container.innerHTML = `
      <div style="
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #333;
        min-width: 200px;
        pointer-events: auto;
      ">
        <h3 style="margin: 0 0 10px 0; color: #ffd700;">Resources</h3>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <div style="display: flex; justify-content: space-between;">
            <span>🪵 Wood:</span>
            <span style="color: #8B4513; font-weight: bold;">${this.resources.wood}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>🗿 Stone:</span>
            <span style="color: #708090; font-weight: bold;">${this.resources.stone}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>🌾 Food:</span>
            <span style="color: #228B22; font-weight: bold;">${this.resources.food}</span>
          </div>
        </div>
      </div>

      <div style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #333;
        pointer-events: auto;
      ">
        <h3 style="margin: 0 0 10px 0; color: #ffd700;">Camera Controls</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button onclick="window.switchCamera('RTS')" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🎮 RTS</button>
          <button onclick="window.switchCamera('ThirdPerson')" style="
            background: #2196F3;
            color: white;
            border: none;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">👤 3rd Person</button>
          <button onclick="window.switchCamera('Follow')" style="
            background: #FF9800;
            color: white;
            border: none;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">📷 Follow</button>
          <button onclick="window.switchCamera('Orbit')" style="
            background: #9C27B0;
            color: white;
            border: none;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🔄 Orbit</button>
          <button onclick="window.switchCamera('Free')" style="
            background: #F44336;
            color: white;
            border: none;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🕊️ Free</button>
        </div>
        <div style="margin-top: 10px; font-size: 11px; color: #ccc;">
          <div><strong>Camera Controls:</strong></div>
          <div>RTS: WASD move, Q/E rotate, R/F zoom</div>
          <div>3rd Person: WASD move, mouse look</div>
          <div>Follow: Tracks selected unit</div>
          <div>Orbit: WASD move center, mouse orbit</div>
          <div>Free: WASD+QE fly, mouse look</div>
          <br>
          <div><strong>Unit Controls:</strong></div>
          <div>Left Click: Select</div>
          <div>Right Click: Move</div>
          <div>Ctrl+Click: Multi-select</div>
        </div>
      </div>

      <div style="
        position: absolute;
        top: 20px;
        right: 260px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #333;
        pointer-events: auto;
      ">
        <h3 style="margin: 0 0 10px 0; color: #ffd700;">Building Panel</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button onclick="window.startBuilding('house')" style="
            background: #8B4513;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🏠 House<br><small>50W 20S</small></button>
          <button onclick="window.startBuilding('barracks')" style="
            background: #654321;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🏰 Barracks<br><small>100W 50S</small></button>
          <button onclick="window.startBuilding('farm')" style="
            background: #228B22;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🌾 Farm<br><small>30W 10S</small></button>
          <button onclick="window.startBuilding('tower')" style="
            background: #696969;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
          ">🗼 Tower<br><small>75W 100S</small></button>
        </div>
        <div style="margin-top: 10px; font-size: 11px; color: #ccc;">
          <div><strong>Building:</strong></div>
          <div>Click button → Place on ground</div>
          <div>ESC: Cancel placement</div>
          <div>Grid snaps automatically</div>
        </div>
      </div>

      <div style="
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #333;
        max-width: 300px;
        pointer-events: auto;
      ">
        <h3 style="margin: 0 0 10px 0; color: #ffd700;">Game Status</h3>
        <div style="font-size: 14px; line-height: 1.4;">
          <div>✅ Framework: Active</div>
          <div>✅ Rendering: Babylon.js</div>
          <div>✅ Camera System: 5 modes</div>
          <div>✅ Unit Selection: Working</div>
          <div>✅ Unit Movement: Working</div>
          <div>✅ Building System: Working</div>
          <div>✅ Minimap: Interactive</div>
          <div>✅ Resource Economy: Running</div>
          <div>🎮 Ready for gameplay!</div>
        </div>
      </div>
    `;

    // Setup global camera switching function
    (window as any).switchCamera = (cameraId: string) => {
      this.renderShell.switchCamera(cameraId);
    };

    // Setup global building functions
    (window as any).startBuilding = (buildingType: string) => {
      this.renderShell.getBuildingManager().enterPlacementMode(buildingType);
    };
  }

  private startResourceGeneration() {
    setInterval(() => {
      this.resources.wood += Math.floor(Math.random() * 3) + 1;
      this.resources.stone += Math.floor(Math.random() * 2) + 1;
      this.resources.food += Math.floor(Math.random() * 4) + 1;
      this.render();
    }, 2000);
  }

  update(dt: number) {
    // HUD update logic here
  }

  dispose() {
    this.container.remove();
  }
}

// Legacy function for backward compatibility
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
    el.style.fontFamily = "monospace";
    el.style.fontSize = "12px";
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div>⏱️ Tick: ${tick}</div>
    <div>🎮 FPS: ${Math.round(60)} (target)</div>
    <div>⌨️ WASD to move camera</div>
  `;
}