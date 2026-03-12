import * as THREE from 'three';

export class RocketRenderer {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-8, 8, 8, -2, 0.1, 60);
    this.camera.position.set(0, 3, 12);
    this.camera.lookAt(0, 3, 0);

    this.zoom = 1;
    this.autoFrame = true;
    this.cameraOffset = { x: 0, y: 0 };

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor('#87b9ff');
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'three-canvas';

    this.background = new THREE.Group();
    this.partGroup = new THREE.Group();
    this.snapGroup = new THREE.Group();
    this.effects = new THREE.Group();
    this.scene.add(this.background, this.partGroup, this.snapGroup, this.effects);

    this.addEnvironment();
    window.addEventListener('resize', () => this.resize(container));
    this.resize(container);
  }

  createRect(width, height, color, z = 0, opacity = 1) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity })
    );
    mesh.position.z = z;
    return mesh;
  }

  createCircle(radius, color, z = 0, opacity = 1) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 24),
      new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity })
    );
    mesh.position.z = z;
    return mesh;
  }

  createOutlinedShape(shape, color, ghost = false, z = 0) {
    const group = new THREE.Group();
    const fill = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color,
        transparent: ghost,
        opacity: ghost ? 0.5 : 1
      })
    );
    fill.position.z = z;

    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(shape.getPoints().map((p) => new THREE.Vector3(p.x, p.y, z + 0.02))),
      new THREE.LineBasicMaterial({
        color: ghost ? '#bfdbfe' : '#1f2937',
        transparent: ghost,
        opacity: ghost ? 0.9 : 1
      })
    );

    group.add(fill, line);
    return group;
  }

  roundedRectShape(width, height, radius) {
    const w = width / 2;
    const h = height / 2;
    const r = Math.min(radius, w, h);
    const shape = new THREE.Shape();
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    return shape;
  }

  addEnvironment() {
    const sky = this.createRect(120, 85, '#81b7ff', -8);
    sky.position.set(0, 20, -8);
    this.background.add(sky);

    const highAtmosphere = this.createRect(120, 25, '#b4dbff', -7, 0.65);
    highAtmosphere.position.set(0, 9, -7);
    this.background.add(highAtmosphere);

    const mountains = this.createRect(120, 6, '#6f9ccc', -6.5, 0.5);
    mountains.position.set(0, 0, -6.5);
    this.background.add(mountains);

    const ground = this.createRect(120, 8, '#4a8247', -6);
    ground.position.set(0, -3.2, -6);
    this.background.add(ground);

    const runway = this.createRect(120, 0.55, '#365e35', -5.8);
    runway.position.set(0, 0.2, -5.8);
    this.background.add(runway);

    const pad = this.createRect(7, 0.74, '#66758c', -2);
    pad.position.set(0, -1.85, -2);
    const padMark = this.createRect(1.8, 0.08, '#9fb0c8', -1.95);
    padMark.position.set(0, -1.85, -1.95);
    this.background.add(pad, padMark);

    const tower = this.createRect(0.62, 6.2, '#8f9db2', -2);
    tower.position.set(-2.72, 1.05, -2);
    const arm = this.createRect(1.45, 0.22, '#70849d', -2);
    arm.position.set(-2.2, 2.8, -2);
    this.background.add(tower, arm);

    this.clouds = new THREE.Group();
    for (let i = 0; i < 10; i += 1) {
      const cloud = new THREE.Group();
      const x = -18 + i * 4;
      const y = 6 + Math.random() * 3.6;
      cloud.add(this.createCircle(0.85, '#ffffff', -6.3, 0.78));
      const p2 = this.createCircle(0.62, '#ffffff', -6.3, 0.78);
      p2.position.x = -0.78;
      const p3 = this.createCircle(0.72, '#ffffff', -6.3, 0.78);
      p3.position.x = 0.82;
      cloud.add(p2, p3);
      cloud.position.set(x, y, -6.3);
      this.clouds.add(cloud);
    }
    this.background.add(this.clouds);

    this.stars = new THREE.Group();
    for (let i = 0; i < 140; i += 1) {
      const star = this.createCircle(0.03 + Math.random() * 0.04, '#ffffff', -7.7, 0.95);
      star.position.set((Math.random() - 0.5) * 45, 2 + Math.random() * 24, -7.7);
      star.visible = false;
      this.stars.add(star);
    }
    this.background.add(this.stars);
  }

  setAutoFrame(enabled) {
    this.autoFrame = enabled;
  }

  resetCameraOffset() {
    this.cameraOffset = { x: 0, y: 0 };
  }

  pan(dxWorld, dyWorld) {
    this.cameraOffset.x += dxWorld;
    this.cameraOffset.y += dyWorld;
  }

  buildFuelTank(part, group, bodyColor, ghost) {
    const body = this.createOutlinedShape(this.roundedRectShape(part.radius * 1.95, part.height, part.radius * 0.24), bodyColor, ghost);
    const stripe = this.createRect(part.radius * 1.8, 0.14, '#e2e8f0', 0.09, ghost ? 0.6 : 1);
    stripe.position.y = part.height * 0.14;
    const capTop = this.createRect(part.radius * 1.85, 0.08, '#1f2937', 0.1, ghost ? 0.6 : 0.95);
    capTop.position.y = part.height * 0.47;
    const capBottom = this.createRect(part.radius * 1.85, 0.08, '#1f2937', 0.1, ghost ? 0.6 : 0.95);
    capBottom.position.y = -part.height * 0.47;
    group.add(body, stripe, capTop, capBottom);
  }

  buildEngine(part, group, ghost) {
    const mount = this.createRect(part.radius * 1.35, part.height * 0.28, '#64748b', 0.06, ghost ? 0.6 : 1);
    mount.position.y = part.height * 0.34;

    const bellShape = new THREE.Shape();
    bellShape.moveTo(-part.radius * 0.44, part.height * 0.2);
    bellShape.lineTo(part.radius * 0.44, part.height * 0.2);
    bellShape.lineTo(part.radius * 0.94, -part.height * 0.5);
    bellShape.lineTo(-part.radius * 0.94, -part.height * 0.5);
    const bell = this.createOutlinedShape(bellShape, ghost ? '#fdba74' : '#f97316', ghost, 0.04);

    const nozzle = this.createRect(part.radius * 0.56, part.height * 0.16, '#1f2937', 0.1, ghost ? 0.6 : 1);
    nozzle.position.y = -part.height * 0.46;

    const pipe = this.createRect(part.radius * 0.14, part.height * 0.25, '#334155', 0.11, ghost ? 0.6 : 1);
    pipe.position.y = -part.height * 0.02;
    group.add(mount, bell, nozzle, pipe);
  }

  buildCommandPod(part, group, bodyColor, ghost) {
    const podShape = new THREE.Shape();
    podShape.moveTo(-part.radius * 0.92, -part.height * 0.45);
    podShape.lineTo(part.radius * 0.92, -part.height * 0.45);
    podShape.quadraticCurveTo(part.radius * 0.84, part.height * 0.18, 0, part.height * 0.5);
    podShape.quadraticCurveTo(-part.radius * 0.84, part.height * 0.18, -part.radius * 0.92, -part.height * 0.45);
    const pod = this.createOutlinedShape(podShape, bodyColor, ghost);
    const window = this.createCircle(part.radius * 0.22, '#2563eb', 0.08, ghost ? 0.5 : 0.95);
    window.position.y = part.height * 0.1;
    const hatch = this.createRect(part.radius * 1.1, 0.1, '#334155', 0.08, ghost ? 0.5 : 0.95);
    hatch.position.y = -part.height * 0.25;
    group.add(pod, window, hatch);
  }

  partMesh(part, ghost = false) {
    const group = new THREE.Group();
    const bodyColor = ghost ? '#dbeafe' : part.color || '#cbd5e1';

    if (part.type === 'fuel') {
      this.buildFuelTank(part, group, bodyColor, ghost);
    } else if (part.type === 'engine') {
      this.buildEngine(part, group, ghost);
    } else if (part.type === 'fin') {
      const finShape = new THREE.Shape();
      finShape.moveTo(-part.radius * 0.28, part.height * 0.5);
      finShape.lineTo(part.radius * 1.45, part.height * 0.24);
      finShape.lineTo(part.radius * 1.2, -part.height * 0.52);
      finShape.lineTo(-part.radius * 0.32, -part.height * 0.36);
      const fin = this.createOutlinedShape(finShape, ghost ? '#86efac' : '#16a34a', ghost, 0.08);
      group.add(fin);
      group.rotation.z = part.x >= 0 ? -Math.PI / 2 : Math.PI / 2;
    } else if (part.type === 'decoupler') {
      const ring = this.createOutlinedShape(this.roundedRectShape(part.radius * 2, part.height, 0.08), ghost ? '#fde68a' : '#f59e0b', ghost);
      group.add(ring);
      for (let i = -2; i <= 2; i += 1) {
        const bolt = this.createCircle(0.03, '#1f2937', 0.1, ghost ? 0.6 : 1);
        bolt.position.x = i * part.radius * 0.42;
        group.add(bolt);
      }
    } else if (part.type === 'adapter') {
      const shape = new THREE.Shape();
      shape.moveTo(-part.radius * 0.68, part.height * 0.5);
      shape.lineTo(part.radius * 0.68, part.height * 0.5);
      shape.lineTo(part.radius, -part.height * 0.5);
      shape.lineTo(-part.radius, -part.height * 0.5);
      const adapter = this.createOutlinedShape(shape, bodyColor, ghost);
      const seam = this.createRect(part.radius * 1.7, 0.07, '#334155', 0.08, ghost ? 0.6 : 1);
      seam.position.y = 0;
      group.add(adapter, seam);
    } else if (part.type === 'nosecone') {
      const shape = new THREE.Shape();
      shape.moveTo(-part.radius, -part.height * 0.5);
      shape.quadraticCurveTo(-part.radius * 0.45, part.height * 0.15, 0, part.height * 0.5);
      shape.quadraticCurveTo(part.radius * 0.45, part.height * 0.15, part.radius, -part.height * 0.5);
      const cone = this.createOutlinedShape(shape, bodyColor, ghost, 0.04);
      group.add(cone);
      const seam = this.createRect(part.radius * 1.8, 0.06, '#475569', 0.08, ghost ? 0.6 : 0.9);
      seam.position.y = -part.height * 0.44;
      group.add(seam);
    } else if (part.type === 'parachute') {
      const canister = this.createOutlinedShape(this.roundedRectShape(part.radius * 1.85, part.height * 0.55, 0.1), '#64748b', ghost);
      canister.position.y = -part.height * 0.2;
      const canopyShape = new THREE.Shape();
      canopyShape.moveTo(-part.radius * 0.95, 0);
      canopyShape.quadraticCurveTo(0, part.height * 0.92, part.radius * 0.95, 0);
      canopyShape.lineTo(-part.radius * 0.95, 0);
      const canopy = this.createOutlinedShape(canopyShape, ghost ? '#f9a8d4' : '#ec4899', ghost, 0.06);
      canopy.position.y = part.height * 0.06;
      group.add(canister, canopy);
    } else {
      this.buildCommandPod(part, group, bodyColor, ghost);
    }

    group.position.set(part.x, part.y, 0);
    group.rotation.z += part.rotation || 0;
    return group;
  }

  renderRocket(parts, ghostPart = null) {
    this.partGroup.clear();
    parts.forEach((part) => this.partGroup.add(this.partMesh(part)));
    if (ghostPart) this.partGroup.add(this.partMesh(ghostPart, true));
  }

  renderSnapNodes(nodes, validTarget = null) {
    this.snapGroup.clear();
    nodes.forEach((n) => {
      const valid = validTarget && validTarget.partUid === n.partUid && validTarget.nodeKey === n.nodeKey;
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 24 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 24;
            return new THREE.Vector3(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.15);
          })
        ),
        new THREE.LineBasicMaterial({ color: valid ? '#22c55e' : '#ef4444' })
      );
      ring.position.set(n.world.x, n.world.y, 0.15);
      this.snapGroup.add(ring);
    });
  }

  screenToWorld(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * (this.camera.right - this.camera.left) + this.camera.left;
    const y = (1 - (clientY - rect.top) / rect.height) * (this.camera.top - this.camera.bottom) + this.camera.bottom;
    return { x, y };
  }

  updateCamera(bounds) {
    const height = Math.max(8, bounds.maxY - bounds.minY + 5);
    const width = Math.max(10, bounds.maxRadius * 2 + 6);
    const aspect = this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight;
    const halfH = height / (2 * this.zoom);
    const halfW = Math.max(width / (2 * this.zoom), halfH * aspect);
    const centerY = (bounds.maxY + bounds.minY) / 2;

    if (this.autoFrame) {
      this.camera.left = -halfW;
      this.camera.right = halfW;
      this.camera.top = centerY + halfH;
      this.camera.bottom = centerY - halfH;
    } else {
      this.camera.left = -halfW + this.cameraOffset.x;
      this.camera.right = halfW + this.cameraOffset.x;
      this.camera.top = centerY + halfH + this.cameraOffset.y;
      this.camera.bottom = centerY - halfH + this.cameraOffset.y;
    }

    this.camera.updateProjectionMatrix();
  }

  setSky(altitudeKm) {
    let color = '#87b9ff';
    if (altitudeKm > 10 && altitudeKm <= 40) color = '#4a74b8';
    if (altitudeKm > 40) color = '#0b1023';
    this.renderer.setClearColor(color);
    this.clouds.visible = altitudeKm < 20;
    this.stars.children.forEach((star) => { star.visible = altitudeKm > 40; });
  }

  addFlame(active, x, y) {
    this.effects.clear();
    if (!active) return;

    const outer = new THREE.Shape();
    outer.moveTo(0, 0);
    outer.lineTo(0.3, -1.2);
    outer.lineTo(0, -0.9);
    outer.lineTo(-0.3, -1.2);
    const flame = this.createOutlinedShape(outer, '#f97316', false, 0.1);
    flame.position.set(x, y - 0.72, 0.1);

    const core = this.createRect(0.18, 0.72, '#fde68a', 0.12, 0.9);
    core.position.set(x, y - 1.18, 0.12);
    this.effects.add(flame, core);

    for (let i = 0; i < 14; i += 1) {
      const puff = this.createCircle(0.05 + Math.random() * 0.08, '#cbd5e1', 0.05, 0.45);
      puff.position.set(x + (Math.random() - 0.5) * 0.9, y - 1.2 - Math.random() * 0.7, 0.05);
      this.effects.add(puff);
    }
  }

  explosion(x, y) {
    this.effects.clear();
    for (let i = 0; i < 40; i += 1) {
      const spark = this.createCircle(0.06 + Math.random() * 0.08, i % 2 ? '#f97316' : '#facc15', 0.2, 0.95);
      spark.position.set(x + (Math.random() - 0.5) * 2.1, y + (Math.random() - 0.5) * 2.1, 0.2);
      this.effects.add(spark);
    }
  }

  resize(container) {
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  frame() {
    this.renderer.render(this.scene, this.camera);
  }
}
