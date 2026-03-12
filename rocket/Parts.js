export const PARTS = {
  command: [
    { id: 'mk1-pod', name: 'Mk1 Command Pod', type: 'command', mass: 1.2, fuelCapacity: 0, thrust: 0, drag: 0.22, stability: 0.25, height: 1.4, radius: 0.6, color: '#9ab8ff', nodes: [{ key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.7 }, occupied: false }] },
    { id: 'probe-core', name: 'Probe Core', type: 'command', mass: 0.4, fuelCapacity: 0, thrust: 0, drag: 0.14, stability: 0.14, height: 0.6, radius: 0.45, color: '#9bc7ff', nodes: [{ key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.3 }, occupied: false }] },
    { id: 'lander-can', name: 'Lander Can', type: 'command', mass: 0.9, fuelCapacity: 0, thrust: 0, drag: 0.18, stability: 0.2, height: 1.0, radius: 0.7, color: '#a7bbd1', nodes: [{ key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.5 }, occupied: false }] }
  ],
  fuel: [
    { id: 'tank-s', name: 'Small Fuel Tank', type: 'fuel', mass: 0.8, fuelCapacity: 70, thrust: 0, drag: 0.2, stability: 0.06, height: 1.0, radius: 0.5, color: '#b4bcc8', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.5 }, occupied: false }, { key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.5 }, occupied: false }] },
    { id: 'tank-m', name: 'Medium Fuel Tank', type: 'fuel', mass: 1.5, fuelCapacity: 150, thrust: 0, drag: 0.25, stability: 0.08, height: 1.7, radius: 0.6, color: '#aab4c2', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.85 }, occupied: false }, { key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.85 }, occupied: false }] },
    { id: 'tank-l', name: 'Large Fuel Tank', type: 'fuel', mass: 2.7, fuelCapacity: 270, thrust: 0, drag: 0.3, stability: 0.09, height: 2.2, radius: 0.7, color: '#9ca9b8', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 1.1 }, occupied: false }, { key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -1.1 }, occupied: false }] },
    { id: 'side-booster', name: 'Side Booster Tank', type: 'fuel', mass: 1.1, fuelCapacity: 95, thrust: 0, drag: 0.22, stability: 0.07, height: 1.4, radius: 0.38, color: '#b8c2d0', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.7 }, occupied: false }, { key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.7 }, occupied: false }, { key: 'side', nodeType: 'radial', nodePosition: { x: 0.4, y: 0 }, occupied: false }] }
  ],
  engines: [
    { id: 'engine-s', name: 'Small Engine', type: 'engine', mass: 1.0, fuelCapacity: 0, thrust: 90, drag: 0.2, stability: 0.04, height: 0.8, radius: 0.45, color: '#ff973d', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.4 }, occupied: false }] },
    { id: 'engine-m', name: 'Medium Engine', type: 'engine', mass: 1.8, fuelCapacity: 0, thrust: 180, drag: 0.25, stability: 0.05, height: 1.0, radius: 0.55, color: '#ff852d', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.5 }, occupied: false }] },
    { id: 'engine-l', name: 'Large Engine', type: 'engine', mass: 2.8, fuelCapacity: 0, thrust: 320, drag: 0.3, stability: 0.06, height: 1.2, radius: 0.7, color: '#ff6f1f', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.6 }, occupied: false }] },
    { id: 'vac-engine', name: 'Vacuum Engine', type: 'engine', mass: 1.6, fuelCapacity: 0, thrust: 220, drag: 0.2, stability: 0.05, height: 1.35, radius: 0.5, color: '#ffc37a', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.675 }, occupied: false }] }
  ],
  stability: [
    { id: 'fin-s', name: 'Small Fins', type: 'fin', mass: 0.2, fuelCapacity: 0, thrust: 0, drag: 0.16, stability: 0.6, height: 0.5, radius: 0.2, color: '#3bc972', nodes: [{ key: 'side', nodeType: 'radial', nodePosition: { x: 0.55, y: 0 }, occupied: false }] },
    { id: 'fin-l', name: 'Large Fins', type: 'fin', mass: 0.35, fuelCapacity: 0, thrust: 0, drag: 0.2, stability: 1.0, height: 0.7, radius: 0.25, color: '#2db865', nodes: [{ key: 'side', nodeType: 'radial', nodePosition: { x: 0.65, y: 0 }, occupied: false }] },
    { id: 'winglet', name: 'Winglet', type: 'fin', mass: 0.22, fuelCapacity: 0, thrust: 0, drag: 0.14, stability: 0.7, height: 0.62, radius: 0.22, color: '#39b56f', nodes: [{ key: 'side', nodeType: 'radial', nodePosition: { x: 0.58, y: 0 }, occupied: false }] }
  ],
  utility: [
    { id: 'decoupler', name: 'Decoupler', type: 'decoupler', mass: 0.2, fuelCapacity: 0, thrust: 0, drag: 0.1, stability: 0.02, height: 0.3, radius: 0.62, color: '#f9d16e', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.15 }, occupied: false }, { key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.15 }, occupied: false }] },
    { id: 'parachute', name: 'Parachute', type: 'parachute', mass: 0.15, fuelCapacity: 0, thrust: 0, drag: 0.3, stability: 0.12, height: 0.5, radius: 0.55, color: '#ff6ba0', nodes: [{ key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.25 }, occupied: false }] },
    { id: 'nose-cone', name: 'Aerodynamic Nose Cone', type: 'nosecone', mass: 0.1, fuelCapacity: 0, thrust: 0, drag: 0.05, stability: 0.05, height: 0.65, radius: 0.5, color: '#d7e3f4', nodes: [{ key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.325 }, occupied: false }] },
    { id: 'adapter', name: 'Size Adapter', type: 'adapter', mass: 0.25, fuelCapacity: 0, thrust: 0, drag: 0.08, stability: 0.04, height: 0.5, radius: 0.65, color: '#b9c7d8', nodes: [{ key: 'top', nodeType: 'stack-top', nodePosition: { x: 0, y: 0.25 }, occupied: false }, { key: 'bottom', nodeType: 'stack-bottom', nodePosition: { x: 0, y: -0.25 }, occupied: false }] }
  ]
};

const ALL_PARTS = Object.values(PARTS).flat();

export function findPart(id) { return ALL_PARTS.find((p) => p.id === id); }

export function createPartInstance(id) {
  const base = findPart(id);
  if (!base) throw new Error(`Unknown part ${id}`);
  return {
    ...structuredClone(base),
    uid: `${id}-${Math.random().toString(16).slice(2)}`,
    x: 0,
    y: 0,
    rotation: 0,
    attachedTo: null
  };
}
