export function isCompatible(partNodeType, targetNodeType) {
  return (partNodeType === 'stack-top' && targetNodeType === 'stack-bottom')
    || (partNodeType === 'stack-bottom' && targetNodeType === 'stack-top')
    || (partNodeType === 'radial' && targetNodeType === 'radial');
}

export function nodeWorldPosition(part, node) {
  return { x: part.x + node.nodePosition.x, y: part.y + node.nodePosition.y };
}

export function attachmentOffset(partNode, targetNode) {
  return {
    x: targetNode.nodePosition.x - partNode.nodePosition.x,
    y: targetNode.nodePosition.y - partNode.nodePosition.y
  };
}
