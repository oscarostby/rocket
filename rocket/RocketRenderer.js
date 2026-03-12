import * as THREE from 'three';

export class RocketRenderer {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-8, 8, 8, -2, 0.1, 160);
    this.camera.position.set(0, 5, 18);
    this.camera.lookAt(0, 3, 0);

    this.zoom = 1;
    this.autoFrame = true;
    this.cameraOffset = { x: 0, y: 0 };

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'three-canvas';

    this.scene.add(new THREE.HemisphereLight('#c8e6ff', '#293b2f', 1.15));
    const key = new THREE.DirectionalLight('#fff4df', 1.35);
    key.position.set(9, 14, 12);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight('#8fb4ff', 0.65);
    fill.position.set(-9, 7, 10);
    this.scene.add(fill);

    this.grid = new THREE.GridHelper(46, 92, '#4da5ff', '#284771');
    this.grid.rotation.x = Math.PI / 2;
    this.grid.position.z = -2.4;
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
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), new THREE.MeshStandardMaterial({ color: '#2f9457', roughness: 0.9 }));
    ground.position.set(0, -2.4, -3.2);
    this.scene.add(ground);

    const pad = new THREE.Mesh(new THREE.BoxGeometry(7, 0.55, 2.4), new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.4, roughness: 0.45 }));
    pad.position.set(0, -1.8, -0.8);
    this.scene.add(pad);

    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), new THREE.MeshStandardMaterial({ color: '#97a3b7', metalness: 0.7, roughness: 0.35 }));
    gantry.position.set(-2.8, 1.1, -1);
    this.scene.add(gantry);

    this.clouds = new THREE.Group();
    for (let i = 0; i < 14; i += 1) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.65, 14, 14), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.42 }));
      cloud.position.set(-14 + i * 2.15, 4.4 + Math.random() * 3.5, -9);
      this.clouds.add(cloud);
    }
    this.scene.add(this.clouds);

    this.stars = new THREE.Group();
    for (let i = 0; i < 180; i += 1) {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      star.position.set((Math.random() - 0.5) * 45, 1 + Math.random() * 26, -16);
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

  makeMaterial(part, ghost, overrideColor = null) {
    return new THREE.MeshStandardMaterial({
      color: overrideColor || (ghost ? '#dbeafe' : part.color || '#cbd5e1'),
      transparent: ghost,
      opacity: ghost ? 0.45 : 1,
      roughness: 0.45,
      metalness: part.type === 'engine' ? 0.7 : 0.3
    });
  }

  makeFuelMesh(part, ghost) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(part.radius, part.radius, part.height * 0.86, 28), this.makeMaterial(part, ghost));
    const topCap = new THREE.Mesh(new THREE.SphereGeometry(part.radius * 0.96, 20, 14), this.makeMaterial(part, ghost, '#dbe7f5'));
    const bottomCap = new THREE.Mesh(new THREE.SphereGeometry(part.radius * 0.96, 20, 14), this.makeMaterial(part, ghost, '#d1dded'));
    topCap.scale.y = 0.35;
    bottomCap.scale.y = 0.35;
    topCap.position.y = part.height * 0.43;
    bottomCap.position.y = -part.height * 0.43;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(part.radius * 0.95, 0.03, 10, 30), this.makeMaterial(part, ghost, '#eff6ff'));
    stripe.rotation.x = Math.PI / 2;
    group.add(body, topCap, bottomCap, stripe);
    return group;
  }

  makeEngineMesh(part, ghost) {
    const group = new THREE.Group();
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(part.radius * 0.42, part.radius * 0.5, part.height * 0.35, 16), this.makeMaterial(part, ghost, '#4b5563'));
    chamber.position.y = part.height * 0.35;
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(part.radius * 0.38, part.radius, part.height * 0.75, 28), this.makeMaterial(part, ghost, '#6b7280'));
    bell.position.y = -part.height * 0.05;
    const nozzleRim = new THREE.Mesh(new THREE.TorusGeometry(part.radius * 0.94, 0.04, 10, 24), this.makeMaterial(part, ghost, '#1f2937'));
    nozzleRim.rotation.x = Math.PI / 2;
    nozzleRim.position.y = -part.height * 0.4;
    group.add(chamber, bell, nozzleRim);
    return group;
  }

  makeCommandMesh(part, ghost) {
    const group = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(part.radius * 0.55, part.radius, part.height * 0.55, 28), this.makeMaterial(part, ghost));
    cone.position.y = -part.height * 0.05;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(part.radius * 0.65, 20, 16), this.makeMaterial(part, ghost, '#dbeafe'));
    cap.position.y = part.height * 0.35;
    cap.scale.y = 0.75;
    const window = new THREE.Mesh(new THREE.CylinderGeometry(part.radius * 0.23, part.radius * 0.23, 0.05, 14), this.makeMaterial(part, ghost, '#0ea5e9'));
    window.rotation.x = Math.PI / 2;
    window.position.set(0, part.height * 0.05, part.radius * 0.5);
    group.add(cone, cap, window);
    return group;
  }

  partMesh(part, ghost = false) {
    let mesh;
    if (part.type === 'fuel') mesh = this.makeFuelMesh(part, ghost);
    else if (part.type === 'engine') mesh = this.makeEngineMesh(part, ghost);
    else if (part.type === 'command') mesh = this.makeCommandMesh(part, ghost);
    else if (part.type === 'fin') {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(part.radius, part.height, 3), this.makeMaterial(part, ghost));
      mesh.rotation.z = part.x >= 0 ? -Math.PI / 2 : Math.PI / 2;
    } else if (part.type === 'decoupler' || part.type === 'adapter') {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(part.radius * 0.85, part.radius, part.height, 24), this.makeMaterial(part, ghost, '#f4d694'));
    } else if (part.type === 'nosecone') {
      mesh = new THREE.Mesh(new THREE.ConeGeometry(part.radius, part.height, 28), this.makeMaterial(part, ghost, '#e2e8f0'));
    } else if (part.type === 'parachute') {
      const group = new THREE.Group();
      const can = new THREE.Mesh(new THREE.CylinderGeometry(part.radius * 0.85, part.radius * 0.85, part.height * 0.45, 20), this.makeMaterial(part, ghost));
      const cap = new THREE.Mesh(new THREE.SphereGeometry(part.radius * 0.75, 16, 12), this.makeMaterial(part, ghost, '#f472b6'));
      cap.position.y = part.height * 0.2;
      group.add(can, cap);
      mesh = group;
    } else {
      mesh = new THREE.Mesh(new THREE.CapsuleGeometry(part.radius * 0.9, Math.max(0.1, part.height - part.radius), 4, 16), this.makeMaterial(part, ghost));
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
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), new THREE.MeshBasicMaterial({ color: valid ? '#22c55e' : '#ef4444' }));
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
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.1, 16), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
    flame.position.set(x, y - 0.8, 0.2);
    flame.rotation.z = Math.PI;
    this.effects.add(flame);
    for (let i = 0; i < 14; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.1, 8, 8), new THREE.MeshBasicMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.42 }));
      puff.position.set(x + (Math.random() - 0.5) * 0.95, y - 1.1 - Math.random() * 0.8, -0.2);
      this.effects.add(puff);
    }
  }

  explosion(x, y) {
    this.effects.clear();
    for (let i = 0; i < 42; i += 1) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 8, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? '#f97316' : '#facc15' }));
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
