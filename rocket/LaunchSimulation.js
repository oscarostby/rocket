import { PhysicsEngine } from './PhysicsEngine.js';

export class LaunchSimulation {
  constructor(parts, renderer, onUpdate) {
    this.physics = new PhysicsEngine(parts);
    this.renderer = renderer;
    this.onUpdate = onUpdate;
    this.running = false;
    this.last = performance.now();
  }

  start() {
    const reason = this.physics.checkFailureBeforeLaunch();
    if (reason) {
      this.physics.failed = true;
      this.physics.reason = reason;
      this.onUpdate(this.physics);
      return;
    }
    this.running = true;
    this.loop();
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;

    this.physics.step(dt);
    this.onUpdate(this.physics);
    this.renderer.setSky(this.physics.altitude / 1000);

    if (this.physics.failed && this.physics.altitude <= 0.4) {
      this.renderer.explosion(0, this.physics.altitude / 180 + 1.2);
      this.renderer.addFlame(false, 0, 0);
      this.running = false;
      return;
    }

    this.renderer.addFlame(this.physics.fuel > 0 && !this.physics.failed, 0, this.physics.altitude / 180 + 2);
    requestAnimationFrame(() => this.loop());
  }
}
