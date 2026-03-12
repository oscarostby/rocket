import { createPartInstance } from './Parts.js';
import { isCompatible, nodeWorldPosition } from './AttachmentNodes.js';

export class RocketBuilder {
  constructor() {
    this.parts = [];
    this.root = null;
  }

  clear() {
    this.parts = [];
    this.root = null;
  }

  initDefault(partId = 'mk1-pod', includeStarterStack = false) {
    const pod = createPartInstance(partId);
    pod.y = 2;
    this.parts.push(pod);
    this.root = pod.uid;

    if (includeStarterStack) {
      const tank = this.attachPartToNode('tank-s', pod.uid, 'bottom');
      if (tank) {
        this.attachPartToNode('engine-s', tank.uid, 'bottom');
        this.attachPartToNode('fin-s', tank.uid, 'radial-left');
        this.attachPartToNode('fin-s', tank.uid, 'radial-right');
      }
    }

    return pod;
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

  attachPartToNode(partId, targetPartUid, targetNodeKey, preferredSourceKey = null, rotation = 0) {
    const targetPart = this.getPart(targetPartUid);
    if (!targetPart) return null;

    const targetNode = targetNodeKey.startsWith('radial-')
      ? { nodeType: 'radial', nodePosition: { x: targetNodeKey === 'radial-left' ? -targetPart.radius : targetPart.radius, y: 0 }, occupied: false }
      : targetPart.nodes.find((n) => n.key === targetNodeKey);

    if (!targetNode || targetNode.occupied) return null;

    const part = createPartInstance(partId);
    const sourceCandidates = preferredSourceKey
      ? part.nodes.filter((n) => n.key === preferredSourceKey)
      : part.nodes;

    const sourceNode = sourceCandidates.find((n) => isCompatible(n.nodeType, targetNode.nodeType));
    if (!sourceNode) return null;

    const targetWorld = nodeWorldPosition(targetPart, targetNode);
    part.x = targetWorld.x - sourceNode.nodePosition.x;
    part.y = targetWorld.y - sourceNode.nodePosition.y;
    part.rotation = rotation;
    part.attachedTo = { uid: targetPartUid, nodeKey: targetNodeKey };

    const occupiedTargetNode = targetPart.nodes.find((n) => n.key === targetNodeKey);
    if (occupiedTargetNode) occupiedTargetNode.occupied = true;
    sourceNode.occupied = true;

    this.parts.push(part);
    return part;
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
