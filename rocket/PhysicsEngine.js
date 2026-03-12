const G = 9.81;

export class PhysicsEngine {
  constructor(parts) {
    this.parts = parts;
    this.fuel = parts.reduce((sum, p) => sum + p.fuelCapacity, 0);
    this.altitude = 0;
    this.maxAltitude = 0;
    this.velocity = 0;
    this.failed = false;
    this.reason = '';
    this.spin = 0;
  }

  stats() {
    const mass = this.parts.reduce((sum, p) => sum + p.mass, 0) + this.fuel * 0.01;
    const thrust = this.parts.reduce((sum, p) => sum + p.thrust, 0);
    const drag = this.parts.reduce((sum, p) => sum + p.drag, 0);
    const stability = this.parts.reduce((sum, p) => sum + p.stability, 0);
    const control = this.parts.some((p) => p.type === 'command');
    const fins = this.parts.some((p) => p.type === 'fin');
    return { mass, thrust, twr: thrust / (mass * G), fuel: this.fuel, drag, stability, control, fins };
  }

  checkFailureBeforeLaunch() {
    const s = this.stats();
    if (!s.control) return 'No control module';
    if (s.twr < 1) return 'Thrust-to-weight < 1';
    if (!s.fins) return 'No fins: spin instability';
    return '';
  }

  step(dt) {
    if (this.failed) return;

    const s = this.stats();
    const thrustForce = this.fuel > 0 ? s.thrust : 0;
    if (this.fuel <= 0 && thrustForce <= 0) {
      this.failed = true;
      this.reason = 'Fuel exhausted';
    }

    const burnRate = 0.012 + Math.min(0.02, s.thrust / 15000);
    const fuelBurn = thrustForce > 0 ? Math.min(this.fuel, s.thrust * burnRate * dt) : 0;
    this.fuel -= fuelBurn;

    const airDensity = Math.max(0.08, 1 - this.altitude / 44000);
    const dragForce = s.drag * this.velocity * this.velocity * 0.018 * airDensity;
    const weight = s.mass * G;

    const torque = Math.max(0, 1.1 - s.stability) * (this.velocity > 25 ? 1 : 0.3);
    this.spin += torque * dt;
    if (s.fins) this.spin *= 0.94;

    if (this.spin > 1.4) {
      this.failed = true;
      this.reason = 'Rocket spun out of control';
    }

    const net = thrustForce - weight - dragForce - (this.spin * 4);
    const acceleration = net / s.mass;
    this.velocity += acceleration * dt;
    this.altitude = Math.max(0, this.altitude + this.velocity * dt);
    this.maxAltitude = Math.max(this.maxAltitude, this.altitude);

    if (this.velocity < -55 && this.altitude < 1) {
      this.failed = true;
      this.reason = this.reason || 'Impact explosion';
    }
  }
}
