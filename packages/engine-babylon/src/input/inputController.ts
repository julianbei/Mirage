// packages/engine-babylon/src/input/inputController.ts

export interface KeyBinding {
  primary: string;
  secondary?: string;
  description: string;
}

export interface InputAction {
  id: string;
  binding: KeyBinding;
  isPressed: boolean;
  wasPressed: boolean;
  wasReleased: boolean;
}

export interface InputProfile {
  name: string;
  actions: Record<string, KeyBinding>;
}

export class InputController {
  private actions = new Map<string, InputAction>();
  private keyStates = new Map<string, boolean>();
  private previousKeyStates = new Map<string, boolean>();
  private currentProfile: InputProfile | null = null;

  // Default profiles
  private static readonly DEFAULT_PROFILES: Record<string, InputProfile> = {
    rts: {
      name: "RTS Controls",
      actions: {
        // Movement
        moveForward: { primary: "w", secondary: "W", description: "Move Forward" },
        moveBackward: { primary: "s", secondary: "S", description: "Move Backward" },
        strafeLeft: { primary: "a", secondary: "A", description: "Strafe Left" },
        strafeRight: { primary: "d", secondary: "D", description: "Strafe Right" },
        turnLeft: { primary: "q", secondary: "Q", description: "Turn Left" },
        turnRight: { primary: "e", secondary: "E", description: "Turn Right" },
        
        // Camera
        cameraUp: { primary: "ArrowUp", description: "Camera Up" },
        cameraDown: { primary: "ArrowDown", description: "Camera Down" },
        cameraLeft: { primary: "ArrowLeft", description: "Camera Left" },
        cameraRight: { primary: "ArrowRight", description: "Camera Right" },
        
        // Modifiers
        sprint: { primary: "Shift", description: "Sprint/Fast Mode" },
        crouch: { primary: "Control", description: "Crouch/Slow Mode" },
        
        // Actions
        interact: { primary: " ", description: "Interact/Jump" },
        menu: { primary: "Escape", description: "Menu" },
        
        // Mouse
        lookAround: { primary: "Mouse0", description: "Look Around" },
        contextAction: { primary: "Mouse2", description: "Context Action" }
      }
    },
    
    thirdPerson: {
      name: "Third Person Controls",
      actions: {
        // Character movement
        moveForward: { primary: "w", secondary: "W", description: "Move Forward" },
        moveBackward: { primary: "s", secondary: "S", description: "Move Backward" },
        turnLeft: { primary: "a", secondary: "A", description: "Turn Left" },
        turnRight: { primary: "d", secondary: "D", description: "Turn Right" },
        strafeLeft: { primary: "q", secondary: "Q", description: "Strafe Left" },
        strafeRight: { primary: "e", secondary: "E", description: "Strafe Right" },
        
        // Actions
        sprint: { primary: "Shift", description: "Sprint" },
        crouch: { primary: "Control", description: "Crouch" },
        jump: { primary: " ", description: "Jump" },
        
        // Camera
        lookAround: { primary: "Mouse0", description: "Look Around" },
        contextAction: { primary: "Mouse2", description: "Context Action" },
        
        menu: { primary: "Escape", description: "Menu" }
      }
    },
    
    free: {
      name: "Free Camera Controls",
      actions: {
        // 6DOF movement
        moveForward: { primary: "w", secondary: "W", description: "Move Forward" },
        moveBackward: { primary: "s", secondary: "S", description: "Move Backward" },
        strafeLeft: { primary: "a", secondary: "A", description: "Strafe Left" },
        strafeRight: { primary: "d", secondary: "D", description: "Strafe Right" },
        moveUp: { primary: "e", secondary: "E", description: "Move Up" },
        moveDown: { primary: "q", secondary: "Q", description: "Move Down" },
        
        // Modifiers
        sprint: { primary: "Shift", description: "Fast Movement" },
        
        // Mouse
        lookAround: { primary: "Mouse0", description: "Look Around" },
        menu: { primary: "Escape", description: "Release Mouse Lock" }
      }
    }
  };

