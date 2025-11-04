// packages/net/src/lobbyClient.ts
/** Placeholder lobby/signaling client. Reuse external auth service repo. */
export class LobbyClient {
  constructor(private baseUrl: string) {}
  async createRoom(): Promise<{ roomId: string }> {
    // Call your separate infra repo API here
    return { roomId: crypto.randomUUID() };
  }
}