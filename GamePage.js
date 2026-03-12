import { PARTS, findPart } from './rocket/Parts.js';
import { RocketBuilder } from './rocket/RocketBuilder.js';
import { nodeWorldPosition } from './rocket/AttachmentNodes.js';
import { RocketRenderer } from './rocket/RocketRenderer.js';
import { LaunchSimulation } from './rocket/LaunchSimulation.js';

const PRESETS = [
  {
    id: 'hopper',
    name: 'Training Hopper',
    description: 'Simple low-altitude rocket for learning controls.',
    previewBars: [20, 30, 30, 18],
    build(builder) {
      builder.clear();
      const root = builder.initDefault('mk1-pod');
      const tank = builder.attachPartToNode('tank-s', root.uid, 'bottom');
      const engine = builder.attachPartToNode('engine-s', tank.uid, 'bottom');
      builder.attachPartToNode('fin-s', tank.uid, 'radial-left');
      builder.attachPartToNode('fin-s', tank.uid, 'radial-right');
      return engine;
    }
  },
  {
    id: 'orbiter-lite',
    name: 'Orbiter Lite',
    description: 'Balanced stack with better fuel and thrust.',
    previewBars: [22, 34, 34, 26, 20],
    build(builder) {
      builder.clear();
      const root = builder.initDefault('probe-core');
      const tankA = builder.attachPartToNode('tank-m', root.uid, 'bottom');
      const decoupler = builder.attachPartToNode('decoupler', tankA.uid, 'bottom');
      const tankB = builder.attachPartToNode('tank-s', decoupler.uid, 'bottom');
      builder.attachPartToNode('engine-m', tankB.uid, 'bottom');
      builder.attachPartToNode('winglet', tankB.uid, 'radial-left');
      builder.attachPartToNode('winglet', tankB.uid, 'radial-right');
    }
  },
  {
    id: 'booster-stack',
    name: 'Heavy Booster',
    description: 'Prebuilt heavy lifter with side tanks.',
    previewBars: [24, 38, 38, 38, 26],
    build(builder) {
      builder.clear();
      const root = builder.initDefault('mk1-pod');
      const tank = builder.attachPartToNode('tank-l', root.uid, 'bottom');
      const tank2 = builder.attachPartToNode('tank-m', tank.uid, 'bottom');
      builder.attachPartToNode('engine-l', tank2.uid, 'bottom');
      builder.attachPartToNode('side-booster', tank2.uid, 'radial-left');
      builder.attachPartToNode('side-booster', tank2.uid, 'radial-right');
      builder.attachPartToNode('fin-l', tank2.uid, 'radial-left');
      builder.attachPartToNode('fin-l', tank2.uid, 'radial-right');
    }
  }
];