  constructor() {
    this.setupEventListeners();
    this.setProfile("rts"); // Default profile
  }

  private setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      this.updateKeyState(e.key, true);
      this.updateKeyState(e.code, true);
    });

    window.addEventListener("keyup", (e) => {
      this.updateKeyState(e.key, false);
      this.updateKeyState(e.code, false);
    });

    window.addEventListener("mousedown", (e) => {
      this.updateKeyState(`Mouse${e.button}`, true);
    });

    window.addEventListener("mouseup", (e) => {
      this.updateKeyState(`Mouse${e.button}`, false);
    });

    // Prevent default for common game keys
    window.addEventListener("keydown", (e) => {
      if (["w", "a", "s", "d", "q", "e", " ", "Shift", "Control"].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  private updateKeyState(key: string, pressed: boolean) {
    this.keyStates.set(key, pressed);
  }

  public update() {
    // Update action states based on current key bindings
    for (const [actionId, action] of this.actions) {
      const binding = action.binding;
      const wasPressed = action.isPressed;
      
      // Check if any bound key is pressed
      const isPressed = this.isKeyPressed(binding.primary) || 
                       (binding.secondary ? this.isKeyPressed(binding.secondary) : false);
      
      action.wasPressed = !wasPressed && isPressed; // Just pressed this frame
      action.wasReleased = wasPressed && !isPressed; // Just released this frame
      action.isPressed = isPressed;
    }

    // Copy current states to previous for next frame
    this.previousKeyStates.clear();
    for (const [key, state] of this.keyStates) {
      this.previousKeyStates.set(key, state);
    }
  }

  private isKeyPressed(key: string): boolean {
    return this.keyStates.get(key) || false;
  }

  public setProfile(profileName: string) {
    const profile = InputController.DEFAULT_PROFILES[profileName];
    if (!profile) {
      console.warn(`Input profile "${profileName}" not found`);
      return;
    }

    this.currentProfile = profile;
    this.actions.clear();

    // Create action objects from profile
    for (const [actionId, binding] of Object.entries(profile.actions)) {
      this.actions.set(actionId, {
        id: actionId,
        binding,
        isPressed: false,
        wasPressed: false,
        wasReleased: false
      });
    }

    console.log(`Switched to input profile: ${profile.name}`);
  }

  public isActionPressed(actionId: string): boolean {
    return this.actions.get(actionId)?.isPressed || false;
  }

  public wasActionPressed(actionId: string): boolean {
    return this.actions.get(actionId)?.wasPressed || false;
  }

  public wasActionReleased(actionId: string): boolean {
    return this.actions.get(actionId)?.wasReleased || false;
  }

  public getActionValue(actionId: string): number {
    return this.isActionPressed(actionId) ? 1 : 0;
  }

  public getAxisValue(positiveAction: string, negativeAction: string): number {
    const positive = this.getActionValue(positiveAction);
    const negative = this.getActionValue(negativeAction);
    return positive - negative;
  }

  public getCurrentProfile(): InputProfile | null {
    return this.currentProfile;
  }

  public getAvailableProfiles(): string[] {
    return Object.keys(InputController.DEFAULT_PROFILES);
  }

  public customizeBinding(actionId: string, newKey: string, secondary = false) {
    const action = this.actions.get(actionId);
    if (!action) {
      console.warn(`Action "${actionId}" not found`);
      return;
    }

    if (secondary) {
      action.binding.secondary = newKey;
    } else {
      action.binding.primary = newKey;
    }

    console.log(`Updated ${actionId} binding: ${action.binding.primary}${action.binding.secondary ? ` / ${action.binding.secondary}` : ''}`);
  }

  public getBindingInfo(): Array<{id: string, description: string, primary: string, secondary?: string}> {
    return Array.from(this.actions.values()).map(action => ({
      id: action.id,
      description: action.binding.description,
      primary: action.binding.primary,
      secondary: action.binding.secondary
    }));
  }

  public dispose() {
    // Clean up event listeners if needed
  }
}