import { createPartInstance } from './Parts.js';
import { isCompatible, nodeWorldPosition } from './AttachmentNodes.js';

function rotatePoint(point, angle) {
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  return {
    x: point.x * c - point.y * sn,
    y: point.x * sn + point.y * c
  };
}

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

  findSnap(partId, world, rotation = 0, threshold = 0.35) {
    const newPart = createPartInstance(partId);
    const candidateNodes = newPart.nodes;
    let best = null;

    this.getOpenNodes().forEach((target) => {
      const targetPart = this.getPart(target.partUid);
      const targetWorld = nodeWorldPosition(targetPart, target.node);

      candidateNodes.forEach((sourceNode) => {
        if (!isCompatible(sourceNode.nodeType, target.node.nodeType)) return;

        const rotatedNode = rotatePoint(sourceNode.nodePosition, rotation);
        const x = targetWorld.x - rotatedNode.x;
        const y = targetWorld.y - rotatedNode.y;
        const d = Math.hypot(world.x - x, world.y - y);
        if (d <= threshold && (!best || d < best.d)) {
          best = {
            d,
            partX: x,
            partY: y,
            sourceNodeKey: sourceNode.key,
            target,
            rotation
          };
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

    const sourceNode = part.nodes.find((n) => n.key === snap.sourceNodeKey);
    if (sourceNode) sourceNode.occupied = true;

    this.parts.push(part);
  }

  placeFloatingPart(partId, position, rotation = 0) {
    const part = createPartInstance(partId);
    part.x = position.x;
    part.y = position.y;
    part.rotation = rotation;
    part.attachedTo = null;
    this.parts.push(part);
  }

  connectedToRoot() {
    if (!this.root) return [];

    const connected = new Set([this.root]);
    let changed = true;

    while (changed) {
      changed = false;
      this.parts.forEach((part) => {
        if (!part.attachedTo) return;
        const parentUid = part.attachedTo.uid;
        if (connected.has(parentUid) && !connected.has(part.uid)) {
          connected.add(part.uid);
          changed = true;
        }
      });
    }

    return this.parts.filter((part) => connected.has(part.uid));
  }

  bounds(parts = this.parts) {
    if (!parts.length) return { minY: 0, maxY: 4, maxRadius: 2 };
    const minY = Math.min(...parts.map((p) => p.y - p.height / 2));
    const maxY = Math.max(...parts.map((p) => p.y + p.height / 2));
    const maxRadius = Math.max(...parts.map((p) => Math.abs(p.x) + p.radius));
    return { minY, maxY, maxRadius };
  }
}
