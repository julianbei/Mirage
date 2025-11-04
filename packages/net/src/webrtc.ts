// packages/net/src/webrtc.ts
/** Minimal WebRTC mesh with reliable/unreliable DataChannels. */
export class Peer {
  pc = new RTCPeerConnection();
  reliable = this.pc.createDataChannel("reliable", { ordered: true });
  unreliable = this.pc.createDataChannel("unreliable", { ordered: false, maxRetransmits: 0 });

  onReliableMessage?: (u8: Uint8Array) => void;
  onUnreliableMessage?: (u8: Uint8Array) => void;

  constructor() {
    this.reliable.binaryType = "arraybuffer";
    this.unreliable.binaryType = "arraybuffer";
    this.reliable.onmessage = e => this.onReliableMessage?.(new Uint8Array(e.data));
    this.unreliable.onmessage = e => this.onUnreliableMessage?.(new Uint8Array(e.data));
  }

  sendReliable(u8: Uint8Array) { 
    if (this.reliable.readyState === 'open') {
      this.reliable.send(u8 as any); 
    }
  }
  sendUnreliable(u8: Uint8Array) { 
    if (this.unreliable.readyState === 'open') {
      this.unreliable.send(u8 as any); 
    }
  }
}