'use strict';

const AirSoundPixel = require('../air-sound-pixel');

describe('AirSoundPixel', () => {
  let airSoundPixel;
  let mockCallback;

  beforeEach(() => {
    airSoundPixel = new AirSoundPixel();
    mockCallback = jest.fn();
    airSoundPixel.setGestureCallback(mockCallback);
  });

  test('should initialize with default values', () => {
    expect(airSoundPixel.pressure).toBe(0);
    expect(airSoundPixel.motion).toBe(0);
  });

  test('should update pressure and motion values', () => {
    airSoundPixel.updatePressure(0.8);
    airSoundPixel.updateMotion(0.9);
    expect(airSoundPixel.pressure).toBe(0.8);
    expect(airSoundPixel.motion).toBe(0.9);
  });

  test('should detect air gestures', () => {
    airSoundPixel.updatePressure(0.8);
    airSoundPixel.updateMotion(0.9);
    expect(mockCallback).toHaveBeenCalled();
  });

  test('should calculate pressure-based effects', () => {
    airSoundPixel.updatePressure(0.8);
    airSoundPixel.updateMotion(0.9);
    const effects = airSoundPixel.calculateEffects();
    expect(effects.amplitude).toBe(0.8);
    expect(effects.opacity).toBe(0.9);
  });
}); 