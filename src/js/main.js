'use strict';

const Interface = require('./interface');
const WebGLVisualizer = require('./webgl');
const AudioManager = require('./audio');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const interfaceInstance = new Interface();
  const visualizer = new WebGLVisualizer();

  interfaceInstance.init();
  visualizer.init();
  AudioManager.init();
});
