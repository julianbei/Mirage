// packages/engine-babylon/src/ui/keyBindingSettings.ts

import { InputController } from "../input/inputController";

export class KeyBindingSettings {
  private inputController: InputController;
  private container: HTMLElement | null = null;
  private isVisible = false;

  constructor(inputController: InputController) {
    this.inputController = inputController;
    this.createUI();
  }

  private createUI(): void {
    // Create main container
    this.container = document.createElement("div");
    this.container.className = "key-binding-settings";
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      border: 2px solid #444;
      z-index: 1000;
      display: none;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `;

    // Create title
    const title = document.createElement("h2");
    title.textContent = "Key Binding Settings";
    title.style.cssText = `
      margin: 0 0 20px 0;
      text-align: center;
      color: #fff;
    `;

    // Create profile selector
    const profileSection = document.createElement("div");
    profileSection.style.cssText = `
      margin-bottom: 20px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    `;

    const profileLabel = document.createElement("label");
    profileLabel.textContent = "Input Profile: ";
    profileLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    `;

    const profileSelect = document.createElement("select");
    profileSelect.style.cssText = `
      width: 100%;
      padding: 5px;
      background: #333;
      color: white;
      border: 1px solid #555;
      border-radius: 3px;
    `;

    // Populate profile options
    const profiles = this.inputController.getAvailableProfiles();
    profiles.forEach(profileName => {
      const option = document.createElement("option");
      option.value = profileName;
      option.textContent = profileName.toUpperCase();
      profileSelect.appendChild(option);
    });

    profileSelect.onchange = () => {
      this.inputController.setProfile(profileSelect.value);
      this.updateBindingsList();
    };

    profileSection.appendChild(profileLabel);
    profileSection.appendChild(profileSelect);

    // Create bindings list container
    const bindingsContainer = document.createElement("div");
    bindingsContainer.className = "bindings-list";
    bindingsContainer.style.cssText = `
      margin-bottom: 20px;
    `;

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.cssText = `
      width: 100%;
      padding: 10px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    `;
    closeButton.onclick = () => this.hide();

    // Assemble UI
    this.container.appendChild(title);
    this.container.appendChild(profileSection);
    this.container.appendChild(bindingsContainer);
    this.container.appendChild(closeButton);

    document.body.appendChild(this.container);

    this.updateBindingsList();
  }

  private updateBindingsList(): void {
    const container = this.container?.querySelector(".bindings-list");
    if (!container) return;

    container.innerHTML = "";

    const bindings = this.inputController.getBindingInfo();

    bindings.forEach(binding => {
      const bindingRow = document.createElement("div");
      bindingRow.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        margin-bottom: 5px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      `;

      const description = document.createElement("span");
      description.textContent = binding.description;
      description.style.cssText = `
        flex: 1;
        color: #ccc;
      `;

      const keysContainer = document.createElement("div");
      keysContainer.style.cssText = `
        display: flex;
        gap: 10px;
        align-items: center;
      `;

      // Primary key
      const primaryKey = document.createElement("button");
      primaryKey.textContent = this.formatKeyName(binding.primary);
      primaryKey.style.cssText = `
        padding: 4px 8px;
        background: #444;
        color: white;
        border: 1px solid #666;
        border-radius: 3px;
        cursor: pointer;
        min-width: 40px;
      `;
      primaryKey.onclick = () => this.rebindKey(binding.id, false, primaryKey);

      keysContainer.appendChild(primaryKey);

      // Secondary key (if exists)
      if (binding.secondary) {
        const secondaryKey = document.createElement("button");
        secondaryKey.textContent = this.formatKeyName(binding.secondary);
        secondaryKey.style.cssText = primaryKey.style.cssText;
        secondaryKey.onclick = () => this.rebindKey(binding.id, true, secondaryKey);
        keysContainer.appendChild(secondaryKey);
      }

      bindingRow.appendChild(description);
      bindingRow.appendChild(keysContainer);
      container.appendChild(bindingRow);
    });
  }

  private formatKeyName(key: string): string {
    const keyMap: { [key: string]: string } = {
      " ": "Space",
      "ArrowUp": "↑",
      "ArrowDown": "↓",
      "ArrowLeft": "←",
      "ArrowRight": "→",
      "Mouse0": "LMB",
      "Mouse1": "MMB",
      "Mouse2": "RMB",
      "Control": "Ctrl",
      "Shift": "Shift",
      "Escape": "Esc"
    };

    return keyMap[key] || key.toUpperCase();
  }

  private rebindKey(actionId: string, isSecondary: boolean, button: HTMLElement): void {
    button.textContent = "Press key...";
    button.style.background = "#007acc";

    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let keyName = e.key;
      
      // Special handling for modifier keys
      if (e.key === "Control") keyName = "Control";
      else if (e.key === "Shift") keyName = "Shift";
      else if (e.key === "Alt") keyName = "Alt";
      else if (e.key === "Meta") keyName = "Meta";

      this.inputController.customizeBinding(actionId, keyName, isSecondary);
      
      button.textContent = this.formatKeyName(keyName);
      button.style.background = "#444";

      document.removeEventListener("keydown", handleKeyPress);
    };

    document.addEventListener("keydown", handleKeyPress);
  }

  public show(): void {
    if (this.container) {
      this.container.style.display = "block";
      this.isVisible = true;
      this.updateBindingsList();
    }
  }

  public hide(): void {
    if (this.container) {
      this.container.style.display = "none";
      this.isVisible = false;
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public dispose(): void {
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
}