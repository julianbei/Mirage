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
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button onclick="window.switchCamera('RTS')" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
          ">RTS Camera</button>
          <button onclick="window.switchCamera('ThirdPerson')" style="
            background: #2196F3;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
          ">Third Person</button>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #ccc;">
          <div><strong>RTS Controls:</strong></div>
          <div>WASD: Move</div>
          <div>Q/E: Rotate</div>
          <div>R/F: Zoom</div>
          <div>Mouse Wheel: Zoom</div>
          <br>
          <div><strong>Third Person:</strong></div>
          <div>WASD: Move target</div>
          <div>Mouse: Look around</div>
          <div>Wheel: Distance</div>
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
          <div>✅ Camera System: Multi-mode</div>
          <div>✅ Resource Economy: Running</div>
          <div>🎮 Ready for gameplay features!</div>
        </div>
      </div>
    `;

    // Setup global camera switching function
    (window as any).switchCamera = (cameraId: string) => {
      this.renderShell.switchCamera(cameraId);
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