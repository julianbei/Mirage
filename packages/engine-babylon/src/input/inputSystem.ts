// packages/engine-babylon/src/input/inputSystem.ts
import type { GameSystem, GameContext } from "@core/framework";

interface InputState {
  mouse: { x: number; y: number; buttons: number };
  keys: Set<string>;
}

let inputState: InputState = {
  mouse: { x: 0, y: 0, buttons: 0 },
  keys: new Set()
};

export const InputSystem: GameSystem = {
  id: "Input.System",
  onInit(ctx: GameContext) {
    const canvas = document.querySelector("canvas#app") as HTMLCanvasElement;
    
    // Mouse events
    canvas.addEventListener("mousemove", (e) => {
      inputState.mouse.x = e.clientX;
      inputState.mouse.y = e.clientY;
    });
    
    canvas.addEventListener("mousedown", (e) => {
      inputState.mouse.buttons |= (1 << e.button);
    });
    
    canvas.addEventListener("mouseup", (e) => {
      inputState.mouse.buttons &= ~(1 << e.button);
    });
    
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      inputState.keys.add(e.code);
    });
    
    window.addEventListener("keyup", (e) => {
      inputState.keys.delete(e.code);
    });
    
    console.log("Input system initialized");
  },
  
  onTick(ctx: GameContext) {
    // Input state is available for other systems to read
  }
};

export function getInputState(): InputState {
  return inputState;
}