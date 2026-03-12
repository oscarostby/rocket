import { createPartInstance } from './Parts.js';
import { isCompatible, nodeWorldPosition } from './AttachmentNodes.js';

export class RocketBuilder {
  constructor() {
    this.parts = [];
    this.root = null;
  }

  initDefault() {
    const pod = createPartInstance('mk1-pod');
    pod.y = 2;
    this.parts.push(pod);
    this.root = pod.uid;
  }

  getPart(uid) { return this.parts.find((p) => p.uid === uid); }

  getOpenNodes() {
    const out = [];
    this.parts.forEach((part) => {
      part.nodes.forEach((node) => {
        if (!node.occupied) out.push({ partUid: part.uid, nodeKey: node.key, node });
      });
      if (part.type !== 'fin') {
        out.push({ partUid: part.uid, nodeKey: 'radial-left', node: { nodeType: 'radial', nodePosition: { x: -part.radius, y: 0 }, occupied: false } });
        out.push({ partUid: part.uid, nodeKey: 'radial-right', node: { nodeType: 'radial', nodePosition: { x: part.radius, y: 0 }, occupied: false } });
      }
    });
    return out;
  }

  findSnap(partId, world, rotation = 0, threshold = 0.65) {
    const newPart = createPartInstance(partId);
    const candidateNodes = newPart.nodes;
    let best = null;

    this.getOpenNodes().forEach((target) => {
      const targetPart = this.getPart(target.partUid);
      const targetWorld = nodeWorldPosition(targetPart, target.node);

      candidateNodes.forEach((sourceNode) => {
        if (!isCompatible(sourceNode.nodeType, target.node.nodeType)) return;

        const x = targetWorld.x - sourceNode.nodePosition.x;
        const y = targetWorld.y - sourceNode.nodePosition.y;
        const d = Math.hypot(world.x - x, world.y - y);
        if (d <= threshold && (!best || d < best.d)) {
          best = { d, partX: x, partY: y, sourceNode, target, rotation };
        }
      });
    });

    return best;
  }

  placePart(partId, snap) {
    const part = createPartInstance(partId);
    part.x = snap.partX;
    part.y = snap.partY;
    part.rotation = snap.rotation ?? 0;
    part.attachedTo = { uid: snap.target.partUid, nodeKey: snap.target.nodeKey };

    const targetPart = this.getPart(snap.target.partUid);
    const targetNode = targetPart.nodes.find((n) => n.key === snap.target.nodeKey);
    if (targetNode) targetNode.occupied = true;

    const sourceNode = part.nodes.find((n) => n.key === snap.sourceNode.key);
    if (sourceNode) sourceNode.occupied = true;

    this.parts.push(part);
  }

  bounds() {
    if (!this.parts.length) return { minY: 0, maxY: 4, maxRadius: 2 };
    const minY = Math.min(...this.parts.map((p) => p.y - p.height / 2));
    const maxY = Math.max(...this.parts.map((p) => p.y + p.height / 2));
    const maxRadius = Math.max(...this.parts.map((p) => Math.abs(p.x) + p.radius));
    return { minY, maxY, maxRadius };
  }
}
