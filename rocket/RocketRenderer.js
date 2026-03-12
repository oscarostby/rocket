import * as THREE from 'three';

export class RocketRenderer {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-8, 8, 8, -2, 0.1, 160);
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);

    this.zoom = 1;
    this.autoFrame = true;
    this.cameraOffset = { x: 0, y: 0 };

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor('#7ec4ff');
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'three-canvas';

    this.grid = new THREE.GridHelper(46, 92, '#4da5ff', '#284771');
    this.grid.rotation.x = Math.PI / 2;
    this.grid.position.z = -1.4;
    this.scene.add(this.grid);

    this.partGroup = new THREE.Group();
    this.snapGroup = new THREE.Group();
    this.effects = new THREE.Group();
    this.scene.add(this.partGroup, this.snapGroup, this.effects);

    this.addEnvironment();
    window.addEventListener('resize', () => this.resize(container));
    this.resize(container);
  }

  addEnvironment() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), new THREE.MeshBasicMaterial({ color: '#2f9457' }));
    ground.position.set(0, -2.4, -2.2);
    this.scene.add(ground);

    const pad = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.65), new THREE.MeshBasicMaterial({ color: '#4b5563' }));
    pad.position.set(0, -1.85, -0.8);
    this.scene.add(pad);

    const gantry = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 7), new THREE.MeshBasicMaterial({ color: '#6b7280' }));
    gantry.position.set(-2.8, 1.1, -0.8);
    this.scene.add(gantry);

    this.clouds = new THREE.Group();
    for (let i = 0; i < 14; i += 1) {
      const cloud = new THREE.Mesh(new THREE.CircleGeometry(0.35 + Math.random() * 0.65, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.42 }));
      cloud.position.set(-14 + i * 2.15, 4.4 + Math.random() * 3.5, -3.5);
      this.clouds.add(cloud);
    }
    this.scene.add(this.clouds);

    this.stars = new THREE.Group();
    for (let i = 0; i < 180; i += 1) {
      const star = new THREE.Mesh(new THREE.CircleGeometry(0.03 + Math.random() * 0.04, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      star.position.set((Math.random() - 0.5) * 45, 1 + Math.random() * 26, -3.6);
      star.visible = false;
      this.stars.add(star);
    }
    this.scene.add(this.stars);
  }

  setAutoFrame(enabled) { this.autoFrame = enabled; }
  resetCameraOffset() { this.cameraOffset = { x: 0, y: 0 }; }
  pan(dxWorld, dyWorld) {
    this.cameraOffset.x += dxWorld;
    this.cameraOffset.y += dyWorld;
  }

  fill(color, ghost = false) {
    return new THREE.MeshBasicMaterial({ color, transparent: ghost, opacity: ghost ? 0.5 : 1 });
  }

  rect(width, height, color, ghost = false) {
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.fill(color, ghost));
  }

  capsule2D(radius, bodyHeight, color, ghost = false) {
    const g = new THREE.Group();
    const body = this.rect(radius * 2, bodyHeight, color, ghost);
    const top = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), this.fill(color, ghost));
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), this.fill(color, ghost));
    top.position.y = bodyHeight / 2;
    bottom.position.y = -bodyHeight / 2;
    g.add(body, top, bottom);
    return g;
  }

  triangle(width, height, color, ghost = false) {
    const shape = new THREE.Shape();
    shape.moveTo(0, height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(-width / 2, -height / 2);
    shape.closePath();
    return new THREE.Mesh(new THREE.ShapeGeometry(shape), this.fill(color, ghost));
  }

  partMesh(part, ghost = false) {
    let mesh;
    if (part.type === 'fuel') {
      mesh = this.capsule2D(part.radius, part.height - (part.radius * 0.8), part.color || '#b4bcc8', ghost);
    } else if (part.type === 'engine') {
      const group = new THREE.Group();
      const mount = this.rect(part.radius * 1.1, part.height * 0.25, '#4b5563', ghost);
      mount.position.y = part.height * 0.35;
      const bell = this.triangle(part.radius * 1.9, part.height * 0.8, '#6b7280', ghost);
      bell.position.y = -part.height * 0.05;
      group.add(mount, bell);
      mesh = group;
    } else if (part.type === 'command') {
      const group = new THREE.Group();
      const pod = this.triangle(part.radius * 1.9, part.height * 0.9, part.color || '#9ab8ff', ghost);
      pod.rotation.z = Math.PI;
      pod.position.y = part.height * 0.02;
      const cabin = this.rect(part.radius * 1.4, part.height * 0.35, '#c7d8f9', ghost);
      cabin.position.y = -part.height * 0.2;
      const window = this.rect(part.radius * 0.45, part.height * 0.16, '#0ea5e9', ghost);
      window.position.y = part.height * 0.04;
      group.add(pod, cabin, window);
      mesh = group;
    } else if (part.type === 'fin') {
      mesh = this.triangle(part.radius * 1.6, part.height, part.color || '#39b56f', ghost);
      mesh.rotation.z = part.x >= 0 ? -Math.PI / 2 : Math.PI / 2;
    } else if (part.type === 'decoupler' || part.type === 'adapter') {
      mesh = this.rect(part.radius * 2, part.height, '#f4d694', ghost);
    } else if (part.type === 'nosecone') {
      mesh = this.triangle(part.radius * 1.8, part.height, '#e2e8f0', ghost);
    } else if (part.type === 'parachute') {
      const group = new THREE.Group();
      const can = this.rect(part.radius * 1.4, part.height * 0.4, part.color || '#ff6ba0', ghost);
      const canopy = new THREE.Mesh(new THREE.CircleGeometry(part.radius * 0.8, 24, 0, Math.PI), this.fill('#f472b6', ghost));
      canopy.position.y = part.height * 0.12;
      group.add(can, canopy);
      mesh = group;
    } else {
      mesh = this.rect(part.radius * 2, part.height, part.color || '#cbd5e1', ghost);
    }

    mesh.position.set(part.x, part.y, 0);
    mesh.rotation.z += part.rotation || 0;
    return mesh;
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
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.12, 20), new THREE.MeshBasicMaterial({ color: valid ? '#22c55e' : '#ef4444', side: THREE.DoubleSide }));
      ring.position.set(n.world.x, n.world.y, 1.2);
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
    let color = '#7ec4ff';
    if (altitudeKm > 10 && altitudeKm <= 40) color = '#284786';
    if (altitudeKm > 40) color = '#050816';
    this.renderer.setClearColor(color);
    this.clouds.visible = altitudeKm < 20;
    this.stars.children.forEach((star) => { star.visible = altitudeKm > 40; });
    this.grid.visible = altitudeKm < 18;
  }

  addFlame(active, x, y) {
    this.effects.clear();
    if (!active) return;
    const flame = this.triangle(0.46, 1.1, '#fb923c');
    flame.rotation.z = Math.PI;
    flame.position.set(x, y - 0.8, 0.2);
    this.effects.add(flame);
    for (let i = 0; i < 14; i += 1) {
      const puff = new THREE.Mesh(new THREE.CircleGeometry(0.06 + Math.random() * 0.1, 10), new THREE.MeshBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.42 }));
      puff.position.set(x + (Math.random() - 0.5) * 0.95, y - 1.1 - Math.random() * 0.8, -0.2);
      this.effects.add(puff);
    }
  }

  explosion(x, y) {
    this.effects.clear();
    for (let i = 0; i < 42; i += 1) {
      const spark = new THREE.Mesh(new THREE.CircleGeometry(0.08 + Math.random() * 0.08, 10), new THREE.MeshBasicMaterial({ color: i % 2 ? '#f97316' : '#facc15' }));
      spark.position.set(x + (Math.random() - 0.5) * 2.1, y + (Math.random() - 0.5) * 2.1, 0.4);
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
