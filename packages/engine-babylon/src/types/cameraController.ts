import { Camera } from "babylonjs";

export interface CameraController {
  camera: Camera;
  update(deltaTime: number): void;
  dispose(): void;
}