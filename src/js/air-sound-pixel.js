'use strict';

const AirPressureSensor = require('./sensors/air-pressure-sensor');
const MotionSensor = require('./sensors/motion-sensor');

class AirSoundPixel {
  constructor() {
    this.isInitialized = false;
    this.pressure = 0;
    this.motion = 0;
    this.gestureHistory = [];
    this.gestureRecognizer = null;
    this.airData = {
      pressure: 0,
      movement: { x: 0, y: 0, z: 0 },
      gestures: [],
    };
    this.visualizationParams = {
      amplitude: 0.5,
      frequency: 1.0,
      color: [1.0, 1.0, 1.0],
      opacity: 0.8,
    };
    this.callbacks = new Map();
    this.pressureSensor = new AirPressureSensor();
    this.motionSensor = new MotionSensor();
    this.gestureCallback = null;
    this.lastGestureTime = 0;
    this.gestureThreshold = 0.7;
    this.gestureCooldown = 500; // ms
  }

  async initialize() {
    try {
      // Initialize air pressure sensor
      if ('AirPressureSensor' in window) {
        this.pressureSensor = new AirPressureSensor({ frequency: 60 });
        await this.pressureSensor.start();
        this.pressureSensor.addEventListener('reading', () => this.handlePressureReading());
      }

      // Initialize motion sensor
      if ('MotionSensor' in window) {
        this.motionSensor = new MotionSensor({ frequency: 60 });
        await this.motionSensor.start();
        this.motionSensor.addEventListener('reading', () => this.handleMotionReading());
      }

      // Initialize gesture recognition
      this.initializeGestureRecognition();

      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error('Failed to initialize AirSoundPixel:', error);

      return false;
    }
  }

  initializeGestureRecognition() {
    // Define gesture patterns
    this.gesturePatterns = {
      swipe: {
        threshold: 0.5,
        duration: 500,
      },
      wave: {
        threshold: 0.3,
        duration: 1000,
      },
      pinch: {
        threshold: 0.2,
        duration: 300,
      },
    };

    // Initialize gesture recognition logic
    this.gestureRecognizer = {
      patterns: new Map(),
      currentGesture: null,
      startTime: 0,
      startPosition: { x: 0, y: 0, z: 0 },
    };
  }

  handlePressureReading() {
    if (!this.isInitialized) return;

    const { pressure } = this.pressureSensor;
    this.pressure = pressure;
    this.airData.pressure = pressure;

    // Convert pressure to visualization parameters
    this.visualizationParams.amplitude = Math.min(1.0, pressure / 1000);
    this.visualizationParams.opacity = Math.min(1.0, pressure / 2000);

    // Trigger pressure change callback
    this.triggerCallback('pressure', this.visualizationParams);
  }

  handleMotionReading() {
    if (!this.isInitialized) return;

    const { x, y, z } = this.motionSensor;
    this.motion = Math.sqrt(x * x + y * y + z * z);
    this.airData.movement = { x, y, z };

    // Update visualization parameters based on movement
    this.visualizationParams.frequency = Math.sqrt(this.motion) * 2;
    this.visualizationParams.color = this.calculateColorFromMovement(x, y, z);

    // Detect gestures
    this.detectGestures();

    // Trigger movement callback
    this.triggerCallback('movement', this.visualizationParams);
  }

  calculateColorFromMovement(x, y, z) {
    // Convert movement to RGB color
    const r = Math.min(1.0, Math.abs(x) * 2);
    const g = Math.min(1.0, Math.abs(y) * 2);
    const b = Math.min(1.0, Math.abs(z) * 2);

    return [r, g, b];
  }

  detectGestures() {
    const { x, y, z } = this.airData.movement;
    const currentTime = Date.now();

    // Detect swipe gesture
    if (Math.abs(x) > this.gesturePatterns.swipe.threshold) {
      if (!this.gestureRecognizer.currentGesture) {
        this.gestureRecognizer.currentGesture = 'swipe';
        this.gestureRecognizer.startTime = currentTime;
        this.gestureRecognizer.startPosition = { x, y, z };
      }
    }

    // Detect wave gesture
    if (Math.abs(y) > this.gesturePatterns.wave.threshold) {
      if (!this.gestureRecognizer.currentGesture) {
        this.gestureRecognizer.currentGesture = 'wave';
        this.gestureRecognizer.startTime = currentTime;
        this.gestureRecognizer.startPosition = { x, y, z };
      }
    }

    // Detect pinch gesture
    if (Math.abs(z) > this.gesturePatterns.pinch.threshold) {
      if (!this.gestureRecognizer.currentGesture) {
        this.gestureRecognizer.currentGesture = 'pinch';
        this.gestureRecognizer.startTime = currentTime;
        this.gestureRecognizer.startPosition = { x, y, z };
      }
    }

    // Check if gesture is complete
    if (this.gestureRecognizer.currentGesture) {
      const duration = currentTime - this.gestureRecognizer.startTime;
      const pattern = this.gesturePatterns[this.gestureRecognizer.currentGesture];

      if (duration >= pattern.duration) {
        this.triggerCallback('gesture', {
          type: this.gestureRecognizer.currentGesture,
          duration,
          intensity: Math.max(Math.abs(x), Math.abs(y), Math.abs(z)),
        });
        this.gestureRecognizer.currentGesture = null;
      }
    }
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event).add(callback);
  }

  off(event, callback) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).delete(callback);
    }
  }

  triggerCallback(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach((callback) => callback(data));
    }
  }

  getVisualizationParams() {
    return { ...this.visualizationParams };
  }

  getAirData() {
    return { ...this.airData };
  }

  stop() {
    if (this.pressureSensor) {
      this.pressureSensor.stop();
    }
    if (this.motionSensor) {
      this.motionSensor.stop();
    }
    this.isInitialized = false;
  }

  updatePressure(value) {
    this.pressure = Math.max(0, Math.min(1, value));
    this.checkForGestures();
  }

  updateMotion(value) {
    this.motion = Math.max(0, Math.min(1, value));
    this.checkForGestures();
  }

  setGestureCallback(callback) {
    this.gestureCallback = callback;
  }

  checkForGestures() {
    const now = Date.now();
    if (now - this.lastGestureTime < this.gestureCooldown) {
      return;
    }

    if (this.pressure > this.gestureThreshold && this.motion > this.gestureThreshold) {
      this.lastGestureTime = now;
      if (this.gestureCallback) {
        this.gestureCallback();
      }
    }
  }

  calculateEffects() {
    return {
      amplitude: this.pressure,
      opacity: this.motion,
    };
  }
}

module.exports = AirSoundPixel;
