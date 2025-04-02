'use strict';

class AirPressureSensor {
  constructor() {
    this.pressure = 0;
    this.threshold = 0.5;
  }

  measure() {
    // Simulate pressure measurement
    return Math.random();
  }
}

module.exports = AirPressureSensor; 