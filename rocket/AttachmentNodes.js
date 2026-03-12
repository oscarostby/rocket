export function rotateLocalPosition(position, rotation = 0) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: position.x * cos - position.y * sin,
    y: position.x * sin + position.y * cos
  };
}

export function isCompatible(partNodeType, targetNodeType) {
  return (partNodeType === 'stack-top' && targetNodeType === 'stack-bottom')
    || (partNodeType === 'stack-bottom' && targetNodeType === 'stack-top')
    || (partNodeType === 'radial' && targetNodeType === 'radial');
}

export function nodeWorldPosition(part, node) {
  const local = rotateLocalPosition(node.nodePosition, part.rotation || 0);
  return { x: part.x + local.x, y: part.y + local.y };
}

export function attachmentOffset(partNode, targetNode) {
  return {
    x: targetNode.nodePosition.x - partNode.nodePosition.x,
    y: targetNode.nodePosition.y - partNode.nodePosition.y
  };
}