export function createGamePage(root) {
  root.innerHTML = `<div class="game-layout">
    <aside class="panel left">
      <h2>Vehicle Assembly Building</h2>
      <p class="panel-note">Drag parts onto nodes. Rotate with <kbd>R</kbd>. Right-mouse drag to pan camera. Mouse wheel to zoom.</p>
      <div class="controls-row">
        <button id="rotate-btn" class="sub-btn">Rotate (R)</button>
        <button id="camera-mode-btn" class="sub-btn">Free Camera: Off</button>
      </div>
      <div class="group-title">Quick Start Blueprints</div>
      <div id="preset-list" class="preset-list"></div>

      <div id="parts-list"></div>
    </aside>
    <main class="center-area">
      <div class="hud" id="alt-readout">Altitude: 0 m<br/>Max: 0 m</div>
      <div class="hud right" id="phase-readout">Build Phase</div>
    </main>
    <aside class="panel right">
      <h2>Flight Computer</h2>
      <div id="stats"></div>
      <button id="launch-btn">Launch Rocket</button>
      <div id="status" class="status"></div>
    </aside>
  </div>`;

  const center = root.querySelector('.center-area');
  const renderer = new RocketRenderer(center);
  const builder = new RocketBuilder();
  builder.initDefault();

  const state = {
    dragging: null,
    rotation: 0,
    launch: null,
    freeCamera: false,
    panning: false,
    lastPan: null,
    pointer: null,
    activeSnap: null,
    ghostPart: null
  };

  const presetList = root.querySelector('#preset-list');
  PRESETS.forEach((preset) => {
    const card = document.createElement('button');
    card.className = 'preset-card';
    const bars = preset.previewBars.map((w) => `<span style="width:${w}px"></span>`).join('');
    card.innerHTML = `<div class="preset-info"><strong>${preset.name}</strong><small>${preset.description}</small></div><div class="preset-preview">${bars}</div>`;
    card.addEventListener('click', () => {
      preset.build(builder);
      state.dragging = null;
      state.activeSnap = null;
      state.ghostPart = null;
      root.querySelector('#status').textContent = `Loaded blueprint: ${preset.name}`;
      redraw();
    });
    presetList.appendChild(card);
  });


    lastPan: null
  };

  const partsList = root.querySelector('#parts-list');
  Object.entries(PARTS).forEach(([group, parts]) => {
    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = group;
    partsList.appendChild(title);

    parts.forEach((part) => {
      const item = document.createElement('div');
      item.className = 'part-item';
      item.innerHTML = `<strong>${part.name}</strong><span>${part.mass.toFixed(2)} t · ${part.thrust || 0} kN</span>`;
      item.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        state.dragging = part.id;
        state.pointer = { x: e.clientX, y: e.clientY };
        center.classList.add('drag-active');
        renderDragPreview();
      item.draggable = true;
      item.innerHTML = `<strong>${part.name}</strong><span>${part.mass.toFixed(2)} t · ${part.thrust || 0} kN</span>`;
      item.addEventListener('dragstart', () => { state.dragging = part.id; });
      item.addEventListener('dragend', () => {
        state.dragging = null;
        renderer.renderSnapNodes([]);
        redraw();
      });
      partsList.appendChild(item);
    });
  });

  const statClass = (value, good, bad) => (value >= good ? 'good' : value >= bad ? 'warn' : 'bad');
  const refreshStats = () => {
    const totals = builder.parts.reduce((acc, p) => ({
      mass: acc.mass + p.mass,
      thrust: acc.thrust + p.thrust,
      fuel: acc.fuel + p.fuelCapacity,
      drag: acc.drag + p.drag,
      stability: acc.stability + p.stability
    }), { mass: 0, thrust: 0, fuel: 0, drag: 0, stability: 0 });

    const wetMass = totals.mass + totals.fuel * 0.01;
    const twr = totals.thrust / (wetMass * 9.81 || 1);
    root.querySelector('#stats').innerHTML = [
      ['Total Mass', `${wetMass.toFixed(2)} t`, statClass(9 - wetMass, 3, 1.2)],
      ['Max Thrust', `${totals.thrust.toFixed(0)} kN`, statClass(totals.thrust, 180, 95)],
      ['Thrust-to-Weight Ratio', twr.toFixed(2), statClass(twr, 1.3, 1)],
      ['Fuel Amount', `${totals.fuel.toFixed(0)} u`, statClass(totals.fuel, 130, 50)],
      ['Aerodynamic Drag', totals.drag.toFixed(2), statClass(1.9 - totals.drag, 0.9, 0.4)],
      ['Stability Index', totals.stability.toFixed(2), statClass(totals.stability, 1.2, 0.45)]
    ].map(([k, v, c]) => `<div class="stat-row"><span>${k}</span><strong class="${c}">${v}</strong></div>`).join('');
  };

  const redraw = (ghostPart = null, snap = null) => {
    renderer.renderRocket(builder.parts, ghostPart);
    const nodes = builder.getOpenNodes().map((n) => {
      const p = builder.getPart(n.partUid);
      return { ...n, world: nodeWorldPosition(p, n.node) };
    });
    renderer.renderSnapNodes(nodes, snap?.target);
    renderer.updateCamera(builder.bounds());
    refreshStats();
    renderer.frame();
  };

  const rotatePreview = () => {
    state.rotation = (state.rotation + Math.PI / 2) % (Math.PI * 2);
    if (state.dragging) renderDragPreview();
  };

  const toggleCameraMode = () => {
    state.freeCamera = !state.freeCamera;
    renderer.setAutoFrame(!state.freeCamera);
    if (!state.freeCamera) renderer.resetCameraOffset();
    root.querySelector('#camera-mode-btn').textContent = `Free Camera: ${state.freeCamera ? 'On' : 'Off'}`;
    redraw(state.ghostPart, state.activeSnap);
  };

  const pointerInsideCenter = (x, y) => {
    const rect = center.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };

  const renderDragPreview = () => {
    if (!state.dragging || !state.pointer) {
      state.ghostPart = null;
      state.activeSnap = null;
      redraw();
      return;
    }

    const world = renderer.screenToWorld(state.pointer.x, state.pointer.y);
    const snap = builder.findSnap(state.dragging, world, state.rotation);
    const part = findPart(state.dragging);
    const ghost = {
      ...part,
      x: snap ? snap.partX : world.x,
      y: snap ? snap.partY : world.y,
      rotation: state.rotation
    };

    state.ghostPart = ghost;
    state.activeSnap = snap;
    redraw(ghost, snap);
  };

  const stopDrag = (placeIfPossible) => {
    if (placeIfPossible && state.dragging && state.activeSnap && state.pointer && pointerInsideCenter(state.pointer.x, state.pointer.y)) {
      builder.placePart(state.dragging, state.activeSnap);
    }
    state.dragging = null;
    state.pointer = null;
    state.activeSnap = null;
    state.ghostPart = null;
    center.classList.remove('drag-active');

    redraw();
  };

  root.querySelector('#rotate-btn').addEventListener('click', rotatePreview);
  root.querySelector('#camera-mode-btn').addEventListener('click', toggleCameraMode);

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') rotatePreview();
    if (e.key.toLowerCase() === 'f') toggleCameraMode();
  });

  center.addEventListener('contextmenu', (e) => e.preventDefault());
  center.addEventListener('mousedown', (e) => {
    if (!state.freeCamera || e.button !== 2 || state.dragging) return;

    if (!state.freeCamera || e.button !== 2) return;
    state.panning = true;
    state.lastPan = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', (e) => {
    if (state.dragging) {
      state.pointer = { x: e.clientX, y: e.clientY };
      renderDragPreview();
      return;
    }


    if (!state.panning || !state.lastPan) return;
    const prev = renderer.screenToWorld(state.lastPan.x, state.lastPan.y);
    const next = renderer.screenToWorld(e.clientX, e.clientY);
    renderer.pan(prev.x - next.x, prev.y - next.y);
    state.lastPan = { x: e.clientX, y: e.clientY };
    redraw();
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0 && state.dragging) stopDrag(true);
    if (e.button === 2) {
      state.panning = false;
      state.lastPan = null;
    }

  window.addEventListener('mouseup', () => {
    state.panning = false;
    state.lastPan = null;
  });

  center.addEventListener('dragover', (e) => {
    if (!state.dragging) return;
    e.preventDefault();
    const world = renderer.screenToWorld(e.clientX, e.clientY);
    const snap = builder.findSnap(state.dragging, world, state.rotation);

    let ghost = null;
    if (snap) {
      const part = findPart(state.dragging);
      ghost = { ...part, x: snap.partX, y: snap.partY, rotation: state.rotation };
    }

    redraw(ghost, snap);
  });

  center.addEventListener('drop', (e) => {
    if (!state.dragging) return;
    e.preventDefault();
    const world = renderer.screenToWorld(e.clientX, e.clientY);
    const snap = builder.findSnap(state.dragging, world, state.rotation);
    if (snap) builder.placePart(state.dragging, snap);
    redraw();
  });

  center.addEventListener('wheel', (e) => {
    e.preventDefault();
    renderer.zoom = Math.min(3, Math.max(0.25, renderer.zoom + (e.deltaY > 0 ? -0.1 : 0.1)));
    redraw(state.ghostPart, state.activeSnap);
    redraw();
  }, { passive: false });

  root.querySelector('#launch-btn').addEventListener('click', () => {
    if (state.launch?.running) return;
    root.querySelector('#phase-readout').textContent = 'Launch Phase';

    state.launch = new LaunchSimulation(builder.parts, renderer, (physics) => {
      root.querySelector('#alt-readout').innerHTML = `Altitude: ${physics.altitude.toFixed(0)} m<br/>Max: ${physics.maxAltitude.toFixed(0)} m`;
      root.querySelector('#status').textContent = physics.failed ? `Failure: ${physics.reason}` : 'Nominal flight';
      builder.parts.forEach((part) => { part.y = 2 + physics.altitude / 180; });
      redraw(state.ghostPart, state.activeSnap);

      redraw();
    });

    state.launch.start();
  });

  redraw();
  const animate = () => {
    renderer.frame();
    requestAnimationFrame(animate);
  };
  animate();
}
