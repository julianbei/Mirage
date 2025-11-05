// apps/tiny-rts/src/main.ts
import { RenderShell } from "../../../packages/engine-babylon/src/index";
import { KeyBindingSettings } from "../../../packages/engine-babylon/src/ui/keyBindingSettings";
import { startGame } from "./game";

const canvas = document.getElementById("app") as HTMLCanvasElement;

// Ensure canvas has proper size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Initial resize
resizeCanvas();

// Handle window resize
window.addEventListener('resize', resizeCanvas);

const shell = new RenderShell({ canvas });

// Create key binding settings
const keyBindingSettings = new KeyBindingSettings(shell.getInputController());

// Mount a simple UI
const startButton = document.createElement("button");
startButton.textContent = "Start Game";
startButton.style.position = "absolute";
startButton.style.top = "10px";
startButton.style.left = "10px";
startButton.style.zIndex = "1000";
startButton.onclick = () => startGame(shell);
document.body.appendChild(startButton);

// Add key bindings button
const keyBindingsButton = document.createElement("button");
keyBindingsButton.textContent = "Key Bindings";
keyBindingsButton.style.position = "absolute";
keyBindingsButton.style.top = "10px";
keyBindingsButton.style.left = "120px";
keyBindingsButton.style.zIndex = "1000";
keyBindingsButton.onclick = () => keyBindingSettings.toggle();
document.body.appendChild(keyBindingsButton);

// Add camera controls
const cameraSelect = document.createElement("select");
cameraSelect.style.position = "absolute";
cameraSelect.style.top = "50px";
cameraSelect.style.left = "10px";
cameraSelect.style.zIndex = "1000";

shell.getAvailableCameras().forEach((cam: string) => {
  const option = document.createElement("option");
  option.value = cam;
  option.textContent = cam;
  cameraSelect.appendChild(option);
});

cameraSelect.onchange = () => {
  shell.switchCamera(cameraSelect.value);
  updateControlsDisplay(cameraSelect.value);
};

document.body.appendChild(cameraSelect);

// Add controls display
const controlsDisplay = document.createElement("div");
controlsDisplay.style.cssText = `
  position: absolute;
  top: 90px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  max-width: 300px;
  z-index: 1000;
`;

function updateControlsDisplay(cameraType: string) {
  const controls = {
    rts: `RTS Camera Controls:
• W/S - Move camera forward/backward
• A/D - Strafe camera left/right  
• Q/E - Turn camera left/right
• Arrow Keys - Fine camera rotation
• Mouse Wheel - Zoom
• Move mouse to screen edges - Edge scroll
• Shift - Sprint mode`,
    
    thirdPerson: `Third Person Controls:
• W/S - Move character forward/backward
• Q/E - Strafe character left/right
• A/D - Turn character left/right
• Click canvas + drag mouse - Look around character
• Escape - Release mouse lock
• Shift - Sprint mode`,
    
    follow: `Follow Camera:
• Automatically follows selected unit
• Mouse Wheel - Adjust distance
• Right-click - Override follow temporarily`,
    
    orbit: `Orbit Camera Controls:
• Left-click + drag - Orbit around center
• Mouse Wheel - Zoom in/out
• Middle-click + drag - Pan view
• WASD - Move orbit center`,
    
    free: `Free Camera Controls:
• W/S - Move forward/backward
• A/D - Strafe left/right
• Q/E - Move up/down
• Mouse - Look around (click to lock cursor)
• Shift - Move faster
• ESC - Release cursor lock`
  };
  
  controlsDisplay.innerHTML = controls[cameraType as keyof typeof controls] || "No controls info";
}

document.body.appendChild(controlsDisplay);

// Initialize with RTS controls
updateControlsDisplay("rts");