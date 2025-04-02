'use strict';

class MotionSensor {
  constructor() {
    this.motion = 0;
    this.threshold = 0.3;
  }

  measure() {
    // Simulate motion measurement
    return Math.random();
  }
}

module.exports = MotionSensor; 